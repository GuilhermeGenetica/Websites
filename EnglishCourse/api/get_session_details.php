<?php
// Adress: api/
// File: get_session_details.php
// Extension: .php

// This script securely retrieves details of a Stripe Checkout session from the backend.
// The frontend calls this after a successful payment redirect to confirm the payment status.

// --- START: Headers and Configuration ---
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); // In production, change to your frontend URL
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';
require_once 'db_connect.php';

\Stripe\Stripe::setApiKey($stripeSecretKey);
// --- END: Headers and Configuration ---

// --- START: Main Logic ---
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

try {
    $sessionId = $_GET['session_id'] ?? null;
    if (empty($sessionId)) {
        throw new Exception("Session ID is required.");
    }

    // 1. Retrieve the session from Stripe
    $session = \Stripe\Checkout\Session::retrieve($sessionId);

    // 2. Verify payment status
    if ($session->payment_status === 'paid') {
        // The payment was successful. The webhook should have already updated the database.
        // We can send back confirmation to the frontend.
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'status' => 'paid',
            'customer_email' => $session->customer_details->email
        ]);
    } else {
        // The payment was not successful.
        http_response_code(402); // Payment Required
        echo json_encode([
            'success' => false,
            'status' => $session->payment_status,
            'message' => 'Payment was not successful.'
        ]);
    }

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    error_log("Stripe API Error in get_session_details.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Stripe Error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("Error in get_session_details.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server Error: ' . $e->getMessage()]);
}
// --- END: Main Logic ---
?>
