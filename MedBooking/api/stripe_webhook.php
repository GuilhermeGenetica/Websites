<?php
require_once 'config.php';
require_once 'utils.php';

$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'];
$webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'];

\Stripe\Stripe::setApiKey($stripeSecretKey);

$payload = @file_get_contents('php://input');
$event = null;

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload, $_SERVER['HTTP_STRIPE_SIGNATURE'], $webhookSecret
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    error_log("Webhook Error: Invalid payload. " . $e->getMessage());
    exit();
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    error_log("Webhook Error: Invalid signature. " . $e->getMessage());
    exit();
}

global $pdo;

switch ($event->type) {
    case 'payment_intent.succeeded':
        $paymentIntent = $event->data->object;
        handlePaymentIntentSucceeded($pdo, $paymentIntent);
        break;
    case 'charge.refunded':
        $charge = $event->data->object;
        handleChargeRefunded($pdo, $charge);
        break;
    case 'payment_intent.payment_failed':
        $paymentIntent = $event->data->object;
        handlePaymentIntentFailed($pdo, $paymentIntent);
        break;
    default:
        error_log('Received unknown event type ' . $event->type);
}

http_response_code(200);

function handlePaymentIntentSucceeded($pdo, $paymentIntent) {
    $stripePaymentIntentId = $paymentIntent->id;
    $amount = $paymentIntent->amount / 100;
    $currency = strtoupper($paymentIntent->currency);
    $chargeId = $paymentIntent->latest_charge ?? null;
    $paymentFlow = $paymentIntent->metadata->payment_flow ?? 'automatic'; // Default to 'automatic' for old/existing

    error_log("PaymentIntent Succeeded: " . $stripePaymentIntentId . " with flow: " . $paymentFlow);
    
    $stmt_get_appt = $pdo->prepare("SELECT appointment_id, patient_id, doctor_id FROM appointments WHERE stripe_payment_id = ?");
    $stmt_get_appt->execute([$stripePaymentIntentId]);
    $appointmentData = $stmt_get_appt->fetch(PDO::FETCH_ASSOC);

    if (!$appointmentData) {
        error_log("PaymentIntent Succeeded: No appointment found in DB for PaymentIntent " . $stripePaymentIntentId . ". Webhook might be ahead of frontend. Retrying later.");
        http_response_code(503); // Service Unavailable - Tell Stripe to retry
        return;
    }

    $appointmentId = $appointmentData['appointment_id']; 
    $patientId = $appointmentData['patient_id']; 
    $doctorId = $appointmentData['doctor_id'];  

    // Determine transfer_status based on the payment_flow metadata
    $transferStatus = 'pending'; // Default for 'automatic_connect' flow

    if ($paymentFlow === 'manual_platform') {
        $transferStatus = 'manual_pending';
    }

    try {
        $stmtCheck = $pdo->prepare("SELECT payment_record_id FROM payments_history WHERE stripe_payment_id = ?");
        $stmtCheck->execute([$stripePaymentIntentId]);
        $existingRecord = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($existingRecord) {
            
            // --- INÍCIO DA CORREÇÃO ---
            // O bug estava aqui. Faltava o "transfer_status = ?" no UPDATE.
            $stmtUpdate = $pdo->prepare("UPDATE payments_history SET 
                                            payment_status = 'paid', 
                                            amount = ?, 
                                            currency = ?, 
                                            updated_at = NOW(), 
                                            stripe_charge_id = ?, 
                                            transfer_status = ? 
                                        WHERE stripe_payment_id = ?");
            $stmtUpdate->execute([$amount, $currency, $chargeId, $transferStatus, $stripePaymentIntentId]);
            // --- FIM DA CORREÇÃO ---

            error_log("Existing payment record updated to 'paid': " . $stripePaymentIntentId . " and transfer_status set to: " . $transferStatus);

        } else {
            // Now $appointmentId, $doctorId, and $patientId are the correct integers
            $stmtInsert = $pdo->prepare("INSERT INTO payments_history (appointment_id, doctor_id, patient_id, amount, currency, stripe_payment_id, stripe_charge_id, payment_status, transfer_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)");
            $stmtInsert->execute([$appointmentId, $doctorId, $patientId, $amount, $currency, $stripePaymentIntentId, $chargeId, $transferStatus]);
            error_log("New payment record inserted for 'paid': " . $stripePaymentIntentId . " with transfer status: " . $transferStatus);
        }

    } catch (PDOException $e) {
        error_log("PDO Error in handlePaymentIntentSucceeded: " . $e->getMessage());
    }
}

function handleChargeRefunded($pdo, $charge) {
    $stripePaymentIntentId = $charge->payment_intent ?? null;
    $amountRefunded = $charge->amount_refunded / 100;

    if (!$stripePaymentIntentId) {
         error_log("Charge Refunded: Could not find PaymentIntent ID for charge " . $charge->id);
         return;
    }

    error_log("Charge Refunded: " . $stripePaymentIntentId . ". Amount refunded: " . $amountRefunded);

    try {
        $stmt = $pdo->prepare("UPDATE payments_history SET payment_status = 'refunded', amount_transferred = 0, platform_fee = 0, transfer_status = 'failed', updated_at = NOW() WHERE stripe_payment_id = ?");
        $stmt->execute([$stripePaymentIntentId]);

        if ($stmt->rowCount() > 0) {
            error_log("Payment record " . $stripePaymentIntentId . " updated to 'refunded'.");
        } else {
            error_log("Warning: Payment record " . $stripePaymentIntentId . " not found for refund.");
        }


        // Changed `payment to `stripe_payment_id` to match the schema.
        $stmtAppointment = $pdo->prepare("UPDATE appointments SET payment_status = 'refunded', status = 'cancelled', updated_at = NOW() WHERE stripe_payment_id = ?");

        $stmtAppointment->execute([$stripePaymentIntentId]);
        if ($stmtAppointment->rowCount() > 0) {
            error_log("Appointment status associated with PaymentIntent " . $stripePaymentIntentId . " updated to 'cancelled' and 'refunded'.");
        } else {
            error_log("Warning: Appointment associated with PaymentIntent " . $stripePaymentIntentId . " not found or not updated to 'cancelled' and 'refunded'.");
        }


    } catch (PDOException $e) {
        error_log("PDO Error in handleChargeRefunded: " . $e->getMessage());
    }
}

function handlePaymentIntentFailed($pdo, $paymentIntent) {
    $stripePaymentIntentId = $paymentIntent->id;

    $appointmentId = null; 
    $patientId = $paymentIntent->metadata->patient_id ?? null;
    $doctorId = $paymentIntent->metadata->doctor_id ?? null;

    
    $failureCode = $paymentIntent->last_payment_error->code ?? 'unknown_error';
    $failureMessage = $paymentIntent->last_payment_error->message ?? 'No specific error message.';

    error_log("PaymentIntent Failed: " . $stripePaymentIntentId . " for metadata_appointment_id: " . ($paymentIntent->metadata->appointment_id ?? 'none') . ". Reason: " . $failureMessage);

    if (!$patientId || !$doctorId) {
        error_log("PaymentIntent Failed: Missing patient_id or doctor_id metadata for PaymentIntent " . $stripePaymentIntentId);
    }

    try {
        $stmtCheck = $pdo->prepare("SELECT payment_record_id FROM payments_history WHERE stripe_payment_id = ?");
        $stmtCheck->execute([$stripePaymentIntentId]);
        $existingRecord = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($existingRecord) {
            $stmtUpdate = $pdo->prepare("UPDATE payments_history SET payment_status = 'failed', transfer_status = 'failed', updated_at = NOW() WHERE stripe_payment_id = ?");
            $stmtUpdate->execute([$stripePaymentIntentId]);
            error_log("Existing payment record updated to 'failed': " . $stripePaymentIntentId);
        } else {
            $amount = $paymentIntent->metadata->consultation_fee_charged ?? 0;
            $currency = $paymentIntent->metadata->currency_charged ?? 'eur';

            $stmtInsert = $pdo->prepare("INSERT INTO payments_history (appointment_id, doctor_id, patient_id, amount, currency, stripe_payment_id, payment_status, transfer_status) VALUES (?, ?, ?, ?, ?, ?, 'failed', 'failed')");
            $stmtInsert->execute([$appointmentId, $doctorId, $patientId, $amount, $currency, $stripePaymentIntentId]);
            error_log("New payment record inserted as 'failed': " . $stripePaymentIntentId);
        }

        $tempAppointmentId = $paymentIntent->metadata->appointment_id ?? null;
        $stmtAppointment = $pdo->prepare("UPDATE appointments SET payment_status = 'failed', status = 'failed', failure_code = ?, failure_message = ?, updated_at = NOW() WHERE appointment_id = ?");
        $stmtAppointment->execute([$failureCode, $failureMessage, $tempAppointmentId]);
        if ($stmtAppointment->rowCount() > 0) {
            error_log("Appointment status " . $tempAppointmentId . " updated to 'failed'. Reason: " . $failureMessage);
        } else {
            error_log("Warning: Appointment " . $tempAppointmentId . " not found or not updated to 'failed' (which is expected in the standard booking flow).");
        }

    } catch (PDOException $e) {
        error_log("PDO Error in handlePaymentIntentFailed: " . $e->getMessage());
    }
}
?>