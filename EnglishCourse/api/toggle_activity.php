<?php
// api/toggle_activity.php
// Endpoint para marcar ou desmarcar uma atividade como concluída, sem afetar XP.

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-control-allow-origin: " . $frontendBaseUrl);
header("Access-control-allow-methods: POST, OPTIONS");
header("Access-control-allow-headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // --- Autenticação JWT ---
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Acesso negado. Token não fornecido.", 401);
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("ID de utilizador inválido no token.", 401);
    }

    // --- Lógica Principal ---
    $data = json_decode(file_get_contents("php://input"), true);
    $activityId = $data['activity_id'] ?? null;

    if (!$activityId) {
        throw new Exception("ID da atividade é obrigatório.", 400);
    }

    $conn->beginTransaction();

    // 1. Obter o registo de progresso atual do utilizador
    $stmt = $conn->prepare("SELECT completed_activities FROM user_progress WHERE user_id = ? FOR UPDATE");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch();

    if (!$progress) {
        // Se não existir, cria um registo. Essencial para novos utilizadores.
        $conn->prepare("INSERT INTO user_progress (user_id, completed_activities) VALUES (?, '{}')")->execute([$userId]);
        $completed = [];
    } else {
        $completed = json_decode($progress['completed_activities'] ?: '{}', true);
    }

    // 2. Alternar o estado da atividade
    if (isset($completed[$activityId])) {
        // Se a atividade já está marcada, desmarca (remove a chave)
        unset($completed[$activityId]);
    } else {
        // Se a atividade não está marcada, marca (adiciona a chave)
        $completed[$activityId] = true;
    }

    // 3. Atualizar o JSON no banco de dados
    $newCompletedJson = json_encode($completed);
    $stmt = $conn->prepare("UPDATE user_progress SET completed_activities = ? WHERE user_id = ?");
    $stmt->execute([$newCompletedJson, $userId]);
    
    $conn->commit();

    // 4. Retornar o progresso atualizado para o frontend
    // (A função getLatestProgress está no track_progress.php, vamos replicar a parte essencial aqui)
    $stmtProgress = $conn->prepare("SELECT xp, streak, last_activity_date, completed_activities FROM user_progress WHERE user_id = ?");
    $stmtProgress->execute([$userId]);
    $updatedProgressData = $stmtProgress->fetch();

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Estado da atividade atualizado.',
        'completed_activities' => json_decode($newCompletedJson) // Retorna o objeto JSON atualizado
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    custom_log("Toggle Activity Error: " . $e->getMessage());
    $statusCode = $e->getCode() ?: 400;
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
