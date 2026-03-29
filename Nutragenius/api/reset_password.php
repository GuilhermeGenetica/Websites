<?php
// /api/reset_password.php
// New endpoint to handle the actual password update from the reset link.

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['token']) || !isset($data['password']) || strlen($data['password']) < 8) {
    json_response(['error' => 'A valid token and a new password (min. 8 characters) are required.'], 400);
}

$token = $data['token'];
$newPassword = $data['password'];

try {
    global $pdo;
    $stmt = $pdo->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $resetRequest = $stmt->fetch();

    if (!$resetRequest) {
        json_response(['error' => 'This password reset link is invalid or has expired.'], 400);
    }

    $email = $resetRequest['email'];
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update user's password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$newPasswordHash, $email]);

    // Delete the used token
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
    $stmt->execute([$email]);

    json_response(['message' => 'Your password has been reset successfully.']);

} catch (PDOException $e) {
    error_log("Reset Password Error: " . $e->getMessage());
    json_response(['error' => 'A database error occurred. Please try again.'], 500);
}
