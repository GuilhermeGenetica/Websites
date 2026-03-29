<?php
// Adress: api/
// File: register.php
// Extension: .php

// --- START: Imports and Configuration ---
// This will include config.php, establish the DB connection, and set up logging.
require_once __DIR__ . '/bootstrap.php';

// Import necessary classes after bootstrap.
use Ramsey\Uuid\Uuid;
// --- END: Imports and Configuration ---


// --- START: CORS and Headers Configuration ---
// Note: $frontendBaseUrl is made available via config.php, included by bootstrap.php
header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// --- END: CORS and Headers Configuration ---


// --- START: Registration Logic with Full Error Prevention and Logging ---
custom_log("Registration attempt started.");

try {
    // 1. Get and Decode Input Data
    $input = file_get_contents("php://input");
    if (empty($input)) {
        http_response_code(400);
        custom_log("Registration Error: No data provided.");
        echo json_encode(['success' => false, 'message' => 'No data provided.']);
        exit();
    }
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        custom_log("Registration Error: Invalid JSON received. " . json_last_error_msg());
        throw new Exception('Invalid JSON received.');
    }
    custom_log("Registration data received: " . json_encode($data));

    // 2. Comprehensive Field Validation
    $required_fields = ['name', 'email', 'password', 'level'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            custom_log("Registration Error: Field '{$field}' is required.");
            echo json_encode(['success' => false, 'message' => "Field '{$field}' is required."]);
            exit();
        }
    }

    // 3. Data Sanitization and Validation
    $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $password = $data['password'];
    $level = strtoupper(trim($data['level']));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        custom_log("Registration Error: Invalid email format for '{$email}'.");
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit();
    }
    if (strlen($password) < 8) {
        http_response_code(400);
        custom_log("Registration Error: Password too short for user '{$email}'.");
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
        exit();
    }
    $valid_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!in_array($level, $valid_levels)) {
        http_response_code(400);
        custom_log("Registration Error: Invalid level '{$level}' provided for user '{$email}'.");
        echo json_encode(['success' => false, 'message' => 'Invalid level provided.']);
        exit();
    }

    // 4. Check if Email Already Exists
    custom_log("Checking if email '{$email}' already exists.");
    $sql_check = "SELECT COUNT(*) FROM users WHERE email = ?";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->execute([$email]);
    if ($stmt_check->fetchColumn() > 0) {
        http_response_code(409); // Conflict
        custom_log("Registration Error: Email '{$email}' is already registered.");
        echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
        exit();
    }
    custom_log("Email '{$email}' is available.");

    // 5. Password Hashing
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // 6. Generate Unique ID (UID)
    $uid = Uuid::uuid4()->toString();
    custom_log("Generated UID '{$uid}' for user '{$email}'.");

    // 7. Insert New User
    custom_log("Attempting to insert new user '{$email}' into database.");
    $sql_insert = "INSERT INTO users (uid, name, email, password, level) VALUES (?, ?, ?, ?, ?)";
    $stmt_insert = $conn->prepare($sql_insert);
    $stmt_insert->execute([$uid, $name, $email, $hashed_password, $level]);
    
    $new_user_id = $conn->lastInsertId();
    custom_log("User '{$email}' inserted successfully with ID: {$new_user_id}.");

    // 8. Success Response
    http_response_code(201); // Created
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful. You can now log in.',
        'userId' => $new_user_id
    ]);

} catch (PDOException $e) {
    custom_log("Database Error in register.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A database error occurred during registration.']);
} catch (Exception $e) {
    custom_log("General Error in register.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
