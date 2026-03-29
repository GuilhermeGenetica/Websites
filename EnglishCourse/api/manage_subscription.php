<?php
// api/manage_subscription.php

require_once __DIR__ . '/bootstrap.php';
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE || empty($data['userId'])) {
        throw new Exception("User ID is required.");
    }

    $userId = $data['userId'];

    // CORREÇÃO: Busca o stripe_customer_id que é mais fiável para criar o portal.
    $stmt = $conn->prepare("SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || (empty($user['stripe_customer_id']) && empty($user['stripe_subscription_id']))) {
        // CORREÇÃO: Mensagem de erro melhorada
        throw new Exception("Este utilizador não possui uma assinatura ativa no Stripe para gerir. O plano pode ter sido concedido administrativamente.");
    }

    $customerId = $user['stripe_customer_id'];
    
    // Fallback: se não houver customer_id, tenta obter a partir da subscription_id (menos comum)
    if (empty($customerId) && !empty($user['stripe_subscription_id'])) {
        $subscription = \Stripe\Subscription::retrieve($user['stripe_subscription_id']);
        $customerId = $subscription->customer;
    }
    
    if (empty($customerId)) {
         throw new Exception("Não foi possível encontrar o ID de cliente do Stripe para este utilizador.");
    }


    $returnUrl = $frontendBaseUrl . '/profile';
    $portalSession = \Stripe\BillingPortal\Session::create([
        'customer' => $customerId,
        'return_url' => $returnUrl,
    ]);

    http_response_code(200);
    echo json_encode(['success' => true, 'url' => $portalSession->url]);

} catch (\Stripe\Exception\ApiErrorException $e) {
    http_response_code(500);
    custom_log("Stripe API Error in manage_subscription.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Stripe Error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    custom_log("Error in manage_subscription.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server Error: ' . $e->getMessage()]);
}
