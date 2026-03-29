<?php
// Ficheiro: api/create_payment_intent.php
// Esta é a versão corrigida com a lógica de Destination Charge (split 90/10)

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];
$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY']; // Deve ser a sua sk_live_...

\Stripe\Stripe::setApiKey($stripeSecretKey);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access. Token missing."]);
    exit();
}

$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token. Please log in again."]);
    exit();
}

if ($decodedToken['user_type'] !== 'patient') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Only patients can initiate payments."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$doctorId = $data['doctor_id'] ?? null;
$appointmentId = $data['appointmentId'] ?? null;
$currencyFromRequest = isset($data['currency']) ? strtolower($data['currency']) : null; 

if (empty($doctorId) || empty($appointmentId) || empty($currencyFromRequest)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Doctor ID, Appointment ID, and Currency are required."]);
    exit();
}

try {
    global $pdo; 

    $stmt = $pdo->prepare("SELECT consultation_fee, fee_currency, stripe_connect_id, stripe_onboarding_complete FROM users_doctors WHERE doctor_id = ?");
    $stmt->execute([$doctorId]);
    $doctorData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$doctorData) {
         throw new Exception("Doctor not found.");
    }

    if ($doctorData['consultation_fee'] === null || $doctorData['consultation_fee'] <= 0) {
        throw new Exception("Doctor's consultation fee is not configured or is in-valid.");
    }
    
    $doctorConsultationFee = (float)$doctorData['consultation_fee'];
    $doctorCurrency = strtolower($doctorData['fee_currency'] ?? 'eur');
    $doctorStripeConnectId = $doctorData['stripe_connect_id'];
    $isStripeOnboarded = $doctorData['stripe_onboarding_complete'] && $doctorData['stripe_connect_id'];

    if ($doctorCurrency !== $currencyFromRequest) {
        error_log("Currency mismatch. Doctor configured: {$doctorCurrency}, Request sent: {$currencyFromRequest}");
        throw new Exception("Currency mismatch error. Please refresh the page and try again.");
    }

    $amountInCents = round($doctorConsultationFee * 100);
    $currency = $doctorCurrency;
    
    $paymentIntentParams = [
        'amount' => $amountInCents,
        'currency' => $currency,
        'metadata' => [
            'appointment_id' => $appointmentId,
            'patient_id' => $decodedToken['user_id'],
            'patient_email' => $decodedToken['email'],
            'doctor_id' => $doctorId,
            'consultation_fee_charged' => $doctorConsultationFee,
            'currency_charged' => $currency
        ],
        'receipt_email' => $decodedToken['email'],
    ];

    if ($isStripeOnboarded) {
        // --- INÍCIO DA CORREÇÃO: LÓGICA DE SPLIT 90/10 ---
        // Este é um "Destination Charge".
        // O dinheiro vai para o médico (destination), e a plataforma retém 10% (application_fee_amount).
        
        // Calcular a taxa da plataforma (10%)
        $platformFeeInCents = round($amountInCents * 0.10);

        $paymentIntentParams['application_fee_amount'] = $platformFeeInCents;
        $paymentIntentParams['transfer_data'] = [
            'destination' => $doctorStripeConnectId,
        ];

        // Metadados atualizados para refletir o fluxo
        $paymentIntentParams['metadata']['payment_flow'] = 'automatic_connect';
        $paymentIntentParams['metadata']['platform_fee_calculated'] = $platformFeeInCents / 100;
        // --- FIM DA CORREÇÃO ---

    } else {
        // Fluxo Manual: O pagamento é uma Cobrança Direta para a plataforma.
        // A plataforma pagará o médico manualmente.
        $paymentIntentParams['metadata']['payment_flow'] = 'manual_platform';
    }

    $paymentIntent = \Stripe\PaymentIntent::create($paymentIntentParams);

    echo json_encode([
        "success" => true,
        "clientSecret" => $paymentIntent->client_secret,
        "amount" => $doctorConsultationFee,
        "currency" => $currency
    ]);

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    error_log("create_payment_intent.php: Stripe Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Error creating Payment Intent: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("create_payment_intent.php: General Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Internal server error: " . $e->getMessage()
    ]);
}
?>