<?php
require_once 'config.php';
// The Composer autoload is now handled by config.php, so the line below is removed.
// require __DIR__ . '/../vendor/autoload.php'; 
use Firebase\JWT\JWT;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    json_response(['error' => 'Invalid input'], 400);
}

$email = $data['email'];
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT id, full_name, email, password_hash, is_admin, has_paid FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Password is correct, create JWT
        $issuedAt = time();
        $expirationTime = $issuedAt + (60 * 60 * 24); // Token valid for 24 hours
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'is_admin' => (bool)$user['is_admin']
            ]
        ];

        $jwt = JWT::encode($payload, JWT_SECRET, 'HS256');

        // Set token in a secure, HttpOnly cookie
        setcookie('auth_token', $jwt, [
            'expires' => $expirationTime,
            'path' => '/',
            'domain' => '', // Set your domain in production
            'secure' => true, // Set to true if using HTTPS
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        
        // Remove password hash from response
        unset($user['password_hash']);

        json_response([
            'message' => 'Login successful',
            'user' => $user
        ]);

    } else {
        json_response(['error' => 'Invalid email or password'], 401);
    }

} catch (PDOException $e) {
    log_error($e->getMessage(), __FILE__, $e->getLine());
    json_response(['error' => 'A server error occurred during login.'], 500);
}
