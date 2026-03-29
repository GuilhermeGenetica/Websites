<?php
// Adress: api/
// File: create_stripe_checkout.php
// Extension: .php

// --- START: Headers and Configuration ---
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); // In production, change to: header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'error' => 'Request method not allowed. Please use POST.']);
    exit;
}

try {
    // 1. Get and Validate Input
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON received.');
    }
    
    $required_fields = ['planKey', 'currency', 'userId', 'userEmail'];
    foreach($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }

    $planKey = strtolower($data['planKey']);
    // --- INÍCIO DA CORREÇÃO 1: Converter hífen para underscore ---
    // Isto converte "semi-annual" para "semi_annual"
    $planKey = str_replace('-', '_', $planKey); 
    // --- FIM DA CORREÇÃO 1 ---

    $currency = strtolower($data['currency']);
    $userId = $data['userId'];
    $userEmail = $data['userEmail'];

    // 2. Validate Plan and Currency Keys
    $validPlanKeys = ['monthly', 'semi_annual', 'annual']; // Atualizado para underscore
    $validCurrencies = ['usd', 'eur', 'brl']; 
    if (!in_array($planKey, $validPlanKeys) || !in_array($currency, $validCurrencies)) {
        throw new Exception("Invalid plan ('{$planKey}') or currency ('{$currency}') provided.");
    }

    // 3. Construct Environment Variable Key and Get Price ID
    // Agora irá construir 'STRIPE_PRICE_SEMI_ANNUAL_BRL' corretamente
    $env_key = 'STRIPE_PRICE_' . strtoupper($planKey) . '_' . strtoupper($currency);
    if (!isset($_ENV[$env_key])) {
        throw new Exception("Stripe price configuration is missing for '{$env_key}'. Please check the .env file.");
    }
    $priceId = $_ENV[$env_key];

    // 4. Construct Success and Cancel URLs
    $successUrl = $frontendBaseUrl . '/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = $frontendBaseUrl . '/pricing?payment=cancelled';

    // 5. Create Stripe Checkout Session
    $checkout_session = \Stripe\Checkout\Session::create([
        'line_items' => [[
            'price' => $priceId,
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'customer_email' => $userEmail, 
        'metadata' => [
            'user_id' => $userId,
            'plan_name' => $data['planName'] ?? 'premium', 
            'price_key' => $planKey,
            'currency' => $currency,
        ],
        'allow_promotion_codes' => true, 
        'subscription_data' => [
            'trial_from_plan' => true, 
        ],
    ]);

    // --- INÍCIO DA CORREÇÃO 2: Retornar a URL da sessão ---
    // Em vez de retornar o ID, retornamos a URL completa gerada pelo Stripe.
    http_response_code(200);
    echo json_encode(['success' => true, 'url' => $checkout_session->url]);
    // --- FIM DA CORREÇÃO 2 ---

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    custom_log("Stripe API Error in create_stripe_checkout.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Stripe Error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400); // Bad Request for validation errors
    custom_log("Error in create_stripe_checkout.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server Error: ' . $e->getMessage()]);
}
// --- END: Main Logic ---
?>