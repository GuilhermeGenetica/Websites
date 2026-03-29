<?php
// api/clear_history.php
// Remove todo o histórico de frases de um usuário.

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-control-allow-headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // --- Autenticação JWT ---
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        throw new Exception("Authorization header missing or invalid.");
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        http_response_code(401);
        throw new Exception("User ID not found in token.");
    }
    
    // --- Lógica de Exclusão ---
    // A query garante que um usuário só pode deletar o seu próprio histórico.
    $stmt = $conn->prepare("DELETE FROM user_phrases_history WHERE user_id = ?");
    $stmt->execute([$userId]);

    $rowCount = $stmt->rowCount();
    custom_log("User {$userId} cleared their history. {$rowCount} items deleted.");
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Histórico limpo com sucesso.']);

} catch (Exception $e) {
    // Captura o código de status HTTP se já foi definido (ex: 401)
    $statusCode = http_response_code() !== 200 ? http_response_code() : 400;
    custom_log("Clear History Error: " . $e->getMessage());
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
