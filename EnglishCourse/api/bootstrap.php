<?php
// Adress: api/
// File: bootstrap.php
// Extension: .php

// This is the new central initialization file for the API.
// It sets up error logging, loads environment variables, and connects to the database.
// All API endpoint files should include this file.

// --- START: Robust Error Handling & Logging Setup ---
// Ensure this block runs only once.
if (!defined('PERFECT_ENGLISH_BOOTSTRAPPED')) {
    
    // 1. Basic Error Reporting Setup
    ini_set('display_errors', 0); // Disable error display for security
    ini_set('log_errors', 1); // Enable error logging
    error_reporting(E_ALL);

    // 2. Define a consistent log file path
    // Using a writable directory is crucial. `sys_get_temp_dir()` is a safe bet on most systems.
    define('CUSTOM_LOG_FILE', sys_get_temp_dir() . '/perfect_english_api.log');
    
    // 3. Define a global logging function
    if (!function_exists('custom_log')) {
        function custom_log($message) {
            // Add a timestamp and ensure the message is a string
            $logEntry = "[" . date('Y-m-d H:i:s') . "] " . (is_array($message) || is_object($message) ? print_r($message, true) : $message) . "\n";
            // Use error_log for better system integration and reliability
            error_log($logEntry, 3, CUSTOM_LOG_FILE);
        }
    }

    // 4. Set a custom error handler to catch all errors and log them using our function
    set_error_handler(function ($severity, $message, $file, $line) {
        custom_log("Error: [Severity: $severity] $message in $file on line $line");
        // Don't execute the internal PHP error handler
        return true;
    });

    // 5. Set a custom exception handler
    set_exception_handler(function ($exception) {
        custom_log("Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
        // Send a generic 500 response
        if (!headers_sent()) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'An unexpected server error occurred.']);
        }
    });

    define('PERFECT_ENGLISH_BOOTSTRAPPED', true);
    custom_log("--- Bootstrap process started ---");
}
// --- END: Robust Error Handling & Logging Setup ---


// --- START: Environment and Database Initialization ---
// This block is wrapped to prevent re-declaration of variables if included multiple times.
if (!isset($conn)) {
    // 1. Load Composer's autoloader
    require_once __DIR__ . '/../vendor/autoload.php';

    // 2. Load environment variables from .env file
    try {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/');
        $dotenv->safeLoad();
        custom_log("Environment variables loaded successfully.");
    } catch (Exception $e) {
        custom_log("CRITICAL: Dotenv Load Failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error: Environment configuration could not be loaded.']);
        exit();
    }

    // 3. Helper function to get required environment variables
    function get_required_env($key) {
        if (!isset($_ENV[$key]) || $_ENV[$key] === '') {
            throw new Exception("ERROR: Environment variable '{$key}' is missing or empty.");
        }
        return $_ENV[$key];
    }
    
    // Global variable for the database connection
    $conn = null;

    try {
        // --- Database Configuration ---
        $dbHost = get_required_env('DB_HOST');
        $dbName = get_required_env('DB_NAME');
        $dbUser = get_required_env('DB_USER');
        $dbPass = get_required_env('DB_PASS');

        // Establish PDO connection
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
        $conn = new PDO($dsn, $dbUser, $dbPass, $options);
        custom_log("Database connection successful.");

        // --- Application & Security Configuration ---
        $jwtSecretKey = get_required_env('JWT_SECRET');
        $frontendBaseUrl = get_required_env('FRONTEND_BASE_URL');

        // --- Stripe Configuration (CORREÇÃO ADICIONADA AQUI) ---
        $stripeSecretKey = get_required_env('STRIPE_SECRET_KEY');
        $stripeWebhookSecret = get_required_env('STRIPE_WEBHOOK_SECRET');
        
    } catch (PDOException $e) {
        custom_log("CRITICAL: Database Connection Failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error: Failed to connect to the database.']);
        exit();
    } catch (Exception $e) {
        custom_log("CRITICAL: Configuration Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error: Application not configured correctly.']);
        exit();
    }
}
// --- END: Environment and Database Initialization ---
