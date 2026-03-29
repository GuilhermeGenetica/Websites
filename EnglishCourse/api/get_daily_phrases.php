<?php
// api/get_daily_phrases.php

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
    $userLevel = $decoded->data->level;

    if (!$userId) {
        throw new Exception("User ID not found in token.");
    }

    $numberOfPhrases = 3;

    // Query robusta para selecionar frases, priorizando o nível do usuário
    // e evitando as que já foram vistas.
    $sql = "
        SELECT 
            p.id, p.english, p.portuguese, p.phonetic, p.level,
            COALESCE(uph.is_favorite, 0) AS is_favorite
        FROM phrases p
        LEFT JOIN user_phrases_history uph ON p.id = uph.phrase_id AND uph.user_id = :userId
        WHERE uph.id IS NULL -- Filtra as frases que o usuário NUNCA viu
        ORDER BY 
            CASE WHEN p.level = :userLevel THEN 0 ELSE 1 END, -- Prioriza o nível do usuário
            RAND()
        LIMIT :limit
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':userLevel', $userLevel, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $numberOfPhrases, PDO::PARAM_INT);
    $stmt->execute();
    $phrases = $stmt->fetchAll();

    // Se não encontrar nenhuma frase nova, o usuário viu todas.
    // Resetamos o histórico de frases NÃO favoritas para que elas possam aparecer novamente.
    if (empty($phrases)) {
        custom_log("User {$userId} has seen all available phrases. Resetting non-favorite history.");
        
        $conn->prepare("DELETE FROM user_phrases_history WHERE user_id = ? AND is_favorite = 0")->execute([$userId]);

        // Tenta buscar novamente após o reset
        $stmt->execute();
        $phrases = $stmt->fetchAll();
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'phrases' => $phrases]);

} catch (Exception $e) {
    custom_log("Get Daily Phrases Error: " . $e->getMessage());
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: ' . $e->getMessage(), 'phrases' => []]);
}
