<?php
require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- Security Check: Ensure user is an authenticated admin ---
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
    if (!isset($decoded->data->is_admin) || !$decoded->data->is_admin) {
        json_response(['error' => 'Forbidden. Administrator access required.'], 403);
    }
} catch (Exception $e) {
    json_response(['error' => 'Invalid authentication token.'], 401);
}

// --- Handle GET request ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get total user count
        $stmt_users = $pdo->query("SELECT COUNT(id) as total_users FROM users");
        $total_users = $stmt_users->fetch()['total_users'];

        // You can add more stats here in the future
        // For example: total payments, new users this month, etc.

        json_response([
            'totalUsers' => $total_users,
            // 'monthlySignups' => 150, // Example of another stat
        ]);

    } catch (PDOException $e) {
        log_error("Failed to fetch admin stats: " . $e->getMessage(), __FILE__, $e->getLine());
        json_response(['error' => 'Failed to fetch platform statistics.'], 500);
    }
} else {
    json_response(['error' => 'Invalid request method.'], 405);
}
