<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

class Mailer
{
    private static function make(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = Env::require('MAIL_HOST');
        $mail->SMTPAuth   = true;
        $mail->Username   = Env::require('MAIL_USERNAME');
        $mail->Password   = Env::require('MAIL_PASSWORD');
        $mail->SMTPSecure = Env::get('MAIL_ENCRYPTION', 'tls') === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int)Env::get('MAIL_PORT', 587);
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(
            Env::require('MAIL_FROM_ADDRESS'),
            Env::get('MAIL_FROM_NAME', 'SeqNode-OS')
        );
        return $mail;
    }

    /** Shared professional email wrapper */
    private static function wrapTemplate(string $title, string $content, string $accentColor = '#6366f1'): string
    {
        $appUrl = Env::get('APP_URL', 'https://seqnode.onnetweb.com');
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,{$accentColor} 100%);
                        border-radius:14px 14px 0 0;padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:10px;">&#x1F9EC;</div>
              <div style="color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">
                SeqNode-OS
              </div>
              <div style="color:rgba(255,255,255,0.65);font-size:13px;letter-spacing:0.5px;">
                Bioinformatics Pipeline Platform
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1e293b;padding:40px 40px 32px;border-left:1px solid #334155;border-right:1px solid #334155;">
              {$content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 14px 14px;
                        padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                This email was sent by <strong style="color:#94a3b8;">SeqNode-OS</strong>.
                If you did not make this request, you can safely ignore it.
              </p>
              <p style="margin:0;color:#475569;font-size:11px;">
                &copy; SeqNode-OS &mdash;
                <a href="{$appUrl}" style="color:#6366f1;text-decoration:none;">seqnode.onnetweb.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /** Send email verification link. */
    public static function sendVerification(string $toEmail, string $name, string $token): void
    {
        $url     = Env::get('APP_URL') . '/verify-email?token=' . $token;
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<h1 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;font-weight:700;">Verify Your Email</h1>
<p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">Welcome to SeqNode-OS, <strong style="color:#e2e8f0;">{$safeName}</strong>!</p>

<p style="margin:0 0 28px;color:#cbd5e1;font-size:15px;line-height:1.65;">
  Thank you for registering. Click the button below to verify your email address and
  activate your account. This link expires in <strong style="color:#e2e8f0;">24 hours</strong>.
</p>

<div style="text-align:center;margin:36px 0;">
  <a href="{$url}"
     style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);
            color:#fff;padding:14px 36px;border-radius:8px;font-size:16px;
            font-weight:700;text-decoration:none;letter-spacing:0.2px;
            box-shadow:0 4px 14px rgba(99,102,241,.4);">
    &#x2713;&nbsp; Verify Email Address
  </a>
</div>

<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px 20px;margin-top:24px;">
  <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">
    Or copy this link into your browser
  </p>
  <p style="margin:0;color:#6366f1;font-size:12px;word-break:break-all;font-family:monospace;">
    {$url}
  </p>
</div>
HTML;

        try {
            $mail = self::make();
            $mail->addAddress($toEmail, $name);
            $mail->Subject = '[SeqNode-OS] Verify your email address';
            $mail->isHTML(true);
            $mail->Body    = self::wrapTemplate('Verify Your Email — SeqNode-OS', $content, '#6366f1');
            $mail->AltBody = "Welcome to SeqNode-OS! Verify your email address by visiting:\n\n{$url}\n\nThis link expires in 24 hours.";
            $mail->send();
        } catch (MailException $e) {
            error_log("Mailer::sendVerification failed for {$toEmail}: " . $e->getMessage());
            throw new RuntimeException('Failed to send verification email.');
        }
    }

    /** Send password reset link. */
    public static function sendPasswordReset(string $toEmail, string $name, string $token): void
    {
        $url      = Env::get('APP_URL') . '/reset-password?token=' . $token;
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<h1 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;font-weight:700;">Password Reset Request</h1>
<p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">Hello, <strong style="color:#e2e8f0;">{$safeName}</strong></p>

<p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.65;">
  We received a request to reset the password for your SeqNode-OS account.
  Click the button below to set a new password. This link expires in
  <strong style="color:#e2e8f0;">1 hour</strong>.
</p>

<div style="text-align:center;margin:36px 0;">
  <a href="{$url}"
     style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f87171);
            color:#fff;padding:14px 36px;border-radius:8px;font-size:16px;
            font-weight:700;text-decoration:none;letter-spacing:0.2px;
            box-shadow:0 4px 14px rgba(239,68,68,.4);">
    &#x1F511;&nbsp; Reset My Password
  </a>
</div>

<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px 20px;margin-top:24px;">
  <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">
    Or copy this link into your browser
  </p>
  <p style="margin:0;color:#ef4444;font-size:12px;word-break:break-all;font-family:monospace;">
    {$url}
  </p>
</div>

<div style="background:#1c1917;border:1px solid #44403c;border-left:4px solid #f59e0b;
            border-radius:0 6px 6px 0;padding:14px 18px;margin-top:24px;">
  <p style="margin:0;color:#fbbf24;font-size:13px;">
    &#x26A0;&nbsp; <strong>Didn't request this?</strong>
    If you did not request a password reset, please ignore this email.
    Your password will not be changed.
  </p>
</div>
HTML;

        try {
            $mail = self::make();
            $mail->addAddress($toEmail, $name);
            $mail->Subject = '[SeqNode-OS] Password Reset Request';
            $mail->isHTML(true);
            $mail->Body    = self::wrapTemplate('Password Reset — SeqNode-OS', $content, '#ef4444');
            $mail->AltBody = "Reset your SeqNode-OS password by visiting:\n\n{$url}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.";
            $mail->send();
        } catch (MailException $e) {
            error_log("Mailer::sendPasswordReset failed for {$toEmail}: " . $e->getMessage());
            throw new RuntimeException('Failed to send password reset email.');
        }
    }

    /** Send welcome email after account verification. */
    public static function sendWelcome(string $toEmail, string $name): void
    {
        $appUrl   = Env::get('APP_URL', 'https://seqnode.onnetweb.com');
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<h1 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;font-weight:700;">&#x1F389; Account Activated!</h1>
<p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">Hello, <strong style="color:#e2e8f0;">{$safeName}</strong>!</p>

<p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.65;">
  Your <strong style="color:#e2e8f0;">SeqNode-OS</strong> account has been successfully verified.
  You now have full access to the bioinformatics pipeline platform.
</p>

<!-- Feature highlights -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
  <tr>
    <td style="padding:10px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;margin-bottom:8px;">
      <span style="font-size:20px;">&#x1F9EC;</span>
      <strong style="color:#e2e8f0;font-size:14px;margin-left:8px;">Visual Pipeline Builder</strong>
      <p style="margin:4px 0 0 28px;color:#94a3b8;font-size:13px;">Drag-and-drop bioinformatics tools onto the canvas</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:10px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;">
      <span style="font-size:20px;">&#x26A1;</span>
      <strong style="color:#e2e8f0;font-size:14px;margin-left:8px;">Real-time Execution</strong>
      <p style="margin:4px 0 0 28px;color:#94a3b8;font-size:13px;">Live logs and node status via WebSocket</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:10px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;">
      <span style="font-size:20px;">&#x1F916;</span>
      <strong style="color:#e2e8f0;font-size:14px;margin-left:8px;">Local Agent</strong>
      <p style="margin:4px 0 0 28px;color:#94a3b8;font-size:13px;">Run pipelines on your own machine with the SeqNode Agent</p>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:36px 0 8px;">
  <a href="{$appUrl}"
     style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);
            color:#fff;padding:14px 40px;border-radius:8px;font-size:16px;
            font-weight:700;text-decoration:none;letter-spacing:0.2px;
            box-shadow:0 4px 14px rgba(16,185,129,.4);">
    &#x1F680;&nbsp; Open SeqNode-OS
  </a>
</div>
HTML;

        try {
            $mail = self::make();
            $mail->addAddress($toEmail, $name);
            $mail->Subject = '[SeqNode-OS] Welcome — Your account is ready!';
            $mail->isHTML(true);
            $mail->Body    = self::wrapTemplate('Welcome to SeqNode-OS', $content, '#059669');
            $mail->AltBody = "Welcome to SeqNode-OS, {$name}!\n\nYour account is verified and ready.\n\nOpen the platform: {$appUrl}";
            $mail->send();
        } catch (MailException $e) {
            error_log("Mailer::sendWelcome failed for {$toEmail}: " . $e->getMessage());
            // Welcome email is non-critical — do not throw
        }
    }
}
