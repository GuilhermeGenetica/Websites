<?php
// api/initiate_shop_link.php (NutraGenius)
// Este endpoint recebe a lista de nutrientes do frontend do NutraGenius,
// gera um token e envia esses dados via cURL (servidor-para-servidor)
// para o backend do NutraShop.

require_once __DIR__ . '/../vendor/autoload.php';

// Carregar variáveis de ambiente (necessário para a URL do NutraShop)
try {
    $dotenv_path = __DIR__ . '/..';
    $dotenv = Dotenv\Dotenv::createImmutable($dotenv_path);
    $dotenv->load();
    global $env;
    $env = $_ENV;
} catch (\Dotenv\Exception\InvalidPathException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Configuration error.']);
    exit;
}

header('Content-Type: application/json');

// Obter a URL de destino do .env
// Certifique-se de adicionar NUTRASHOP_API_RECEIVE_URL="https://nutrashop.app/api/receive_recommendations.php" ao seu arquivo .env do NutraGenius
$nutrashop_receive_url = $env['NUTRASHOP_API_RECEIVE_URL'] ?? null;

if (!$nutrashop_receive_url) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'NutraShop API URL not configured on server.']);
    exit;
}

// 1. Receber dados do frontend do NutraGenius
$input = json_decode(file_get_contents('php://input'), true);
$nutrients = $input['recommendedNutrients'] ?? null;

if (!is_array($nutrients) || empty($nutrients)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No nutrients provided.']);
    exit;
}

// 2. Gerar um token seguro
try {
    $token = bin2hex(random_bytes(32));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to generate secure token.']);
    exit;
}

// 3. Preparar payload para o NutraShop
$payload = [
    'token' => $token,
    'nutrients' => $nutrients
];

// 4. Enviar dados para o NutraShop via cURL (servidor-para-servidor)
try {
    $ch = curl_init($nutrashop_receive_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    // AVISO: Em produção, você deve configurar CURLOPT_SSL_VERIFYPEER para true
    // e fornecer os certificados CA apropriados.
    // Por enquanto, para desenvolvimento/hospedagem sem verificação estrita:
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Apenas para desenvolvimento
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); // Apenas para desenvolvimento

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }

    curl_close($ch);

    $nutrashop_response = json_decode($response, true);

    // 5. Verificar a resposta do NutraShop
    if ($http_code !== 200 || ($nutrashop_response['status'] ?? 'error') !== 'success') {
        throw new Exception('NutraShop server failed to store data. Response: ' . $response);
    }

    // 6. Enviar token de volta ao frontend do NutraGenius
    echo json_encode(['status' => 'success', 'token' => $token]);

} catch (Exception $e) {
    http_response_code(500);
    // Não exponha mensagens de erro de cURL detalhadas ao cliente
    error_log('initiate_shop_link.php cURL Error: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Failed to communicate with NutraShop server.']);
}

?>

