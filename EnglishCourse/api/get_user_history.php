<?php
// api/get_user_history.php

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

    // --- Consulta à Base de Dados ---
    // Seleciona todas as frases que o usuário já interagiu
    $stmt = $conn->prepare("
        SELECT 
            h.id AS history_id,
            h.phrase_id,
            h.is_favorite,
            h.viewed_at,
            p.english,
            p.portuguese,
            p.level,
            p.phonetic
        FROM user_phrases_history h
        JOIN phrases p ON h.phrase_id = p.id
        WHERE h.user_id = ?
        ORDER BY h.viewed_at DESC
    ");
    $stmt->execute([$userId]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Garante que 'is_favorite' seja um booleano para consistência com o frontend
    foreach ($history as &$item) {
        $item['is_favorite'] = (bool)$item['is_favorite'];
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'history' => $history]);

} catch (Exception $e) {
    custom_log("Get User History Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'history' => []]);
}
