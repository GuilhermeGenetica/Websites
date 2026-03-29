<?php
require_once 'config.php';
// The Composer autoload is now handled by config.php, so the line below is removed.
// require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

if (!isset($_COOKIE['auth_token'])) {
    json_response(['loggedIn' => false]);
}

try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
    $user_id = $decoded->data->id;

    $stmt = $pdo->prepare("SELECT id, full_name, email, avatar_url, is_admin, has_paid FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if ($user) {
        $user['is_admin'] = (int)$user['is_admin'];
        $user['has_paid'] = (int)$user['has_paid'];
        json_response(['loggedIn' => true, 'user' => $user]);
    } else {
        json_response(['loggedIn' => false, 'error' => 'User not found in database.']);
    }

} catch (Exception $e) {
    // Invalid token, clear the cookie
    setcookie('auth_token', '', time() - 3600, '/', '', true, true);
    json_response(['loggedIn' => false, 'error' => 'Invalid or expired session.']);
}
