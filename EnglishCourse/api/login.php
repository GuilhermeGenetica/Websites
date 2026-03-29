<?php
// Adress: api/
// File: login.php
// Extension: .php

// --- START: Imports and Configuration ---
// This will include config.php, establish the DB connection, and set up logging.
require_once __DIR__ . '/bootstrap.php';
// --- END: Imports and Configuration ---


// --- START: CORS and Headers Configuration ---
// Note: $frontendBaseUrl is made available via config.php, included by bootstrap.php
header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-control-allow-credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// --- END: CORS and Headers Configuration ---


// --- START: Authentication Logic with Full Error Prevention and Logging ---
custom_log("Login attempt started.");

try {
    // 1. Get and Decode Input Data
    $input = file_get_contents("php://input");
    if (empty($input)) {
        http_response_code(400);
        custom_log("Login Error: No data provided.");
        echo json_encode(['success' => false, 'message' => 'No data provided.']);
        exit();
    }
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        custom_log("Login Error: Invalid JSON received. " . json_last_error_msg());
        throw new Exception('Invalid JSON received.');
    }
    custom_log("Login data received: " . json_encode($data));

    // 2. Basic Field Validation
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        custom_log("Login Error: Email or password field missing.");
        echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
        exit();
    }

    // 3. Data Sanitization and Preparation
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $password = $data['password'];

    custom_log("Attempting to find user with email: " . $email);

    // 4. Retrieve User by Email
    $sql = "SELECT id, uid, name, email, password, level, plan, is_active, is_admin FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 5. Password Verification and User Check
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401); // Unauthorized
        custom_log("Login Failed: Invalid credentials for email: " . $email);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit();
    }
    custom_log("User found and password verified for user ID: " . $user['id']);

    // Check if user is active
    if (!(bool)$user['is_active']) {
        http_response_code(403); // Forbidden
        custom_log("Login Failed: Account is inactive for user ID: " . $user['id']);
        echo json_encode(['success' => false, 'message' => 'Account is currently inactive.']);
        exit();
    }

    // 6. Generate JWT Token
    $issuedAt = time();
    $expirationTime = $issuedAt + (60 * 60 * 24 * 7); // 7 days expiration

    $payload = [
        'iat'  => $issuedAt,
        'exp'  => $expirationTime,
        'data' => [
            'id'    => $user['id'],
            'uid'   => $user['uid'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'level' => $user['level'],
            'plan'  => $user['plan'],
            'is_active' => (bool)$user['is_active'],
            'is_admin' => (bool)$user['is_admin']
        ]
    ];

    $jwt = Firebase\JWT\JWT::encode($payload, $jwtSecretKey, 'HS256');
    custom_log("JWT token generated for user ID: " . $user['id']);
    
    // Set token in an HttpOnly, Secure cookie for better security
    $cookieName = 'auth_token';
    $cookieValue = $jwt;
    $cookieExpiration = $expirationTime; 
    $cookiePath = "/";
    $cookieDomain = $_SERVER['HTTP_HOST']; // Adjust if frontend and backend are on different subdomains
    $cookieSecure = true; // Set to true if using HTTPS
    $cookieHttpOnly = true; // HttpOnly to prevent JS access
    $cookieSameSite = 'None'; // 'None' for cross-site requests, requires Secure=true. Use 'Strict' or 'Lax' if on the same domain.

    setcookie($cookieName, $cookieValue, [
        'expires' => $cookieExpiration,
        'path' => $cookiePath,
        'domain' => $cookieDomain,
        'secure' => $cookieSecure,
        'httponly' => $cookieHttpOnly,
        'samesite' => $cookieSameSite
    ]);

    // 7. Success Response
    unset($user['password']);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user'    => $user,
        'token'   => $jwt // Still send token for frontend state management
    ]);
    custom_log("Login successful for user ID: " . $user['id']);

} catch (PDOException $e) {
    custom_log("Database Error in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A database error occurred during login.']);
} catch (Exception $e) {
    custom_log("General Error in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
