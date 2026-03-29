<?php
// api/record_phrase_progress.php
// Endpoint dedicado para registar interações com frases (estudadas, favoritas).

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
    // 1. Autenticação JWT
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Authorization header missing or invalid.", 401);
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("User ID not found in token.", 401);
    }
    
    // 2. Obter Dados do POST
    $data = json_decode(file_get_contents("php://input"), true);
    $phraseId = $data['phrase_id'] ?? null;
    $action = $data['action'] ?? null; // Espera 'studied' ou 'favorite'

    if (!$phraseId || !$action) {
        throw new Exception("Dados de frase ou ação em falta.", 400);
    }
    
    $conn->beginTransaction();

    if ($action === 'studied') {
        // Grava a frase como vista no histórico. Se já existir, apenas atualiza a data.
        // Não altera o estado de favorito se a entrada já existir.
        $stmt = $conn->prepare("
            INSERT INTO user_phrases_history (user_id, phrase_id, viewed_at)
            VALUES (?, ?, CURRENT_TIMESTAMP())
            ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP()
        ");
        $stmt->execute([$userId, $phraseId]);
        
    } else if ($action === 'favorite') {
        // Alterna o estado de favorito.
        // Se a entrada não existir, cria como favorita. Se existir, inverte o estado.
        $stmt = $conn->prepare("
            INSERT INTO user_phrases_history (user_id, phrase_id, is_favorite, viewed_at)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP())
            ON DUPLICATE KEY UPDATE is_favorite = NOT is_favorite, viewed_at = CURRENT_TIMESTAMP()
        ");
        $stmt->execute([$userId, $phraseId]);
        
    } else {
         throw new Exception("Ação desconhecida: " . htmlspecialchars($action), 400);
    }

    $conn->commit();
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Progresso da frase gravado com sucesso.']);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    custom_log("Erro em record_phrase_progress: " . $e->getMessage());
    $statusCode = $e->getCode() ?: 400;
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
