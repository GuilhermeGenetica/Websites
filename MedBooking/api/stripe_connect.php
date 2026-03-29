<?php
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];
$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'];
$appUrl = $_ENV['APP_URL'];

\Stripe\Stripe::setApiKey($stripeSecretKey);

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

$decodedToken = null;
if ($token) {
    $decodedToken = decodeJwtToken($token, $secretKey);
}

if (!$decodedToken || !isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. A valid doctor token is required for this action."]);
    exit();
}

$doctorId = $decodedToken['user_id'];
$doctorEmail = $decodedToken['email'];
$action = $_GET['action'] ?? null;

global $pdo;

if (!isset($pdo) || !$pdo instanceof PDO) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection error. Check config.php."]);
    exit();
}

switch ($action) {
    case 'create-account-link':
        handleCreateAccountLink($pdo, $doctorId, $doctorEmail, $appUrl);
        break;
    case 'get-account-status':
        handleGetAccountStatus($pdo, $doctorId);
        break;
    case 'handle-reauth':
        handleReauth($pdo, $doctorId, $appUrl);
        break;
    default:
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid Stripe Connect action."]);
}

function handleCreateAccountLink($pdo, $doctorId, $doctorEmail, $appUrl) {
    try {
        $stmt = $pdo->prepare("SELECT stripe_connect_id FROM users_doctors WHERE doctor_id = ?");
        $stmt->execute([$doctorId]);
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

        $accountId = $doctor['stripe_connect_id'];

        if (!$accountId) {
            $account = \Stripe\Account::create([
                'type' => 'express',
                'email' => $doctorEmail,
                'capabilities' => [
                    'card_payments' => ['requested' => true],
                    'transfers' => ['requested' => true],
                ],
            ]);
            $accountId = $account->id;

            $stmt = $pdo->prepare("UPDATE users_doctors SET stripe_connect_id = ? WHERE doctor_id = ?");
            $stmt->execute([$accountId, $doctorId]);
        }

        $returnUrl = $appUrl . '/doctor/dashboard?stripe_return=true';
        $refreshUrl = $appUrl . '/api/stripe_connect.php?action=handle-reauth';

        $accountLink = \Stripe\AccountLink::create([
            'account' => $accountId,
            'refresh_url' => $refreshUrl . "&account_id=" . $accountId,
            'return_url' => $returnUrl . "&account_id=" . $accountId,
            'type' => 'account_onboarding',
        ]);

        echo json_encode(['success' => true, 'url' => $accountLink->url]);

    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Stripe API error in create-account-link: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (PDOException $e) {
        error_log("PDO error in create-account-link: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error while creating account.']);
    }
}

function handleGetAccountStatus($pdo, $doctorId) {
    try {
        $stmt = $pdo->prepare("SELECT stripe_connect_id, stripe_onboarding_complete FROM users_doctors WHERE doctor_id = ?");
        $stmt->execute([$doctorId]);
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$doctor || !$doctor['stripe_connect_id']) {
            echo json_encode(['success' => true, 'status' => ['onboarding_complete' => false, 'charges_enabled' => false]]);
            return;
        }

        $account = \Stripe\Account::retrieve($doctor['stripe_connect_id']);
        $onboardingComplete = $account->details_submitted && $account->charges_enabled;

        if ((bool)$doctor['stripe_onboarding_complete'] !== $onboardingComplete) {
            $stmt = $pdo->prepare("UPDATE users_doctors SET stripe_onboarding_complete = ? WHERE doctor_id = ?");
            $stmt->execute([$onboardingComplete ? 1 : 0, $doctorId]);
        }

        echo json_encode(['success' => true, 'status' => [
            'onboarding_complete' => $onboardingComplete,
            'charges_enabled' => $account->charges_enabled,
            'details_submitted' => $account->details_submitted
        ]]);

    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Stripe API error in get-account-status: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (PDOException $e) {
        error_log("PDO error in get-account-status: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error while checking account status.']);
    }
}

function handleReauth($pdo, $doctorId, $appUrl) {
    $accountId = $_GET['account_id'] ?? null;

    if (!$accountId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Account ID missing.']);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT doctor_id FROM users_doctors WHERE stripe_connect_id = ?");
        $stmt->execute([$accountId]);
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$doctor || $doctor['doctor_id'] != $doctorId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Account ID mismatch.']);
            return;
        }

        $returnUrl = $appUrl . '/doctor/dashboard?stripe_return=true';
        $refreshUrl = $appUrl . '/api/stripe_connect.php?action=handle-reauth&account_id=' . $accountId;

        $accountLink = \Stripe\AccountLink::create([
            'account' => $accountId,
            'refresh_url' => $refreshUrl,
            'return_url' => $returnUrl,
            'type' => 'account_onboarding',
        ]);

        header('Location: ' . $accountLink->url);
        exit();

    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Stripe API error in handle-reauth: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (PDOException $e) {
        error_log("PDO error in handle-reauth: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error during re-authentication.']);
    }
}
?>