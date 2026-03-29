<?php
require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\Exception\ApiErrorException;

// --- Step 1: Authenticate the user from the JWT cookie ---
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

$user_id = null;
try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(getenv('JWT_SECRET'), 'HS256'));
    $user_id = $decoded->data->id;
} catch (Exception $e) {
    json_response(['error' => 'Invalid or expired authentication token.'], 401);
}

// --- Step 2: Perform initial checks for configuration ---
$stripe_secret_key = getenv('STRIPE_SECRET_KEY');
$price_id = getenv('STRIPE_PRICE_ID');
$domain_url = getenv('DOMAIN_URL');
// ** FIX: Get the frontend URL (e.g., https://nutragenius.app) **
$frontend_url = getenv('APP_URL'); 

// ** FIX: Update the 'if' block to include the new variable **
if (empty($stripe_secret_key) || empty($price_id) || empty($domain_url) || empty($frontend_url)) {
    $error_message = "Stripe server configuration is incomplete. Check STRIPE_SECRET_KEY, STRIPE_PRICE_ID, DOMAIN_URL, and APP_URL in .env";
    log_error($error_message, __FILE__, __LINE__);
    json_response(['error' => 'Payment system is not configured correctly.'], 500);
}

// --- Step 3: Initialize Stripe API ---
Stripe::setApiKey($stripe_secret_key);

// --- Step 4: Fetch user data from your database ---
try {
    $stmt = $pdo->prepare("SELECT email, full_name, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['error' => 'Authenticated user not found in database.'], 404);
    }
} catch (PDOException $e) {
    log_error("Database error fetching user: " . $e->getMessage(), __FILE__, __LINE__);
    json_response(['error' => 'Could not retrieve user data.'], 500);
}

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['action']) && $data['action'] === 'create-checkout-session') {
    $customer_id = $user['stripe_customer_id'];

    // --- Step 5: Create a Stripe Customer if one doesn't exist ---
    if (!$customer_id) {
        try {
            $customer = \Stripe\Customer::create([
                'email' => $user['email'],
                'name' => $user['full_name'],
                'metadata' => ['nutragenius_user_id' => $user_id]
            ]);
            $customer_id = $customer->id;

            $update_stmt = $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
            $update_stmt->execute([$customer_id, $user_id]);

        } catch (ApiErrorException $e) {
            $msg = $e->getMessage();
            log_error("Stripe Customer Creation Error: {$msg}", __FILE__, $e->getLine());
            $user_facing_error = 'Could not create payment customer profile.';
            if (getenv('APP_ENV') === 'development') {
                $user_facing_error .= " (Stripe: {$msg})";
            }
            json_response(['error' => $user_facing_error], 500);
        }
    }

    // --- Step 6: Create the Stripe Checkout Session ---
    try {
        $checkout_session = Session::create([
            'customer' => $customer_id,
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price' => $price_id,
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            
            // ** FIX: Use the $frontend_url for redirection **
            'success_url' => $frontend_url . '/dashboard?payment_success=true',
            'cancel_url' => $frontend_url . '/dashboard?payment_canceled=true',
            
            'metadata' => [
                'nutragenius_user_id' => $user_id
            ],
            'payment_intent_data' => [
                'metadata' => [
                    'nutragenius_user_id' => $user_id
                ]
            ]
        ]);
        
        // Return the session URL instead of just the ID
        // This allows the frontend to redirect without needing Stripe.js
        json_response(['url' => $checkout_session->url]);

    } catch (ApiErrorException $e) {
        $msg = $e->getMessage();
        log_error("Stripe Checkout Session Error: {$msg}", __FILE__, $e->getLine());
        $user_facing_error = 'Failed to create checkout session. Please check product configuration.';
        if (getenv('APP_ENV') === 'development') {
             $user_facing_error .= " (Stripe: {$msg})";
        }
        json_response(['error' => $user_facing_error], 500);
    }
} else {
    json_response(['error' => 'Invalid action specified.'], 400);
}

?>