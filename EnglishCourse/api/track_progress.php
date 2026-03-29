<?php
// api/track_progress.php
// End-point central para todas as atualizações de progresso do usuário.

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

// Função auxiliar para buscar e retornar o estado de progresso mais recente
function getLatestProgress($conn, $userId) {
    // Busca progresso principal
    $stmtProgress = $conn->prepare("SELECT xp, streak, last_activity_date, completed_activities FROM user_progress WHERE user_id = ?");
    $stmtProgress->execute([$userId]);
    $progress = $stmtProgress->fetch();

    // Conta frases aprendidas
    $stmtSentences = $conn->prepare("SELECT COUNT(id) FROM user_phrases_history WHERE user_id = ?");
    $stmtSentences->execute([$userId]);
    $sentencesCount = $stmtSentences->fetchColumn();

    // Calcula progresso de nível (ex: 1000 XP por nível)
    define('XP_PER_LEVEL', 1000);
    $levelProgress = ($progress['xp'] % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

    return [
        'xp' => (int)$progress['xp'],
        'streak' => (int)$progress['streak'],
        'level_progress' => floor($levelProgress),
        'completed_activities' => $progress['completed_activities'] ?: '{}', // Retorna um JSON de objeto vazio se for nulo
        'learned_sentences_count' => (int)$sentencesCount
    ];
}


try {
    // --- Autenticação JWT ---
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Cabeçalho de autorização em falta ou inválido.");
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("ID de usuário não encontrado no token.");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? null;

    if (!$action) {
        throw new Exception("Ação em falta para registar o progresso.");
    }

    $conn->beginTransaction();

    // 1. Obter progresso atual e garantir que a linha exista
    $stmt = $conn->prepare("SELECT id, streak, last_activity_date, xp, completed_activities FROM user_progress WHERE user_id = ? FOR UPDATE");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch();

    if (!$progress) {
        $conn->prepare("INSERT INTO user_progress (user_id) VALUES (?)")->execute([$userId]);
        $progress = ['id' => $conn->lastInsertId(), 'streak' => 0, 'last_activity_date' => null, 'xp' => 0, 'completed_activities' => '{}'];
    }

    $xpGained = 0;
    $today = date('Y-m-d');

    // 2. Executar Ação
    switch ($action) {
        case 'complete_activity':
            if (!isset($data['activity_id'])) throw new Exception("ID da atividade em falta.");
            
            $activityId = $data['activity_id'];
            $completed = json_decode($progress['completed_activities'] ?: '{}', true);

            // Apenas adiciona XP se a atividade ainda não foi concluída
            if (!isset($completed[$activityId])) {
                $completed[$activityId] = true;
                $newCompletedJson = json_encode($completed);
                
                $stmt = $conn->prepare("UPDATE user_progress SET completed_activities = ? WHERE user_id = ?");
                $stmt->execute([$newCompletedJson, $userId]);
                
                $xpGained = 15; // XP por completar uma atividade do cronograma
            }
            break;
            
        case 'study_sentence':
            if (!isset($data['phrase_id'])) throw new Exception("ID da frase em falta.");
            $stmt = $conn->prepare("INSERT INTO user_phrases_history (user_id, phrase_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP()");
            $stmt->execute([$userId, $data['phrase_id']]);
            $xpGained = 5; // XP por estudar uma frase
            break;

        case 'toggle_favorite':
            if (!isset($data['phrase_id'])) throw new Exception("ID da frase em falta.");
            // Garante que a entrada existe e inverte o estado de favorito
            $stmt = $conn->prepare("INSERT INTO user_phrases_history (user_id, phrase_id, is_favorite) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_favorite = NOT is_favorite, viewed_at = CURRENT_TIMESTAMP()");
            $stmt->execute([$userId, $data['phrase_id']]);
            break;
            
        default:
            throw new Exception("Ação desconhecida: " . htmlspecialchars($action));
    }

    // 3. Atualizar XP, Streak e data da última atividade se houver ganho de XP
    if ($xpGained > 0) {
        $lastActivity = $progress['last_activity_date'];
        $newStreak = (int)$progress['streak'];
        
        if ($lastActivity != $today) {
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            if ($lastActivity == $yesterday) {
                $newStreak++;
            } else {
                $newStreak = 1;
            }
        }
        
        $stmt = $conn->prepare("UPDATE user_progress SET xp = xp + ?, streak = ?, last_activity_date = ? WHERE user_id = ?");
        $stmt->execute([$xpGained, $newStreak, $today, $userId]);
    }

    $conn->commit();
    
    // Retorna o estado mais recente do progresso para o frontend
    $updatedProgress = getLatestProgress($conn, $userId);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Progresso registado.', 'updatedProgress' => $updatedProgress]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    custom_log("Track Progress Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Erro ao registar o progresso: ' . $e->getMessage()]);
}
