<?php
// /api/forgot_password.php
// This version contains the definitive fix for the email sending issue.

require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

log_error("forgot_password.php execution started.", __FILE__, __LINE__);

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    log_error("Invalid input received.", __FILE__, __LINE__, $data);
    json_response(['error' => 'A valid email address is required.'], 400);
}

$email = $data['email'];
log_error("Processing password reset for email: {$email}", __FILE__, __LINE__);

try {
    global $pdo;
    
    // **THE FIX**: The SQL query now includes the 'email' column.
    $stmt = $pdo->prepare("SELECT id, full_name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        log_error("User found in database. Proceeding with token generation.", __FILE__, __LINE__, ['user_id' => $user['id']]);

        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600);

        // --- Database Transaction ---
        log_error("Starting database transaction.", __FILE__, __LINE__);
        $pdo->beginTransaction();
        try {
            $stmt_delete = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
            $stmt_delete->execute([$email]);
            log_error("Old tokens deleted for email: {$email}", __FILE__, __LINE__);

            $stmt_insert = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
            $stmt_insert->execute([$email, $token, $expires]);
            log_error("New token inserted for email: {$email}", __FILE__, __LINE__);
            
            $pdo->commit();
            log_error("Database transaction committed successfully.", __FILE__, __LINE__);

        } catch (Exception $dbEx) {
            $pdo->rollBack();
            log_error("Database transaction FAILED and was rolled back: " . $dbEx->getMessage(), __FILE__, $dbEx->getLine());
            throw $dbEx;
        }
        
        // --- Email Sending Attempt ---
        $resetLink = get_env_var('DOMAIN_URL') . '/reset-password?token=' . $token;
        
        try {
            log_error("Attempting to send email via PHPMailer (SMTP)...", __FILE__, __LINE__);
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = get_env_var('SMTP_HOST');
            $mail->SMTPAuth   = true;
            $mail->Username   = get_env_var('SMTP_USER');
            $mail->Password   = get_env_var('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = (int)get_env_var('SMTP_PORT', 465);
            $mail->CharSet    = 'UTF-8';

            // This line will now work because $user['email'] exists.
            $mail->setFrom(get_env_var('SMTP_FROM_EMAIL'), get_env_var('SMTP_FROM_NAME'));
            $mail->addAddress($user['email'], $user['full_name']);

            $mail->isHTML(true);
            $mail->Subject = 'Your Password Reset Request for NutraGenius';
            $mail->Body    = "Hello {$user['full_name']},<br><br>Click the link to reset your password for NutraGenius: <a href='{$resetLink}'>Reset Password</a><br><br>This link expires in 1 hour.";
            
            $mail->send();
            log_error("PHPMailer (SMTP) email sent successfully to {$user['email']}.", __FILE__, __LINE__);

        } catch (PHPMailerException $mailEx) {
            log_error("PHPMailer (SMTP) FAILED: " . $mailEx->getMessage(), __FILE__, $mailEx->getLine());
            
            // Fallback attempt (should not be needed now but kept as a safeguard)
            log_error("Attempting fallback send via PHP mail()...", __FILE__, __LINE__);
            $subject = 'Your Password Reset Request for NutraGenius';
            $message = "Hello {$user['full_name']},\n\nUse this link to reset your password: {$resetLink}\nThis link expires in 1 hour.";
            $headers = 'From: ' . get_env_var('SMTP_FROM_NAME') . ' <' . get_env_var('SMTP_FROM_EMAIL') . '>';
            
            if (mail($user['email'], $subject, $message, $headers)) {
                log_error("Fallback PHP mail() sent successfully to {$user['email']}.", __FILE__, __LINE__);
            } else {
                log_error("Fallback PHP mail() ALSO FAILED.", __FILE__, __LINE__);
            }
        }

    } else {
        log_error("User not found for email: {$email}. No action taken.", __FILE__, __LINE__);
    }

    log_error("Script finished. Sending success response to client.", __FILE__, __LINE__);
    json_response(['message' => 'If an account with that email exists, a password reset link has been sent.']);

} catch (Exception $e) {
    log_error("A critical, unrecoverable error occurred: " . $e->getMessage(), $e->getFile(), $e->getLine());
    json_response(['error' => 'An error occurred while processing your request. Please try again later.'], 500);
}

