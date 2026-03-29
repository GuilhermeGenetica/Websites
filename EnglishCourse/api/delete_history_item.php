<?php
// api/delete_history_item.php
// Remove uma frase específica do histórico de um usuário.

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // --- Autenticação JWT ---
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Authorization header missing or invalid.");
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("User ID not found in token.");
    }
    
    // --- Lógica de Exclusão ---
    $data = json_decode(file_get_contents("php://input"), true);
    $historyId = $data['history_id'] ?? null;

    if (!$historyId) {
        throw new Exception("ID do histórico em falta.");
    }
    
    // A query garante que um usuário só pode deletar itens do seu próprio histórico.
    $stmt = $conn->prepare("DELETE FROM user_phrases_history WHERE id = ? AND user_id = ?");
    $stmt->execute([$historyId, $userId]);

    if ($stmt->rowCount() === 0) {
        // Isso pode acontecer se o item não existir ou pertencer a outro usuário.
        // Por segurança, retornamos 'não encontrado'.
        http_response_code(404);
        throw new Exception("Item do histórico não encontrado ou não pertence a este usuário.");
    }
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Item do histórico removido com sucesso.']);

} catch (Exception $e) {
    custom_log("Delete History Item Error: " . $e->getMessage());
    $statusCode = http_response_code() !== 200 ? http_response_code() : 400;
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
