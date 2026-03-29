// Adress: api/
// File: get_user_status.php
// Extension: .php

<?php
// Adress: api/
// File: get_user_status.php
// Extension: .php

// This script provides a secure endpoint to fetch the latest user data from the database.
// The frontend can call this to sync the user's state, especially their subscription status.

// --- START: Imports and Configuration ---
require_once 'db_connect.php'; 
use Firebase\JWT\JWT;
use Firebase\JWT\Key; 
use PDOException; // Importar PDOException para tratamento de erro específico
// --- END: Imports and Configuration ---

// Note: $frontendBaseUrl is made available via db_connect.php -> bootstrap.php
// --- START: CORS and Headers Configuration ---
header("Access-Control-Allow-Origin: " . $frontendBaseUrl); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// --- END: CORS and Headers Configuration ---

// --- START: Main Logic ---
try {
    // 1. Get Authorization Header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) {
        throw new Exception("Authorization header not found.");
    }

    // 2. Extract Token
    list($jwt) = sscanf($authHeader, 'Bearer %s');
    if (!$jwt) {
        throw new Exception("JWT not found in Authorization header.");
    }

    // 3. Decode JWT and Authenticate User
    // JWT Secret Key is made available via db_connect.php -> bootstrap.php
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;

    if (!$userId) {
        throw new Exception("User ID not found in token.");
    }

    // 4. Fetch Latest User Data from Database
    // Adicionar um bloco try-catch específico para o erro de coluna ausente
    try {
        custom_log("GET_USER_STATUS: Attempting to fetch user data for ID: " . $userId);
        // O SELECT abaixo é o que causou o erro 1054, mas é necessário para o recurso de subscrição.
        $stmt = $conn->prepare("SELECT id, name, email, level, plan, is_active, stripe_subscription_id FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
    } catch (PDOException $e) {
        // Prevenção de Erro Completa/Log: Se a coluna estiver faltando, registra-se e informa ao cliente.
        $errorMessage = "Database Error during user fetch: " . $e->getMessage();
        custom_log("CRITICAL_DB_ERROR: " . $errorMessage);
        // Retorna 401 para que o frontend faça o logout/redirecione, mas com a mensagem de erro específica.
        http_response_code(401); 
        echo json_encode(['success' => false, 'message' => 'Unauthorized: ' . $errorMessage]);
        exit();
    }
    
    if (!$user) {
        custom_log("GET_USER_STATUS_FAIL: User ID {$userId} not found in database.");
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit();
    }
    
    // 5. Success Response
    // Do not send the password hash.
    unset($user['password']);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'User status retrieved successfully.',
        'user'    => $user
    ]);
    custom_log("GET_USER_STATUS_SUCCESS: Status retrieved for user ID: " . $userId);


} catch (Exception $e) {
    // Tratamento de erros gerais (JWT, Header, etc.)
    $errorMessage = $e->getMessage();
    custom_log("GET_USER_STATUS_ERROR: " . $errorMessage);
    
    // Use 401 para erros de autenticação (JWT inválido, cabeçalho ausente)
    // O erro 401 é o código correto para informar ao frontend que o token deve ser limpo.
    $statusCode = (strpos($errorMessage, 'Authorization header') !== false || strpos($errorMessage, 'JWT') !== false) ? 401 : 500;
    
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: ' . $errorMessage]);
    
}
// --- END: Main Logic ---
?>