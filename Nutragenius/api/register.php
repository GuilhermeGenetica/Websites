<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['fullName']) || !isset($data['email']) || !isset($data['password'])) {
    json_response(['error' => 'Invalid input. Full name, email, and password are required.'], 400);
}

$fullName = trim($data['fullName']);
$email = trim($data['email']);
$password = $data['password'];

if (empty($fullName) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    json_response(['error' => 'Invalid data provided. Password must be at least 8 characters long.'], 400);
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        json_response(['error' => 'An account with this email already exists.'], 409); // 409 Conflict
    }

    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$fullName, $email, $password_hash]);
    
    $userId = $pdo->lastInsertId();

    json_response(['message' => 'Registration successful. You can now log in.', 'userId' => $userId], 201);

} catch (PDOException $e) {
    log_error($e->getMessage(), __FILE__, $e->getLine());
    json_response(['error' => 'A server error occurred during registration.'], 500);
}

