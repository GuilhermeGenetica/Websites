<?php
// /api/send_email.php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

/**
 * Sends an email using PHPMailer with settings from .env.
 *
 * @param string $toEmail Recipient's email address.
 * @param string $toName Recipient's name.
 * @param string $subject The email subject.
 * @param string $body The HTML email body.
 * @param string $altBody The plain-text alternative body.
 * @param string|null $replyToEmail (Optional) Email to set for 'Reply-To'.
 * @param string $replyToName (Optional) Name to set for 'Reply-To'.
 * @return array ['success' => bool, 'message' => string]
 */
function sendEmail($toEmail, $toName, $subject, $body, $altBody = '', $replyToEmail = null, $replyToName = '') {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = $_ENV['MAIL_HOST'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['MAIL_USERNAME'];
        $mail->Password   = $_ENV['MAIL_PASSWORD'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = (int)$_ENV['MAIL_PORT'];
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom($_ENV['MAIL_USERNAME'], $_ENV['MAIL_FROM_NAME']);

        if ($replyToEmail) {
            $mail->addReplyTo($replyToEmail, $replyToName);
        } else {
            $mail->addReplyTo($_ENV['MAIL_USERNAME'], $_ENV['MAIL_FROM_NAME']);
        }

        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = $altBody;

        $mail->send();
        return ["success" => true, "message" => "Email sent successfully to $toEmail."];
    } catch (Exception $e) {
        error_log("Failed to send email to $toEmail: {$mail->ErrorInfo} - Exception: {$e->getMessage()}");
        return ["success" => false, "message" => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"];
    }
}
