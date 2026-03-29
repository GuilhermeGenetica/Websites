<?php
// api/get_user_progress.php
// Busca o estado completo do progresso do usuário.

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

    // --- Lógica Principal ---
    $conn->beginTransaction();

    // 1. Buscar dados da tabela user_progress
    $stmtProgress = $conn->prepare("SELECT xp, streak, last_activity_date, completed_activities FROM user_progress WHERE user_id = ?");
    $stmtProgress->execute([$userId]);
    $progress = $stmtProgress->fetch();

    // 2. Se não houver registo de progresso, criar um
    if (!$progress) {
        $conn->prepare("INSERT INTO user_progress (user_id) VALUES (?)")->execute([$userId]);
        $progress = ['xp' => 0, 'streak' => 0, 'last_activity_date' => null, 'completed_activities' => '{}'];
    }
    
    $conn->commit();

    // 3. Contar total de frases aprendidas (vistas)
    $stmtSentences = $conn->prepare("SELECT COUNT(id) FROM user_phrases_history WHERE user_id = ?");
    $stmtSentences->execute([$userId]);
    $sentencesCount = $stmtSentences->fetchColumn();

    // 4. Calcular o progresso para o próximo nível (Ex: 1000 XP por nível)
    define('XP_PER_LEVEL', 1000);
    $currentLevelXp = (int)$progress['xp'] % XP_PER_LEVEL;
    $levelProgressPercentage = floor(($currentLevelXp / XP_PER_LEVEL) * 100);

    // 5. Montar a resposta final
    $responseProgress = [
        'xp' => (int)$progress['xp'],
        'streak' => (int)$progress['streak'],
        'level_progress' => $levelProgressPercentage,
        'completed_activities' => $progress['completed_activities'] ?: '{}', // Garante que é sempre um JSON válido
        'learned_sentences_count' => (int)$sentencesCount,
    ];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'progress' => $responseProgress
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    custom_log("Get User Progress Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
