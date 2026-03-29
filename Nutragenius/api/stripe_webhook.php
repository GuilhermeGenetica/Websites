<?php
require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\Webhook;

Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));
$endpoint_secret = getenv('STRIPE_WEBHOOK_SECRET');

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$event = null;

try {
    $event = Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );
} catch(\UnexpectedValueException $e) {
    http_response_code(400);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    exit();
}

// Handle the event
if ($event->type == 'checkout.session.completed') {
    $session = $event->data->object;
    $user_id = null;

    // **CORRECTION**: Robustly find the user ID from metadata
    if (!empty($session->metadata->nutragenius_user_id)) {
        $user_id = $session->metadata->nutragenius_user_id;
    } else {
        // Fallback to retrieving from the Payment Intent if not on the session
        try {
            $paymentIntent = \Stripe\PaymentIntent::retrieve($session->payment_intent);
            if (!empty($paymentIntent->metadata->nutragenius_user_id)) {
                $user_id = $paymentIntent->metadata->nutragenius_user_id;
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            log_error("Webhook could not retrieve Payment Intent: " . $e->getMessage(), __FILE__, $e->getLine(), ['session_id' => $session->id]);
        }
    }

    if ($user_id) {
        try {
            // Update user's has_paid status
            $stmt = $pdo->prepare("UPDATE users SET has_paid = 1 WHERE id = ?");
            $stmt->execute([$user_id]);

            // Log the payment
            $log_stmt = $pdo->prepare(
                "INSERT INTO payments (user_id, stripe_payment_intent_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)"
            );
            $log_stmt->execute([
                $user_id,
                $session->payment_intent,
                $session->amount_total,
                $session->currency,
                'succeeded'
            ]);
        } catch (PDOException $e) {
            log_error("Webhook DB update failed: " . $e->getMessage(), __FILE__, $e->getLine(), ['user_id' => $user_id]);
            http_response_code(500);
            exit();
        }
    } else {
        log_error("Webhook received completed session but could not find user_id in metadata.", __FILE__, 0, ['session_id' => $session->id]);
    }
}

http_response_code(200);

