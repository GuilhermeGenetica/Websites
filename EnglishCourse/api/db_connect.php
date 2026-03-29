<?php
// Adress: api/
// File: db_connect.php
// Extension: .php

// This file is now much simpler.
// It relies on bootstrap.php to have already initialized the database connection ($conn)
// and the logging function.

require_once __DIR__ . '/bootstrap.php';

// Error Prevention: Check if the connection object from bootstrap.php is valid.
// This is a final safeguard. The main check is in bootstrap.php itself.
if (!isset($conn) || !$conn instanceof PDO) {
    // If we reach here, something is critically wrong with the bootstrap process.
    $message = 'CRITICAL ERROR: Database connection object not found after bootstrap.';
    
    // Attempt to log this critical failure.
    if (function_exists('custom_log')) {
        custom_log($message);
    } else {
        // Fallback to the standard PHP error log if our function isn't available.
        error_log($message);
    }

    // Send a generic error response to the client.
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Internal Server Error: Failed to initialize application.']);
    exit();
}

// If we are here, the $conn object is valid and ready to be used by the script that included this file.
