<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'] ?? 'your_super_secret_jwt_key';
$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'];

if (!isset($pdo) || !$pdo instanceof PDO) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection error. Check config.php."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

if ($method === 'POST' && $action === 'login') {
    handleAdminLogin($pdo, $secretKey);
    exit();
}

if (!authenticateAdmin($secretKey)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authentication failed."]);
    exit();
}

switch ($method) {
    case 'POST':
        if ($action === 'update_env_settings') {
            handleUpdateEnvSettings();
        } elseif ($action === 'toggle_doctor_status') {
            handleToggleUserStatus($pdo, 'doctor');
        } elseif ($action === 'toggle_doctor_approval') { 
            handleToggleMedBookingroval($pdo);
        } elseif ($action === 'toggle_patient_status') {
            handleToggleUserStatus($pdo, 'patient');
        } elseif ($action === 'admin_force_completion') {
            handleAdminForceCompletion($pdo, $stripeSecretKey);
        } elseif ($action === 'admin_confirm_manual_payout') {
            handleAdminConfirmManualPayout($pdo);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid or unspecified POST action."]);
        }
        break;

    case 'GET':
        switch ($action) {
            case 'get_doctors':
                handleGetDoctors($pdo);
                break;
            case 'get_patients':
                handleGetPatients($pdo);
                break;
            case 'get_appointments':
                handleGetAppointments($pdo);
                break;
            case 'get_stats':
                handleGetStats($pdo);
                break;
            case 'get_env_settings':
                handleGetEnvSettings();
                break;
            case 'get_doctor_financials':
                handleGetDoctorFinancials($pdo);
                break;
            case 'get_financial_overview':
                handleGetFinancialOverview($pdo);
                break;
            default:
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid or unspecified GET action for the admin dashboard."]);
                break;
        }
        break;

    case 'DELETE':
        if ($action === 'delete_doctor') {
            handleDeleteUser($pdo, 'doctor', $_GET['id'] ?? null);
        } elseif ($action === 'delete_patient') {
            handleDeleteUser($pdo, 'patient', $_GET['id'] ?? null);
        } elseif ($action === 'delete_doctor_permanent') {
            handlePermanentDeleteUser($pdo, 'doctor', $_GET['id'] ?? null);
        } elseif ($action === 'delete_patient_permanent') {
            handlePermanentDeleteUser($pdo, 'patient', $_GET['id'] ?? null);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid DELETE action or missing ID."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed for this endpoint."]);
        break;
}

function authenticateAdmin($secretKey) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = null;

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (!$token) {
        return false;
    }

    $decodedToken = decodeJwtToken($token, $secretKey);

    if (!$decodedToken) {
        return false;
    }

    if (!isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'admin') {
        return false;
    }
    return true;
}

function handleAdminLogin($pdo, $secretKey) {
    $input = json_decode(file_get_contents('php://input'), true);

    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $adminUsernameEnv = $_ENV['ADMIN_USERNAME'] ?? '';
    $adminPasswordEnv = $_ENV['ADMIN_PASSWORD'] ?? '';

    if ($username === $adminUsernameEnv && $password === $adminPasswordEnv) {
        $adminUserId = 1;
        $token = generateJwtToken($adminUserId, 'admin', $username . '@admin.com', $secretKey);

        echo json_encode([
            "success" => true,
            "message" => "Administrator login successful!",
            "token" => $token,
            "user_id" => $adminUserId,
            "user_type" => "admin",
            "username" => $username
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid administrator credentials."]);
    }
}

function handleGetEnvSettings() {
    try {
        $settings = [
            'ADMIN_USERNAME' => $_ENV['ADMIN_USERNAME'] ?? '',
            'ADMIN_PASSWORD' => $_ENV['ADMIN_PASSWORD'] ?? '',
            'MAIL_HOST' => $_ENV['MAIL_HOST'] ?? '',
            'MAIL_PORT' => $_ENV['MAIL_PORT'] ?? '',
            'MAIL_USERNAME' => $_ENV['MAIL_USERNAME'] ?? '',
            'MAIL_PASSWORD' => $_ENV['MAIL_PASSWORD'] ?? '',
            'MAIL_FROM_NAME' => $_ENV['MAIL_FROM_NAME'] ?? '',
            'STRIPE_SECRET_KEY' => $_ENV['STRIPE_SECRET_KEY'] ?? '',
            'STRIPE_PUBLIC_KEY' => $_ENV['STRIPE_PUBLIC_KEY'] ?? '',
            'STRIPE_WEBHOOK_SECRET' => $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '',
            'PLATFORM_FEE_PERCENTAGE' => $_ENV['PLATFORM_FEE_PERCENTAGE'] ?? '10',
        ];
        echo json_encode(["success" => true, "settings" => $settings]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal error when fetching settings."]);
    }
}

function handleUpdateEnvSettings() {
    $input = json_decode(file_get_contents('php://input'), true);
    $envFilePath = dirname(__DIR__) . '/.env';

    if (!file_exists($envFilePath)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => ".env file not found."]);
        return;
    }

    $envContent = file_get_contents($envFilePath);
    $lines = explode("\n", $envContent);
    $updatedLines = [];
    $updatedKeys = [];

    foreach ($lines as $line) {
        $found = false;
        foreach ($input as $key => $value) {
            if (strpos(trim($line), $key . '=') === 0) {
                $updatedLines[] = $key . '="' . $value . '"';
                $updatedKeys[] = $key;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $updatedLines[] = $line;
        }
    }

    foreach ($input as $key => $value) {
        if (!in_array($key, $updatedKeys)) {
            $updatedLines[] = $key . '="' . $value . '"';
        }
    }

    $newEnvContent = implode("\n", $updatedLines);

    if (file_put_contents($envFilePath, $newEnvContent) !== false) {
        echo json_encode(["success" => true, "message" => ".env settings updated successfully!"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error writing to .env file."]);
    }
}

function handleGetDoctors($pdo) {
    try {
        $sql = "SELECT doctor_id, full_name, email, phone_number, specialization, is_active, is_approved, created_at, crm_number, stripe_connect_id, stripe_onboarding_complete FROM users_doctors ORDER BY full_name ASC";
        $stmt = $pdo->query($sql);
        $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "doctors" => $doctors]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching doctors."]);
    }
}

function handleGetPatients($pdo) {
    try {
        $sql = "SELECT patient_id, full_name, email, phone_number, whatsapp_number, is_active, created_at FROM users_patients ORDER BY full_name ASC";
        $stmt = $pdo->query($sql);
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "patients" => $patients]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching patients."]);
    }
}

function handleGetAppointments($pdo) {
    try {
        $sql = "SELECT 
                    a.appointment_id, 
                    a.appointment_date, 
                    a.appointment_time, 
                    a.status, 
                    a.payment_status,
                    a.consultation_fee, 
                    up.full_name AS patient_name, 
                    ud.full_name AS doctor_name, 
                    ud.specialization AS doctor_specialization, 
                    ud.doctor_id,
                    ph.transfer_status,
                    ph.payment_record_id
                FROM appointments a 
                JOIN users_patients up ON a.patient_id = up.patient_id 
                JOIN users_doctors ud ON a.doctor_id = ud.doctor_id
                LEFT JOIN payments_history ph ON a.stripe_payment_id = ph.stripe_payment_id
                ORDER BY a.appointment_date DESC, a.appointment_time DESC";
        $stmt = $pdo->query($sql);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "appointments" => $appointments]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching appointments."]);
    }
}

function handleGetStats($pdo) {
    try {
        $totalDoctors = $pdo->query("SELECT COUNT(*) FROM users_doctors")->fetchColumn();
        $totalPatients = $pdo->query("SELECT COUNT(*) FROM users_patients")->fetchColumn();
        $totalAppointments = $pdo->query("SELECT COUNT(*) FROM appointments")->fetchColumn();
        $pendingAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'confirmed' AND payment_status = 'paid'")->fetchColumn();
        $completedAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'completed'")->fetchColumn();

        echo json_encode([
            "success" => true,
            "stats" => [
                "total_doctors" => (int)$totalDoctors,
                "total_patients" => (int)$totalPatients,
                "total_appointments" => (int)$totalAppointments,
                "pending_appointments" => (int)$pendingAppointments,
                "completed_appointments" => (int)$completedAppointments,
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching statistics."]);
    }
}

function handleGetDoctorFinancials($pdo) {
    try {
        $sql = "SELECT 
                    ud.doctor_id, 
                    ud.full_name AS doctor_name, 
                    SUM(ph.amount_transferred) AS total_earnings
                FROM users_doctors ud 
                LEFT JOIN payments_history ph ON ud.doctor_id = ph.doctor_id 
                WHERE ph.transfer_status = 'released'
                GROUP BY ud.doctor_id, ud.full_name 
                ORDER BY total_earnings DESC";
        $stmt = $pdo->query($sql);
        $financials = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($financials as &$f) {
            $f['total_earnings'] = (float)$f['total_earnings'];
        }
        unset($f);

        echo json_encode(["success" => true, "financials" => $financials]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching earnings."]);
    }
}

function handleGetFinancialOverview($pdo) {
    try {
        $platformRevenue = $pdo->query("SELECT SUM(platform_fee) FROM payments_history WHERE transfer_status = 'released'")->fetchColumn();
        $fundsHeld = $pdo->query("SELECT SUM(amount) FROM payments_history WHERE payment_status = 'paid' AND (transfer_status = 'pending' OR transfer_status = 'manual_pending' OR transfer_status = 'awaiting_admin_payout')")->fetchColumn();
        $totalTransacted = $pdo->query("SELECT SUM(amount) FROM payments_history WHERE payment_status = 'paid'")->fetchColumn();

        echo json_encode([
            "success" => true,
            "overview" => [
                "platform_revenue" => (float)($platformRevenue ?? 0),
                "funds_held" => (float)($fundsHeld ?? 0),
                "total_transacted" => (float)($totalTransacted ?? 0),
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching financial overview."]);
    }
}


function handleToggleUserStatus($pdo, $type) {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input["{$type}_id"] ?? null;
    $isActive = $input['is_active'] ?? null;

    if (!$id || !isset($isActive)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid user ID or status."]);
        exit();
    }

    $tableName = ($type === 'doctor') ? 'users_doctors' : 'users_patients';
    $idField = ($type === 'doctor') ? 'doctor_id' : 'patient_id';

    try {
        $sql = "UPDATE {$tableName} SET is_active = ?, updated_at = NOW() WHERE {$idField} = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$isActive, $id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "{$type} status updated successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "No changes made or {$type} not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while updating status."]);
    }
}

function handleToggleMedBookingroval($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input["doctor_id"] ?? null;
    $isApproved = $input['is_approved'] ?? null;

    if (!$id || !isset($isApproved)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid doctor ID or approval status."]);
        exit();
    }

    try {
        $sql = "UPDATE users_doctors SET is_approved = ?, updated_at = NOW() WHERE doctor_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$isApproved, $id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Doctor approval status updated successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "No changes made or doctor not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while updating approval status."]);
    }
}

function handleDeleteUser($pdo, $type, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "User ID missing."]);
        exit();
    }

    $tableName = ($type === 'doctor') ? 'users_doctors' : 'users_patients';
    $idField = ($type === 'doctor') ? 'doctor_id' : 'patient_id';

    try {
        $sql = "UPDATE {$tableName} SET is_active = 0, updated_at = NOW() WHERE {$idField} = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "{$type} deactivated successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "No changes made or {$type} not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while deactivating {$type}."]);
    }
}

function handlePermanentDeleteUser($pdo, $type, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "User ID missing for permanent deletion."]);
        exit();
    }

    $tableName = ($type === 'doctor') ? 'users_doctors' : 'users_patients';
    $idField = ($type === 'doctor') ? 'doctor_id' : 'patient_id';

    try {
        $sql = "DELETE FROM {$tableName} WHERE {$idField} = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "{$type} permanently deleted successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "No deletion made or {$type} not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while permanently deleting {$type}. Details: " . $e->getMessage()]);
    }
}

function handleAdminForceCompletion($pdo, $stripeSecretKey) {
    $input = json_decode(file_get_contents('php://input'), true);
    $appointmentId = $input['appointment_id'] ?? null;

    if (!$appointmentId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Appointment ID is required."]);
        exit();
    }
    
    $result = triggerStripeTransfer($pdo, $stripeSecretKey, $appointmentId);
    
    http_response_code($result['code']);
    echo json_encode($result['response']);
    exit();
}

function handleAdminConfirmManualPayout($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $paymentRecordId = $input['payment_record_id'] ?? null;

    if (!$paymentRecordId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Payment Record ID is required."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT payment_record_id, transfer_status FROM payments_history WHERE payment_record_id = ? FOR UPDATE");
        $stmt->execute([$paymentRecordId]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) {
             $pdo->rollBack();
             http_response_code(404);
             echo json_encode(["success" => false, "message" => "Payment record not found."]);
             exit();
        }

        if ($record['transfer_status'] !== 'awaiting_admin_payout') {
             $pdo->rollBack();
             http_response_code(400);
             echo json_encode(["success" => false, "message" => "This payment is not awaiting manual payout. Status: " . $record['transfer_status']]);
             exit();
        }

        $updatePayment = $pdo->prepare("UPDATE payments_history SET 
                                            transfer_status = 'released', 
                                            updated_at = NOW() 
                                        WHERE payment_record_id = ?");
        $updatePayment->execute([$paymentRecordId]);

        $pdo->commit();

        echo json_encode(["success" => true, "message" => "Manual payout confirmed. Funds marked as released."]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("PDO Error in handleAdminConfirmManualPayout: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error during manual payout confirmation."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("General Error in handleAdminConfirmManualPayout: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "An unexpected error occurred."]);
    }
}

function triggerStripeTransfer($pdo, $stripeSecretKey, $appointmentId, $patientId = null) {
    global $pdo;
    \Stripe\Stripe::setApiKey($stripeSecretKey);

    try {
        $pdo->beginTransaction();

        $sql = "SELECT 
                    a.appointment_id, a.doctor_id, a.patient_id, a.status,
                    ph.payment_record_id, ph.amount, ph.currency, ph.stripe_charge_id, ph.transfer_status,
                    ud.stripe_connect_id
                FROM appointments a
                JOIN payments_history ph ON a.stripe_payment_id = ph.stripe_payment_id
                JOIN users_doctors ud ON a.doctor_id = ud.doctor_id
                WHERE a.appointment_id = ? FOR UPDATE";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$appointmentId]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            $pdo->rollBack();
            return ['code' => 404, 'response' => ["success" => false, "message" => "Appointment or payment record not found."]];
        }
        
        if ($patientId && $data['patient_id'] != $patientId) {
             $pdo->rollBack();
             return ['code' => 403, 'response' => ["success" => false, "message" => "Access denied. You can only confirm your own appointments."]];
        }

        if ($data['status'] === 'completed' || $data['transfer_status'] === 'released' || $data['transfer_status'] === 'awaiting_admin_payout' || $data['transfer_status'] === 'manual_paid_out') {
            $pdo->rollBack();
            return ['code' => 400, 'response' => ["success" => false, "message" => "This appointment has already been completed and funds released."]];
        }
        
        if ($data['status'] === 'cancelled' || $data['status'] === 'failed') {
            $pdo->rollBack();
            return ['code' => 400, 'response' => ["success" => false, "message" => "Cannot complete a cancelled or failed appointment."]];
        }

        $platformFeePercentage = (float)($_ENV['PLATFORM_FEE_PERCENTAGE'] ?? 10);
        $totalAmount = (float)$data['amount'];
        $platformFee = round($totalAmount * ($platformFeePercentage / 100), 2);
        $amountToTransfer = $totalAmount - $platformFee;
        $amountToTransferInCents = round($amountToTransfer * 100);

        if ($amountToTransferInCents <= 0) {
             $platformFee = $totalAmount;
             $amountToTransfer = 0;
             error_log("Amount to transfer is zero or negative for appointment {$appointmentId}. Platform fee takes all.");
        }

        $transfer = null;
        $finalTransferStatus = $data['transfer_status'];
        $stripeTransferId = null;

        if ($data['transfer_status'] === 'pending') {
            // Automatic Flow
            if (empty($data['stripe_connect_id'])) {
                $pdo->rollBack();
                return ['code' => 500, 'response' => ["success" => false, "message" => "Doctor has no Stripe Connect account configured."]];
            }
            if (empty($data['stripe_charge_id'])) {
                $pdo->rollBack();
                return ['code' => 500, 'response' => ["success" => false, "message" => "Missing Stripe charge ID, cannot create transfer."]];
            }

            if ($amountToTransferInCents > 0) {
                $transfer = \Stripe\Transfer::create([
                    'amount' => $amountToTransferInCents,
                    'currency' => $data['currency'],
                    'destination' => $data['stripe_connect_id'],
                    'source_transaction' => $data['stripe_charge_id'],
                    'transfer_group' => $data['appointment_id'],
                ]);
                $stripeTransferId = $transfer->id;
            }
            $finalTransferStatus = 'released';

        } elseif ($data['transfer_status'] === 'manual_pending') {
            // Manual Flow - Admin is forcing completion (same as patient confirming).
            $finalTransferStatus = 'awaiting_admin_payout';
            $stripeTransferId = null;
        } else {
            $pdo->rollBack();
            return ['code' => 400, 'response' => ["success" => false, "message" => "Cannot complete an appointment with status: " . $data['transfer_status']]];
        }

        $updateAppt = $pdo->prepare("UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE appointment_id = ?");
        $updateAppt->execute([$appointmentId]);

        $updatePayment = $pdo->prepare("UPDATE payments_history SET 
                                            platform_fee = ?, 
                                            amount_transferred = ?, 
                                            stripe_transfer_id = ?, 
                                            transfer_status = ?, 
                                            updated_at = NOW() 
                                        WHERE payment_record_id = ?");
        $updatePayment->execute([$platformFee, $amountToTransfer, $stripeTransferId, $finalTransferStatus, $data['payment_record_id']]);

        $pdo->commit();

        return ['code' => 200, 'response' => [
            "success" => true, 
            "message" => "Appointment confirmed and funds transfer initiated.",
            "transfer_id" => $stripeTransferId
        ]];

    } catch (\Stripe\Exception\ApiErrorException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("Stripe API Error during transfer: " . $e->getMessage());
        return ['code' => 500, 'response' => ["success" => false, "message" => "Stripe Error: " . $e->getMessage()]];
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("PDO Error during transfer: " . $e->getMessage());
        return ['code' => 500, 'response' => ["success" => false, "message" => "Database error during funds transfer."]];
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("General Error during transfer: " . $e->getMessage());
        return ['code' => 500, 'response' => ["success" => false, "message" => "An unexpected error occurred."]];
    }
}
?>