<?php
// Report only severe errors to the server log, do not print them to the response to avoid breaking the Webhook
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';

// Ensure the Stripe SDK is loaded.
// If using Composer, this should be the autoload path.
require_once __DIR__ . '/../vendor/autoload.php';

// Retrieve environment keys
$stripeSecretKey = env('STRIPE_SECRET_KEY', '');
$webhookSecret = env('STRIPE_WEBHOOK_SECRET', '');
$adminEmail = env('WB_ADMIN_EMAIL', 'admin@onnetweb.com'); // Fallback admin email

// Initialize Stripe API
\Stripe\Stripe::setApiKey($stripeSecretKey);

// Read raw request body (payload), required for signature verification
$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

try {
    // Verify Webhook signature to ensure the call legitimately comes from Stripe
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sigHeader, $webhookSecret
    );
} catch (\UnexpectedValueException $e) {
    // Invalid payload
    http_response_code(400);
    error_log("Stripe Webhook Error: Invalid payload. " . $e->getMessage());
    echo json_encode(['error' => 'Invalid payload']);
    exit();
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature (hacking attempt or wrong secret)
    http_response_code(400);
    error_log("Stripe Webhook Error: Invalid signature. " . $e->getMessage());
    echo json_encode(['error' => 'Invalid signature']);
    exit();
}

// Connect to the database
try {
    $pdo = getDbConnection();
    if (!$pdo) {
        throw new Exception("Database connection failed during Webhook execution.");
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("Stripe Webhook DB Error: " . $e->getMessage());
    exit();
}

// Handle specific requested events
switch ($event->type) {
    
    case 'checkout.session.completed':
        $session = $event->data->object;
        
        // Extract metadata sent during checkout creation in auth.php
        $userId = $session->metadata->user_id ?? $session->client_reference_id ?? null;
        $plan = $session->metadata->plan ?? null;
        
        if ($userId && $plan) {
            // Update user: activate subscription, set plan type (basic/complete), and add 30 days validity
            $stmt = $pdo->prepare("UPDATE users SET subscription_active = 1, subscription_type = ?, subscription_expires = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW() WHERE id = ?");
            if ($stmt->execute([$plan, $userId])) {
                error_log("Webhook Success: User ID {$userId} upgraded to {$plan} plan.");
                
                // Fetch user data to send email
                $userStmt = $pdo->prepare("SELECT email, full_name FROM users WHERE id = ?");
                $userStmt->execute([$userId]);
                $userData = $userStmt->fetch();
                
                if ($userData) {
                    $to = $userData['email'];
                    $subject = "Subscription Confirmation - Guilherme WorkBench";
                    $message = "Hello " . $userData['full_name'] . ",\n\nYour payment has been successfully received. Your " . strtoupper($plan) . " subscription is now active for 30 days.\n\nThank you for using our platform.";
                    $headers = "From: noreply@onnetweb.com\r\n";
                    mail($to, $subject, $message, $headers);
                    
                    // Notify Admin
                    $adminSubject = "New Subscription Received: " . strtoupper($plan);
                    $adminMessage = "User " . $userData['full_name'] . " (" . $userData['email'] . ") has just subscribed to the " . strtoupper($plan) . " plan.";
                    mail($adminEmail, $adminSubject, $adminMessage, $headers);
                }
            } else {
                error_log("Webhook DB Update Failed for User ID {$userId}");
            }
        }
        
        // Additional Logic (For Consultations): If metadata contains the slot_id of a paid consultation
        $slotId = $session->metadata->slot_id ?? null;
        if ($slotId) {
            $stmt = $pdo->prepare("UPDATE consultation_slots SET payment_status = 'paid', stripe_session_id = ? WHERE id = ?");
            if ($stmt->execute([$session->id, $slotId])) {
                error_log("Webhook Success: Consultation Slot {$slotId} marked as paid.");
                
                // Fetch consultation data to send email (JOIN properly)
                $slotStmt = $pdo->prepare("
                    SELECT cs.consultation_type, cs.date_slot, cs.time_slot, c.patient_name, c.patient_email 
                    FROM consultation_slots cs 
                    LEFT JOIN consultations c ON cs.id = c.slot_id 
                    WHERE cs.id = ?
                ");
                $slotStmt->execute([$slotId]);
                $slotData = $slotStmt->fetch();
                
                if ($slotData) {
                    $to = $slotData['patient_email'];
                    $subject = "Consultation Payment Confirmation - Guilherme WorkBench";
                    $message = "Hello " . $slotData['patient_name'] . ",\n\nThe payment for your consultation (" . $slotData['consultation_type'] . ") has been confirmed.\n\nDate: " . $slotData['date_slot'] . "\nTime: " . $slotData['time_slot'] . "\n\nWe look forward to seeing you.";
                    $headers = "From: noreply@onnetweb.com\r\n";
                    mail($to, $subject, $message, $headers);
                    
                    // Notify Admin
                    $adminSubject = "New Consultation Payment Confirmed";
                    $adminMessage = "Patient " . $slotData['patient_name'] . " (" . $slotData['patient_email'] . ") paid for a " . $slotData['consultation_type'] . " consultation on " . $slotData['date_slot'] . " at " . $slotData['time_slot'] . ".";
                    mail($adminEmail, $adminSubject, $adminMessage, $headers);
                }
            }
        }
        break;

    case 'payment_intent.succeeded':
        $paymentIntent = $event->data->object;
        
        // Works as backup or for automatic monthly renewals where checkout.session is not called
        $userId = $paymentIntent->metadata->user_id ?? null;
        
        if ($userId) {
            // Renew subscription for another 30 days after successful renewal payment
            $stmt = $pdo->prepare("UPDATE users SET subscription_active = 1, subscription_expires = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW() WHERE id = ?");
            $stmt->execute([$userId]);
            error_log("Webhook Success: Payment Intent Succeeded for User ID {$userId}. Subscription renewed.");
        }
        break;

    case 'payment_intent.payment_failed':
        $paymentIntent = $event->data->object;
        
        $userId = $paymentIntent->metadata->user_id ?? null;
        $failureMessage = $paymentIntent->last_payment_error->message ?? 'Unknown Stripe Error';
        
        if ($userId) {
            // Suspend the account if renewal payment fails
            $stmt = $pdo->prepare("UPDATE users SET subscription_active = 0, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$userId]);
            error_log("Webhook Warning: Payment Intent Failed for User ID {$userId}. Reason: {$failureMessage}");
            
            // Fetch data to notify failure
            $userStmt = $pdo->prepare("SELECT email, full_name FROM users WHERE id = ?");
            $userStmt->execute([$userId]);
            $userData = $userStmt->fetch();
            
            if ($userData) {
                $to = $userData['email'];
                $subject = "Subscription Renewal Failed - Guilherme WorkBench";
                $message = "Hello " . $userData['full_name'] . ",\n\nWe were unable to process the payment for your subscription renewal. Your account is currently suspended. Please update your payment method.\n\nReason: " . $failureMessage;
                $headers = "From: noreply@onnetweb.com\r\n";
                mail($to, $subject, $message, $headers);
            }
        }
        break;

    case 'charge.refunded':
        $charge = $event->data->object;
        
        // Revoke access if charge is refunded/disputed
        $userId = $charge->metadata->user_id ?? null;
        if ($userId) {
            $stmt = $pdo->prepare("UPDATE users SET subscription_active = 0, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$userId]);
            error_log("Webhook Info: Charge Refunded for User ID {$userId}. Subscription deactivated.");
        }
        
        // Revert consultation if it's an appointment refund
        $slotId = $charge->metadata->slot_id ?? null;
        if ($slotId) {
            $stmt = $pdo->prepare("UPDATE consultation_slots SET payment_status = 'failed', is_booked = 0, cancel_reason = 'Refunded via Stripe' WHERE id = ?");
            $stmt->execute([$slotId]);
            error_log("Webhook Info: Consultation Slot {$slotId} refunded and unbooked.");
            
            // Notify patient of consultation refund
            $slotStmt = $pdo->prepare("
                SELECT cs.date_slot, cs.time_slot, c.patient_name, c.patient_email 
                FROM consultation_slots cs 
                LEFT JOIN consultations c ON cs.id = c.slot_id 
                WHERE cs.id = ?
            ");
            $slotStmt->execute([$slotId]);
            $slotData = $slotStmt->fetch();
            
            if ($slotData) {
                $to = $slotData['patient_email'];
                $subject = "Consultation Refund Processed - Guilherme WorkBench";
                $message = "Hello " . $slotData['patient_name'] . ",\n\nThe refund for your consultation on " . $slotData['date_slot'] . " at " . $slotData['time_slot'] . " was processed successfully. The appointment has been canceled.";
                $headers = "From: noreply@onnetweb.com\r\n";
                mail($to, $subject, $message, $headers);
            }
        }
        break;

    default:
        // Ignored event but processed successfully (Stripe sends dozens of intermediate events)
        error_log("Webhook Notice: Received unhandled event type: " . $event->type);
        break;
}

// Stripe requires the server to return 200 OK quickly to avoid resending the event
http_response_code(200);
echo json_encode(['status' => 'success', 'message' => 'Webhook received and processed successfully.']);
?>