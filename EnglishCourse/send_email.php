<?php
// Adress: /
// File: send_email.php
// Extension: .php

// --- INÍCIO: CONFIGURAÇÕES DE DEBUG (REMOVER OU DESATIVAR EM PRODUÇÃO) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// --- FIM: CONFIGURAÇÕES DE DEBUG ---

// O CUSTOM_LOG_FILE e a função custom_log() serão definidos
// no script que inclui este arquivo (ex: request_password_reset.php).

// Carrega o autoloader do Composer PRIMEIRO para que as classes PHPMailer estejam disponíveis.
require_once __DIR__ . '/vendor/autoload.php';

// Importa as classes PHPMailer AGORA QUE O AUTOLOADER FOI INCLUÍDO.
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// O script chamador é responsável por incluir 'api/config.php' e definir as variáveis globais.
// Variáveis globais esperadas de config.php: $mailHost, $mailPort, $mailUsername, $mailPassword, $mailFromEmail, $mailFromName.

/**
 * Função genérica para enviar e-mails usando PHPMailer.
 *
 * @param string $to_email Email do destinatário.
 * @param string $subject Assunto do e-mail.
 * @param string $body Corpo do e-mail (HTML).
 * @param string|null $reply_to_email Email para resposta (opcional).
 * @param string|null $reply_to_name Nome para resposta (opcional).
 * @return bool True se o e-mail foi enviado com sucesso, false caso contrário.
 */
function sendEmail($to_email, $subject, $body, $reply_to_email = null, $reply_to_name = null) {
    // Acessa as variáveis globais definidas em api/config.php
    global $mailHost, $mailPort, $mailUsername, $mailPassword, $mailFromEmail, $mailFromName;
    
    // Prevenção de Alucinação: Usa custom_log se estiver disponível
    $log_func = function_exists('custom_log') ? 'custom_log' : function($msg) { error_log($msg); };

    $mail = new PHPMailer(true); // O 'true' ativa exceções

    try {
        // Configurações do Servidor
        $mail->isSMTP();
        $mail->Host = $mailHost; // Servidor SMTP
        $mail->SMTPAuth = true; // Ativar autenticação SMTP
        $mail->Username = $mailUsername; // Usuário SMTP
        $mail->Password = $mailPassword; // Senha SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Habilitar TLS
        $mail->Port = $mailPort; // Porta TCP
        
        // Configuração de Charset
        $mail->CharSet = 'UTF-8';

        // Opções para contornar problemas de certificado em alguns servidores.
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        // Remetente do e-mail
        $mail->setFrom($mailFromEmail, $mailFromName);
        
        // Adiciona o destinatário
        $mail->addAddress($to_email);

        // Adiciona o endereço de resposta, se fornecido
        if ($reply_to_email && $reply_to_name) {
            $mail->addReplyTo($reply_to_email, $reply_to_name);
        }

        // Conteúdo do E-mail
        $mail->isHTML(true); // Define o formato do e-mail como HTML
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body); // Corpo alternativo para clientes de e-mail que não suportam HTML

        $log_func("Attempting to send email via PHPMailer to: " . $to_email);
        $mail->send(); // Tenta enviar o e-mail
        $log_func("Email sent successfully to: " . $to_email);
        return true;
    } catch (Exception $e) {
        // Captura e loga quaisquer erros do PHPMailer
        $log_func("Email could not be sent. Mailer Error: {$mail->ErrorInfo}. Exception: {$e->getMessage()}");
        return false;
    }
}