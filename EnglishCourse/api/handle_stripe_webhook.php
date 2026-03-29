<?php
// Adress: api/
// File: handle_stripe_webhook.php
// Extension: .php

// Set content type to JSON for all responses
header('Content-Type: application/json');

// Disable time limit to ensure the script can fully process the webhook
set_time_limit(0);

// --- START: Security and Connection Setup ---
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'db_connect.php'; // Includes config.php and the $conn variable

// Error Prevention: Verify that Stripe keys are loaded from config.php
if (empty($stripeSecretKey) || empty($stripeWebhookSecret)) {
    http_response_code(500);
    error_log("FATAL: Stripe secrets (STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET) are not configured.");
    echo json_encode(['success' => false, 'message' => 'Internal server error: Payment processor not configured.']);
    exit();
}

\Stripe\Stripe::setApiKey($stripeSecretKey);
// --- END: Security and Connection Setup ---

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

// --- START: Webhook Signature Verification ---
// This is critical for security, ensuring the request came from Stripe and not a malicious actor.
try {
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $stripeWebhookSecret
    );
} catch(\UnexpectedValueException $e) {
    // Invalid payload
    http_response_code(400);
    error_log('Stripe Webhook Error: Invalid payload. ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Invalid payload.']);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature
    http_response_code(400);
    error_log('Stripe Webhook Error: Invalid signature. ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Invalid signature.']);
    exit();
} catch (Exception $e) {
    // Other errors
    http_response_code(500);
    error_log('Stripe Webhook Error: General error during event construction. ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Internal Server Error.']);
    exit();
}
// --- END: Webhook Signature Verification ---

// Log the received event for debugging and auditing purposes
error_log('Stripe Webhook Received: ID[' . $event->id . '], Type[' . $event->type . ']');

// --- START: Event Handling Logic ---
// Using a database transaction to ensure data integrity. All DB operations must succeed or none will.
$conn->beginTransaction();
try {
    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            if ($session->mode === 'subscription' && $session->payment_status === 'paid') {
                $userId = $session->metadata->user_id ?? null;
                $subscriptionId = $session->subscription;
                $planName = $session->metadata->plan_name ?? 'premium'; // Default to 'premium'
                
                if ($userId && $subscriptionId) {
                    // Update user to premium status
                    $sql = "UPDATE users SET plan = ?, is_active = 1, stripe_subscription_id = ?, updated_at = NOW() WHERE id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->execute([$planName, $subscriptionId, $userId]); 
                    error_log("SUCCESS [checkout.session.completed]: User $userId activated plan '$planName' with Sub ID: $subscriptionId");
                } else {
                    error_log("WARNING [checkout.session.completed]: Missing userId or subscriptionId in session " . $session->id);
                }
            }
            break;

        case 'invoice.payment_succeeded':
            // This event is crucial for subscription renewals.
            $invoice = $event->data->object;
            $subscriptionId = $invoice->subscription;
            
            if ($subscriptionId && $invoice->billing_reason === 'subscription_cycle') {
                // Find the user by their subscription ID and reactivate their account if it was inactive.
                $sql = "UPDATE users SET is_active = 1, plan = 'premium', updated_at = NOW() WHERE stripe_subscription_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([$subscriptionId]);
                if ($stmt->rowCount() > 0) {
                    error_log("SUCCESS [invoice.payment_succeeded]: Subscription $subscriptionId renewed. User reactivated.");
                }
            }
            break;

        case 'invoice.payment_failed':
            // This event indicates a renewal payment has failed.
            $invoice = $event->data->object;
            $subscriptionId = $invoice->subscription;
            
            if ($subscriptionId) {
                // Deactivate the user's account and revert them to the free plan.
                $sql = "UPDATE users SET is_active = 0, plan = 'free', updated_at = NOW() WHERE stripe_subscription_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([$subscriptionId]);
                if ($stmt->rowCount() > 0) {
                     error_log("ACTION [invoice.payment_failed]: Subscription $subscriptionId payment failed. User deactivated.");
                }
            }
            break;

        case 'customer.subscription.deleted':
            // This event is triggered when a subscription is canceled (either by the user or admin).
            $subscription = $event->data->object;
            $subscriptionId = $subscription->id;

            // Deactivate the user's premium access immediately.
            $sql = "UPDATE users SET is_active = 0, plan = 'free', updated_at = NOW() WHERE stripe_subscription_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$subscriptionId]);
            if ($stmt->rowCount() > 0) {
                error_log("ACTION [customer.subscription.deleted]: Subscription $subscriptionId canceled. User deactivated.");
            }
            break;

        default:
            // Log unhandled events for future development.
            error_log('INFO: Unhandled Stripe event type received: ' . $event->type);
    }

    // If all database operations were successful, commit the transaction.
    $conn->commit();

} catch (PDOException $e) {
    // If any database operation fails, roll back the transaction to maintain data consistency.
    $conn->rollBack();
    error_log("FATAL [Stripe Webhook DB Error]: " . $e->getMessage() . " for event type: " . $event->type);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error during webhook processing.']);
    exit();
} catch (Exception $e) {
    // Catch any other unexpected errors.
    $conn->rollBack();
    error_log("FATAL [Stripe Webhook General Error]: " . $e->getMessage() . " for event type: " . $event->type);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
    exit();
}
// --- END: Event Handling Logic ---

// Send a 200 OK response to Stripe to acknowledge receipt of the event.
http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Webhook received and processed successfully.']);
?>
