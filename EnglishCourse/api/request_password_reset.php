<?php
// api/request_password_reset.php

// --- START: DEBUG CONFIGURATION (TO BE REMOVED OR DISABLED IN PRODUCTION) ---
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

// Include the email sending function (relative path to the root)
require_once __DIR__ . '/../send_email.php';

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
        custom_log("RequestPasswordReset Error: No data provided.");
        echo json_encode(['success' => false, 'message' => 'Nenhum dado fornecido.']);
        exit();
    }
    $data = json_decode($input, true);

    // 2. Validate email field
    if (!isset($data['email'])) {
        http_response_code(400);
        custom_log("RequestPasswordReset Error: Missing email field.");
        echo json_encode(['success' => false, 'message' => 'O campo de email é obrigatório.']);
        exit();
    }

    // 3. Sanitize and Validate Email
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $email = filter_var($email, FILTER_VALIDATE_EMAIL);

    if (!$email) {
        http_response_code(400);
        custom_log("RequestPasswordReset Error: Invalid email format provided: " . $data['email']);
        echo json_encode(['success' => false, 'message' => 'Formato de email inválido.']);
        exit();
    }

    // --- SECURITY: GENERIC MESSAGE TO PREVENT USER ENUMERATION ---
    $generic_success_message = "Se o e-mail fornecido estiver em nosso sistema, um link de redefinição de senha será enviado.";
    
    // 4. Check if user exists
    $stmt_user = $conn->prepare("SELECT id, name FROM users WHERE email = ?");
    $stmt_user->execute([$email]);
    $user = $stmt_user->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $user_id = $user['id'];
        $user_name = $user['name'];

        // 5. Generate unique token (using PHP's secure random generator)
        $token = bin2hex(random_bytes(32)); // 64 character hex string
        $expires_at = date("Y-m-d H:i:s", time() + 3600); // Token valid for 1 hour

        // 6. Store token in password_resets table (requires table: id, user_id, token, expires_at)
        // Clean up any old tokens for this user first (prevention of database clutter)
        $conn->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$user_id]);

        $stmt_insert = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
        
        if ($stmt_insert->execute([$user_id, $token, $expires_at])) {
            custom_log("Password reset token generated for user ID: " . $user_id);
            
            // 7. Construct Reset Link
            $reset_link = FRONTEND_BASE_URL . "/reset-password?token=" . urlencode($token);
            
            // 8. Prepare and Send Email
            $subject = "Perfect English: Password Reset Request";
            $body = "
                <html>
                <body style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;'>
                        <h2 style='color: #2b6cb0;'>Password Reset Request</h2>
                        <p>Hi " . htmlspecialchars($user_name) . ",</p>
                        <p>You requested a password reset for your Perfect English account. Click the button below to reset your password:</p>
                        <p style='text-align: center;'>
                            <a href='" . $reset_link . "' 
                               style='display: inline-block; padding: 10px 20px; margin: 15px 0; background-color: #2b6cb0; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'
                               target='_blank'>
                               Reset My Password
                            </a>
                        </p>
                        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                        <p><small><a href='" . $reset_link . "'>" . $reset_link . "</a></small></p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p>Best regards,</p>
                        <p>The Perfect English Team</p>
                    </div>
                </body>
                </html>
            ";

            if (sendEmail($email, $subject, $body)) {
                custom_log("Password reset email successfully sent to: " . $email);
                // SUCCESS: Return generic message to prevent user enumeration
                echo json_encode(array("success" => true, "message" => $generic_success_message));
            } else {
                custom_log("Error sending password reset email to: " . $email);
                // FAILURE: Even if email fails, return generic message for security
                echo json_encode(array("success" => true, "message" => $generic_success_message));
            }
        } else {
            $db_error_info = $stmt_insert->errorInfo();
            $db_error = $db_error_info[2] ?? "Unknown error inserting token.";
            custom_log("Database Error inserting token: " . $db_error);
            // FAILURE: Even if database insert fails, return generic message for security
            echo json_encode(array("success" => true, "message" => $generic_success_message));
        }
    } else {
        custom_log("Email not found in database: " . $email . " (returning generic success message)");
        // EMAIL NOT FOUND: Return generic message for security
        echo json_encode(array("success" => true, "message" => $generic_success_message));
    }

} catch (PDOException $e) {
    custom_log("Database Error in request_password_reset.php: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(array("success" => false, "message" => "Erro interno do servidor. Por favor, tente novamente mais tarde."));

} catch (Exception $e) {
    custom_log("General Error in request_password_reset.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Erro interno do servidor."));
}
?>