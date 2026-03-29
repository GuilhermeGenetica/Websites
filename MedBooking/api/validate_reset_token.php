<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? null;
$userType = $data['userType'] ?? null;

if (empty($token) || empty($userType)) {
    sendJsonResponse(["success" => false, "message" => "Token or user type missing."], 400);
    exit();
}

$tokenHash = hash('sha256', $token);
$tableName = $userType === 'patient' ? 'users_patients' : 'users_doctors';

try {
    $stmt = $pdo->prepare(
        "SELECT email, reset_token_expires_at FROM $tableName WHERE reset_token = ?"
    );
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJsonResponse(["success" => false, "message" => "The recovery link is invalid or has already been used."], 404);
        exit();
    }

    $expiryDate = new DateTime($user['reset_token_expires_at']);
    $now = new DateTime();

    if ($now > $expiryDate) {
        sendJsonResponse(["success" => false, "message" => "The recovery link has expired. Please request a new one."], 400);
        exit();
    }

    sendJsonResponse(["success" => true, "email" => $user['email']]);

} catch (Exception $e) {
    error_log("Error validating reset token: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "An error occurred while validating your request."], 500);
}
?>
