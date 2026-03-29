<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access. Token missing."]);
    exit();
}

$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token. Please log in again."]);
    exit();
}

if (!isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Only doctors can access this resource."]);
    exit();
}

$doctorId = $decodedToken['user_id'];

global $pdo;

switch ($method) {
    case 'GET':
        if ($action === 'get_payment_history') {
            handleGetPaymentHistory($pdo, $doctorId);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid or unspecified GET action."]);
        }
        break;
    case 'DELETE':
        if ($action === 'delete_payment_record') {
            handleDeletePaymentRecord($pdo, $doctorId);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid or unspecified DELETE action."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed."]);
        break;
}

function handleGetPaymentHistory($pdo, $doctorId) {
    try {
        $stmt = $pdo->prepare("SELECT
                                    ph.payment_record_id as id,
                                    ph.appointment_id,
                                    ph.amount,
                                    ph.currency,
                                    ph.stripe_payment_id as paymentId,
                                    ph.payment_status as paymentStatus,
                                    ph.created_at as createdAt,
                                    ph.platform_fee,
                                    ph.amount_transferred,
                                    ph.transfer_status,
                                    ph.stripe_transfer_id,
                                    up.full_name as patientName,
                                    up.email as patientEmail,
                                    a.appointment_date as date,
                                    a.appointment_time as time,
                                    a.status as consultationStatus
                                FROM payments_history ph
                                JOIN users_patients up ON ph.patient_id = up.patient_id
                                JOIN appointments a ON ph.appointment_id = a.appointment_id
                                WHERE ph.doctor_id = ?
                                ORDER BY ph.created_at DESC");
        $stmt->execute([$doctorId]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($payments as &$payment) {
            $payment['amount'] = (float)$payment['amount'];
            $payment['platform_fee'] = $payment['platform_fee'] !== null ? (float)$payment['platform_fee'] : null;
            $payment['amount_transferred'] = $payment['amount_transferred'] !== null ? (float)$payment['amount_transferred'] : null;
        }

        echo json_encode([
            "success" => true,
            "message" => "Payment history found.",
            "payments" => $payments
        ]);

    } catch (PDOException $e) {
        error_log("Error fetching payment history: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while fetching payment history."]);
    } catch (Exception $e) {
        error_log("Unexpected error in handleGetPaymentHistory: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unexpected server error while fetching payment history."]);
    }
}

function handleDeletePaymentRecord($pdo, $doctorId) {
    $paymentRecordId = $_GET['payment_record_id'] ?? null;

    if (!$paymentRecordId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Payment record ID is required for deletion."]);
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT doctor_id, payment_status, transfer_status FROM payments_history WHERE payment_record_id = ?");
        $stmt->execute([$paymentRecordId]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record || $record['doctor_id'] != $doctorId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Access denied or payment record not found for this doctor."]);
            exit();
        }

        if ($record['payment_status'] === 'paid' && $record['transfer_status'] === 'released') {
             http_response_code(400);
             echo json_encode(["success" => false, "message" => "Cannot delete a record with a completed transfer."]);
             exit();
        }
        
        if ($record['payment_status'] === 'refunded') {
             http_response_code(400);
             echo json_encode(["success" => false, "message" => "Cannot delete a refunded record."]);
             exit();
        }

        $stmt = $pdo->prepare("DELETE FROM payments_history WHERE payment_record_id = ?");
        $stmt->execute([$paymentRecordId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Payment record physically deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "No changes made or payment record not found."]);
        }

    } catch (PDOException $e) {
        error_log("Error deleting payment record: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while deleting payment record."]);
    } catch (Exception $e) {
        error_log("Unexpected error while deleting payment record: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unexpected server error while deleting payment record."]);
    }
}
?>
