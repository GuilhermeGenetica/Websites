<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

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

$doctorId = filter_input(INPUT_GET, 'doctor_id', FILTER_VALIDATE_INT);

if (!$doctorId) {
    if (isset($decodedToken['user_type']) && $decodedToken['user_type'] === 'doctor') {
        $doctorId = $decodedToken['user_id'];
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Doctor ID not provided or invalid."]);
        exit();
    }
}

global $pdo;

try {
    $sql = "SELECT schedule_data FROM schedule_doctors WHERE doctor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$doctorId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result && !empty($result['schedule_data'])) {
        $scheduleData = json_decode($result['schedule_data'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("get_doctor_schedule.php: JSON decode error for schedule_data: " . json_last_error_msg());
            echo json_encode(["success" => true, "schedule" => ['dates' => [], 'recurring' => []]]);
        } else {
            if (!isset($scheduleData['dates']) || (!is_array($scheduleData['dates']) && !is_object($scheduleData['dates']))) {
                $scheduleData['dates'] = [];
            }
            if (!isset($scheduleData['recurring']) || !is_array($scheduleData['recurring'])) {
                $scheduleData['recurring'] = [];
            }
            echo json_encode(["success" => true, "schedule" => $scheduleData]);
        }
    } else {
        echo json_encode(["success" => true, "schedule" => ['dates' => [], 'recurring' => []]]);
    }

} catch (PDOException $e) {
    error_log("PDO Error in get_doctor_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error while fetching schedule (DB)."]);
} catch (Exception $e) {
    error_log("Unexpected error in get_doctor_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unexpected server error while fetching schedule."]);
}
?>
