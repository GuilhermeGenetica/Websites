<?php
// /api/contact.php
// Versão de produção final. Este código contorna o problema de encaminhamento de email do Hostinger
// enviando a notificação do administrador para um email externo (definido em .env)
// e a confirmação para o utilizador a partir do email oficial.

require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// Log para confirmar que o script foi acionado
log_error("contact.php execution started.", __FILE__, __LINE__);

$data = json_decode(file_get_contents('php://input'), true);

// 1. Validação de entrada
if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['message'])) {
    json_response(['error' => 'Invalid input. Name, email, and message are required.'], 400);
}

// 2. Limpeza dos dados
$name = strip_tags(trim($data['name']));
$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$message = strip_tags(trim($data['message']));

if (empty($name) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($message)) {
    json_response(['error' => 'Invalid data provided.'], 400);
}

// --- TAREFA 1: Enviar o email de notificação para o administrador (para um email externo) ---
try {
    $mail_admin = new PHPMailer(true);

    // Configurações SMTP
    $mail_admin->isSMTP();
    $mail_admin->Host       = $_ENV['SMTP_HOST'];
    $mail_admin->SMTPAuth   = true;
    $mail_admin->Username   = $_ENV['SMTP_USER'];
    $mail_admin->Password   = $_ENV['SMTP_PASS'];
    $mail_admin->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail_admin->Port       = (int)$_ENV['SMTP_PORT'];
    $mail_admin->CharSet    = 'UTF-8';

    // Remetente e Destinatário
    $mail_admin->setFrom($_ENV['SMTP_FROM_EMAIL'], 'NutraGenius Contact Form');
    $mail_admin->addAddress($_ENV['CONTACT_FORM_RECIPIENT']); // Envia para o email externo
    $mail_admin->addReplyTo($email, $name);

    // Conteúdo
    $mail_admin->isHTML(true);
    $mail_admin->Subject = 'New Contact Form Message from ' . $name;
    $mail_admin->Body    = "You have received a new message via the NutraGenius contact form.<br><br>" .
                         "<strong>From:</strong> " . htmlspecialchars($name) . "<br>" .
                         "<strong>Email:</strong> " . htmlspecialchars($email) . "<br><br>" .
                         "<strong>Message:</strong><br>" .
                         "<p style='padding-left: 1em; border-left: 3px solid #ccc;'>" . nl2br(htmlspecialchars($message)) . "</p>";

    $mail_admin->send();
    log_error("Admin notification for contact form sent successfully to " . $_ENV['CONTACT_FORM_RECIPIENT'], __FILE__, __LINE__);

} catch (PHPMailerException $e) {
    log_error("contact.php - FAILED to send ADMIN email: " . $e->getMessage(), __FILE__, $e->getLine());
}


// --- TAREFA 2: Enviar o email de confirmação para o utilizador ---
try {
    $mail_user = new PHPMailer(true);
    
    // Reconfigurar SMTP para a segunda instância
    $mail_user->isSMTP();
    $mail_user->Host       = $_ENV['SMTP_HOST'];
    $mail_user->SMTPAuth   = true;
    $mail_user->Username   = $_ENV['SMTP_USER'];
    $mail_user->Password   = $_ENV['SMTP_PASS'];
    $mail_user->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail_user->Port       = (int)$_ENV['SMTP_PORT'];
    $mail_user->CharSet    = 'UTF-8';

    // Remetente e Destinatário
    $mail_user->setFrom($_ENV['SMTP_FROM_EMAIL'], $_ENV['SMTP_FROM_NAME']);
    $mail_user->addAddress($email, $name); // Enviar para o utilizador

    // Conteúdo
    $mail_user->isHTML(true);
    $mail_user->Subject = 'We have received your message | NutraGenius';
    $mail_user->Body    = "Hello " . htmlspecialchars($name) . ",<br><br>" .
                         "Thank you for contacting us. We have successfully received your message and will get back to you shortly.<br><br>" .
                         "A copy of your message:<br>" .
                         "<p style='padding-left: 1em; border-left: 3px solid #ccc;'>" . nl2br(htmlspecialchars($message)) . "</p><br>" .
                         "Best regards,<br>The NutraGenius Team";
    
    $mail_user->send();
    log_error("User confirmation for contact form sent successfully to " . $email, __FILE__, __LINE__);

} catch (PHPMailerException $e) {
    log_error("contact.php - FAILED to send USER confirmation email: " . $e->getMessage(), __FILE__, $e->getLine());
}

// Resposta final para o frontend
json_response(['message' => 'Your message has been sent. If you provided a valid email, you will receive a confirmation shortly.']);

