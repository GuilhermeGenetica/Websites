<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();
$secretKey = $_ENV['JWT_SECRET_KEY'];

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authentication token missing."]);
    exit();
}
$token = $matches[1];
$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken || $decodedToken['user_type'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

$doctorId = $decodedToken['user_id'];

try {
    global $pdo;
    $stmt = $pdo->prepare("SELECT google_refresh_token FROM users_doctors WHERE doctor_id = ?");
    $stmt->execute([$doctorId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $isConnected = !empty($result['google_refresh_token']);

    echo json_encode(["success" => true, "isConnected" => $isConnected]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error when checking Google status."]);
}
?>
