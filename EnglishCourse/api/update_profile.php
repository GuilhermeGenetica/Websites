<?php
// api/update_profile.php

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // --- Autenticação JWT ---
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Authorization header not found or invalid.");
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("User ID not found in token.");
    }
    
    $data = json_decode(file_get_contents("php://input"), true);

    $conn->beginTransaction();

    // Obter o nível atual do usuário ANTES de qualquer atualização
    $stmt = $conn->prepare("SELECT level FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();
    $originalLevel = $currentUser['level'];

    // 1. Atualizar Nome e Nível
    if (isset($data['name']) && isset($data['level'])) {
        $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
        $newLevel = in_array($data['level'], ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) ? $data['level'] : 'A1';
        
        $stmt = $conn->prepare("UPDATE users SET name = ?, level = ? WHERE id = ?");
        $stmt->execute([$name, $newLevel, $userId]);
        custom_log("User {$userId} updated name to '{$name}' and level to '{$newLevel}'.");

        // **** LÓGICA CRÍTICA: Se o nível mudou, resetar o progresso ****
        if ($originalLevel !== $newLevel) {
            custom_log("User {$userId} changed level from {$originalLevel} to {$newLevel}. Resetting progress.");
            $stmtReset = $conn->prepare(
                "UPDATE user_progress SET xp = 0, streak = 0, last_activity_date = NULL, completed_activities = '{}' WHERE user_id = ?"
            );
            $stmtReset->execute([$userId]);
        }
    }

    // 2. Atualizar Senha
    if (!empty($data['currentPassword']) && !empty($data['newPassword'])) {
        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user && password_verify($data['currentPassword'], $user['password'])) {
            if (strlen($data['newPassword']) < 8) {
                 throw new Exception("A nova senha deve ter pelo menos 8 caracteres.");
            }
            $newHashedPassword = password_hash($data['newPassword'], PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$newHashedPassword, $userId]);
            custom_log("User {$userId} updated password successfully.");
        } else {
            throw new Exception("A senha atual está incorreta.");
        }
    }
    
    $conn->commit();
    
    // Obter dados atualizados para retornar ao frontend e permitir a atualização do AuthContext
    $stmt = $conn->prepare("SELECT id, uid, name, email, level, plan, is_active, is_admin FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso!', 'user' => $updatedUser]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    custom_log("Update Profile Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
