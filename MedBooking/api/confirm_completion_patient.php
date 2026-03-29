<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];
$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'];

// --- INÍCIO DO BLOCO EM FALTA ---
// Este bloco estava em falta no seu ficheiro, causando os erros "Undefined variable $decodedToken"
try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $secretKey);
    if (!$decodedToken || $decodedToken['user_type'] !== 'patient') {
        throw new Exception("Access denied. For patients only.", 403);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 ? $e->getCode() : 401);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
    exit();
}
// --- FIM DO BLOCO EM FALTA ---

$patientId = $decodedToken['user_id'];
$data = json_decode(file_get_contents("php://input"), true);
$appointmentId = $data['appointment_id'] ?? null;

if (!$appointmentId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Appointment ID is required."]);
    exit();
}

if (!function_exists('triggerStripeTransfer')) {
    function triggerStripeTransfer($pdo, $stripeSecretKey, $appointmentId, $patientId = null) {
        \Stripe\Stripe::setApiKey($stripeSecretKey);

        try {
            $pdo->beginTransaction();

            $sql = "SELECT 
                        a.appointment_id, a.doctor_id, a.patient_id, a.status,
                        ph.payment_record_id, ph.amount, ph.currency, ph.stripe_charge_id, ph.transfer_status,
                        ud.stripe_connect_id
                    FROM appointments a
                    JOIN payments_history ph ON a.appointment_id = ph.appointment_id
                    JOIN users_doctors ud ON a.doctor_id = ud.doctor_id
                    WHERE a.appointment_id = ? FOR UPDATE";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$appointmentId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$data) {
                $pdo->rollBack();
                return ['code' => 404, 'response' => ["success" => false, "message" => "Appointment not found or its payment record is missing."]];
            }
            
            if ($patientId && $data['patient_id'] != $patientId) {
                 $pdo->rollBack();
                 return ['code' => 403, 'response' => ["success" => false, "message" => "Access denied. You can only confirm your own appointments."]];
            }

            if ($data['status'] === 'completed' || $data['transfer_status'] === 'released' || $data['transfer_status'] === 'awaiting_admin_payout' || $data['transfer_status'] === 'manual_paid_out') {
                $pdo->rollBack();
                return ['code' => 400, 'response' => ["success" => false, "message" => "This appointment has already been completed and funds released."]];
            }
            
            if ($data['status'] === 'cancelled' || $data['status'] === 'failed') {
                $pdo->rollBack();
                return ['code' => 400, 'response' => ["success" => false, "message" => "Cannot complete a cancelled or failed appointment."]];
            }
            
            $transferStatus = trim($data['transfer_status']);

            $platformFeePercentage = (float)($_ENV['PLATFORM_FEE_PERCENTAGE'] ?? 10);
            $totalAmount = (float)$data['amount'];
            $platformFee = round($totalAmount * ($platformFeePercentage / 100), 2);
            $amountToTransfer = $totalAmount - $platformFee;
            $amountToTransferInCents = round($amountToTransfer * 100);

            if ($amountToTransferInCents <= 0) {
                 $platformFee = $totalAmount;
                 $amountToTransfer = 0;
                 error_log("Amount to transfer is zero or negative for appointment {$appointmentId}. Platform fee takes all.");
            }

            $transfer = null;
            $finalTransferStatus = $transferStatus;
            $stripeTransferId = null;

            if ($transferStatus === 'pending') {
                // Automatic Flow
                if (empty($data['stripe_connect_id'])) {
                    $pdo->rollBack();
                    return ['code' => 500, 'response' => ["success" => false, "message" => "Doctor has no Stripe Connect account configured."]];
                }
                
                if (empty($data['stripe_charge_id'])) {
                    $pdo->rollBack();
                    return ['code' => 500, 'response' => ["success" => false, "message" => "Missing Stripe charge ID, cannot create transfer."]];
                }

                if ($amountToTransferInCents > 0) {
                    $transfer = \Stripe\Transfer::create([
                        'amount' => $amountToTransferInCents,
                        'currency' => $data['currency'],
                        'destination' => $data['stripe_connect_id'],
                        'source_transaction' => $data['stripe_charge_id'],
                        'transfer_group' => $data['appointment_id'],
                    ]);
                    $stripeTransferId = $transfer->id;
                }
                $finalTransferStatus = 'released';

            } elseif ($transferStatus === 'manual_pending') {
                // Manual Flow - Patient is confirming.
                $finalTransferStatus = 'awaiting_admin_payout';
                $stripeTransferId = null;
            } else {
                // Catch states like 'failed', 'refunded' or EMPTY
                $pdo->rollBack();
                // Esta é a linha que está a causar o seu erro 400
                return ['code' => 400, 'response' => ["success" => false, "message" => "Cannot complete an appointment with status: " . $transferStatus]];
            }


            $updateAppt = $pdo->prepare("UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE appointment_id = ?");
            $updateAppt->execute([$appointmentId]);

            $updatePayment = $pdo->prepare("UPDATE payments_history SET 
                                                platform_fee = ?, 
                                                amount_transferred = ?, 
                                                stripe_transfer_id = ?, 
                                                transfer_status = ?, 
                                                updated_at = NOW() 
                                            WHERE payment_record_id = ?");
            $updatePayment->execute([$platformFee, $amountToTransfer, $stripeTransferId, $finalTransferStatus, $data['payment_record_id']]);

            $pdo->commit();

            if ($finalTransferStatus === 'awaiting_admin_payout') {
                 return ['code' => 200, 'response' => [
                    "success" => true, 
                    "message" => "Appointment confirmed. Payment will be processed manually by the administration.",
                    "transfer_id" => null
                ]];
            }

            return ['code' => 200, 'response' => [
                "success" => true, 
                "message" => "Appointment confirmed and funds transfer initiated.",
                "transfer_id" => $stripeTransferId
            ]];

        } catch (\Stripe\Exception\ApiErrorException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Stripe API Error during transfer: " . $e->getMessage());
            return ['code' => 500, 'response' => ["success" => false, "message" => "Stripe Error: " . $e->getMessage()]];
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("PDO Error during transfer: " . $e->getMessage());
            return ['code' => 500, 'response' => ["success" => false, "message" => "Database error during funds transfer."]];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("General Error during transfer: " . $e->getMessage());
            return ['code' => 500, 'response' => ["success" => false, "message" => "An unexpected error occurred."]];
        }
    }
}

global $pdo;
$result = triggerStripeTransfer($pdo, $stripeSecretKey, $appointmentId, $patientId);

http_response_code($result['code']);
echo json_encode($result['response']);
exit();
?>