<?php
// /api/validate_token.php
// New endpoint to check if a password reset token is valid before showing the form.

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['token'])) {
    json_response(['error' => 'Token is required.'], 400);
}

$token = $data['token'];

try {
    global $pdo;
    $stmt = $pdo->prepare("SELECT 1 FROM password_resets WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);

    if ($stmt->fetch()) {
        json_response(['success' => true]);
    } else {
        json_response(['error' => 'This link is invalid or has expired.'], 404);
    }
} catch (PDOException $e) {
    error_log("Validate Token Error: " . $e->getMessage());
    json_response(['error' => 'Could not validate the reset link.'], 500);
}
