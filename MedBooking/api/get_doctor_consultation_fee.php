<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'] ?? null;
$stripeConsultationPriceId = $_ENV['STRIPE_CONSULTATION_PRICE_ID'] ?? null;

error_log("🔍 STRIPE_SECRET_KEY (full): " . ($stripeSecretKey ? $stripeSecretKey : "NULL/Not Set"));
error_log("🔍 STRIPE_CONSULTATION_PRICE_ID (full): " . ($stripeConsultationPriceId ? $stripeConsultationPriceId : "NULL/Not Set"));

if (!$stripeSecretKey || !$stripeConsultationPriceId) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Configuration error: Stripe keys not set on the server."]);
    error_log("❌ Configuration error: STRIPE_SECRET_KEY or STRIPE_CONSULTATION_PRICE_ID not set.");
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';
\Stripe\Stripe::setApiKey($stripeSecretKey);

$doctorId = $_GET['doctor_id'] ?? null;

error_log("get_doctor_consultation_fee.php: Content of \$_GET: " . print_r($_GET, true));
error_log("get_doctor_consultation_fee.php: doctor_id received: " . ($doctorId ?? 'NULL'));

if (!$doctorId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Doctor ID is required."]);
    exit();
}

try {
    global $pdo;

    $stmt = $pdo->prepare("SELECT consultation_fee FROM users_doctors WHERE doctor_id = ?");
    $stmt->execute([$doctorId]);
    $doctorData = $stmt->fetch(PDO::FETCH_ASSOC);

    $consultationFee = 0;
    $currency = 'usd';

    if ($doctorData && $doctorData['consultation_fee'] !== null && $doctorData['consultation_fee'] > 0) {
        $consultationFee = (float)$doctorData['consultation_fee'];
        $currency = 'usd';
    } else {
        $priceObject = \Stripe\Price::retrieve($stripeConsultationPriceId);
        $consultationFee = $priceObject->unit_amount / 100;
        $currency = $priceObject->currency;
    }

    echo json_encode([
        "success" => true,
        "consultationFee" => $consultationFee,
        "currency" => $currency
    ]);

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    error_log("Stripe Error in get_doctor_consultation_fee.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Error getting price from Stripe: " . $e->getMessage()
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("PDO Error in get_doctor_consultation_fee.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Database error when getting consultation fee: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("General Error in get_doctor_consultation_fee.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Internal server error."
    ]);
}
?>
