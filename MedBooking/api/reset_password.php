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
$password = $data['password'] ?? null;

if (empty($token) || empty($userType) || empty($password)) {
    sendJsonResponse(["success" => false, "message" => "All fields are required."], 400);
    exit();
}

if (strlen($password) < 6) {
    sendJsonResponse(["success" => false, "message" => "Password must be at least 6 characters long."], 400);
    exit();
}

$tokenHash = hash('sha256', $token);
$tableName = $userType === 'patient' ? 'users_patients' : 'users_doctors';
$idField = $userType === 'patient' ? 'patient_id' : 'doctor_id';

try {
    $stmt = $pdo->prepare(
        "SELECT $idField, reset_token_expires_at FROM $tableName WHERE reset_token = ?"
    );
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJsonResponse(["success" => false, "message" => "The recovery link is invalid or has already been used."], 400);
        exit();
    }

    $expiryDate = new DateTime($user['reset_token_expires_at']);
    $now = new DateTime();

    if ($now > $expiryDate) {
        sendJsonResponse(["success" => false, "message" => "The recovery link has expired. Please request a new one."], 400);
        exit();
    }

    $newPasswordHash = hashPassword($password);

    $updateStmt = $pdo->prepare(
        "UPDATE $tableName SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE $idField = ?"
    );
    $updateStmt->execute([$newPasswordHash, $user[$idField]]);

    sendJsonResponse(["success" => true, "message" => "Password reset successfully! You can now log in with your new password."]);

} catch (Exception $e) {
    error_log("Error resetting password: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "An error occurred while resetting your password."], 500);
}
?>
