<?php
// api/reset_password.php

// --- START: DEBUG CONFIGURATION ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Define the path for the custom log file (if not already defined)
if (!defined('CUSTOM_LOG_FILE')) {
    define('CUSTOM_LOG_FILE', sys_get_temp_dir() . '/perfect_english_debug.log');
}

// Helper function to log messages to the custom log file (if not already defined)
if (!function_exists('custom_log')) {
    function custom_log($message) {
        $timestamp = date('Y-m-d H:i:s');
        try {
            file_put_contents(CUSTOM_LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
        } catch (Exception $e) {
            error_log("LOGGING ERROR: Could not write to " . CUSTOM_LOG_FILE . ": " . $e->getMessage());
        }
    }
}
// --- END: DEBUG CONFIGURATION ---

// Include the connection file (which includes config.php and sets FRONTEND_BASE_URL)
require_once __DIR__ . '/db_connect.php'; 

// --- CORS AND HEADERS ---
// Use the constant for CORS
header("Access-Control-Allow-Origin: " . FRONTEND_BASE_URL); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- MAIN LOGIC WITH ERROR PREVENTION ---
try {
    // 1. Get and decode input data
    $input = file_get_contents("php://input");
    if (empty($input)) {
        http_response_code(400);
        custom_log("ResetPassword Error: No data provided.");
        echo json_encode(array("success" => false, "message" => "Nenhum dado fornecido."));
        exit();
    }
    $data = json_decode($input, true);

    // 2. Validate required fields
    if (!isset($data['token'], $data['newPassword'])) {
        http_response_code(400);
        custom_log("ResetPassword Error: Missing token or newPassword fields.");
        echo json_encode(array("success" => false, "message" => "Token e nova senha são obrigatórios."));
        exit();
    }

    $token = $data['token'];
    $new_password = $data['newPassword'];

    // 3. Password strength validation
    if (strlen($new_password) < 8) {
        http_response_code(400);
        custom_log("ResetPassword Error: Password too short.");
        echo json_encode(array("success" => false, "message" => "A nova senha deve ter pelo menos 8 caracteres."));
        exit();
    }

    // 4. Look up token in the database
    $stmt_token = $conn->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = :token");
    $stmt_token->bindParam(':token', $token);
    $stmt_token->execute();
    $reset_record = $stmt_token->fetch(PDO::FETCH_ASSOC);

    if ($reset_record) {
        $user_id = $reset_record['user_id'];
        $expires_at = strtotime($reset_record['expires_at']);
        
        // 5. Check token expiration
        if ($expires_at > time()) {
            
            // 6. Hash the new password
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

            // 7. Update the user's password
            // Note: Assumes the user table has 'id' and 'password' columns.
            $update_stmt = $conn->prepare("UPDATE users SET password = :password, updated_at = NOW() WHERE id = :user_id");
            $update_stmt->bindParam(':password', $hashed_password);
            $update_stmt->bindParam(':user_id', $user_id);
            
            if ($update_stmt->execute()) {
                // 8. Delete the used token from the database
                $delete_stmt = $conn->prepare("DELETE FROM password_resets WHERE token = :token");
                $delete_stmt->bindParam(':token', $token);
                $delete_stmt->execute();
                
                custom_log("Reset Password: Password successfully updated and token deleted for user_id: " . $user_id);
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "Senha redefinida com sucesso! Você já pode fazer login."));
                
            } else {
                // Database update failed
                $error_info = $update_stmt->errorInfo();
                $error_message = $error_info[2] ?? "Unknown error updating password.";
                custom_log("Reset Password Error: Failed to update password for user_id " . $user_id . ": " . $error_message);
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Erro ao redefinir a senha no banco de dados."));
            }
        } else {
            // Token expired
            custom_log("Reset Password Error: Token expired for user_id: " . $user_id);
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Token de redefinição expirado ou inválido."));
        }
    } else {
        // Token not found
        custom_log("Reset Password Error: Token not found in database: " . $token);
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Token de redefinição inválido ou já usado."));
    }
} catch (PDOException $e) {
    custom_log("Reset Password Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Erro interno do servidor."));
    
} catch (Exception $e) {
    custom_log("Reset Password General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Erro interno do servidor."));
}
?>