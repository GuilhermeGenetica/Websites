<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

if (!isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Only doctors can access this resource."]);
    exit();
}

$doctorId = $decodedToken['user_id'];

$data = json_decode(file_get_contents("php://input"), true);
if ($data === null || !isset($data['schedule'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid data or missing schedule."]);
    exit();
}

$scheduleToSave = $data['schedule'];

if (!isset($scheduleToSave['dates']) || (!is_array($scheduleToSave['dates']) && !is_object($scheduleToSave['dates']))) {
    $scheduleToSave['dates'] = [];
}
if (!isset($scheduleToSave['recurring']) || !is_array($scheduleToSave['recurring'])) {
    $scheduleToSave['recurring'] = [];
}

$scheduleJson = json_encode($scheduleToSave);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Error encoding schedule data to JSON: " . json_last_error_msg()]);
    exit();
}

global $pdo;

try {
    $stmt = $pdo->prepare("UPDATE schedule_doctors SET schedule_data = ?, updated_at = NOW() WHERE doctor_id = ?");
    $stmt->execute([$scheduleJson, $doctorId]);

    if ($stmt->rowCount() === 0) {
        $stmt = $pdo->prepare("INSERT INTO schedule_doctors (doctor_id, schedule_data) VALUES (?, ?)");
        $stmt->execute([$doctorId, $scheduleJson]);
    }

    echo json_encode([
        "success" => true,
        "message" => "Doctor's schedule updated successfully!",
        "schedule_saved" => json_decode($scheduleJson)
    ]);

} catch (PDOException $e) {
    error_log("PDO Error in update_doctor_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error when updating schedule (DB)."]);
} catch (Exception $e) {
    error_log("Unexpected error in update_doctor_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unexpected server error when updating schedule."]);
}
?>
