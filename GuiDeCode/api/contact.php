<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/middleware.php';

cors();

try {
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception("Database connection failed.");
    }
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection error.", "error" => $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['action'] ?? 'send';
$data = json_decode(file_get_contents("php://input"));

switch ($action) {
    case 'send':
        if ($method === 'POST') {
            try {
                // --- VALIDAÇÃO DOS DADOS ---
                $name    = trim($data->name ?? '');
                $email   = trim($data->email ?? '');
                $subject = trim($data->subject ?? '');
                $message = trim($data->message ?? '');

                if (empty($name) || empty($email) || empty($message)) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Name, email and message are required."]);
                    exit();
                }

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Invalid email address."]);
                    exit();
                }

                // --- SALVAR NO BANCO DE DADOS ---
                // Combina subject + message numa coluna só, pois a tabela não tem coluna 'subject'
                $dbMessage = empty($subject)
                    ? $message
                    : "Assunto: {$subject}\n\nMensagem:\n{$message}";

                $stmt = $conn->prepare(
                    "INSERT INTO contact_messages (full_name, email, message, created_at) VALUES (?, ?, ?, NOW())"
                );
                $stmt->execute([$name, $email, $dbMessage]);

                // --- CONFIGURAÇÕES DE EMAIL ---
                $smtpUser     = env('SMTP_USER');
                $smtpPass     = env('SMTP_PASS');
                $smtpHost     = env('SMTP_HOST', 'smtp.gmail.com');
                $smtpPort     = (int) env('SMTP_PORT', 465);
                $smtpFromName = env('SMTP_FROM_NAME', 'GuideLines Platform');

                // CORREÇÃO PRINCIPAL: ignora ADMIN_EMAIL se for placeholder ou inválido,
                // e usa o próprio SMTP_USER (remetente autenticado) como destino seguro.
                $adminEmail = env('ADMIN_EMAIL', '');
                if (
                    empty($adminEmail) ||
                    strpos($adminEmail, 'admin@admin') !== false ||
                    !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)
                ) {
                    $adminEmail = $smtpUser;
                }

                $emailSent = false;
                $mailError = '';

                // --- BUSCA DO AUTOLOAD DO PHPMAILER ---
                $possibleAutoloadPaths = [
                    __DIR__ . '/vendor/autoload.php',
                    dirname(__DIR__) . '/vendor/autoload.php',
                    $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
                ];

                $autoloadFound = false;
                foreach ($possibleAutoloadPaths as $path) {
                    if (file_exists($path)) {
                        require_once $path;
                        $autoloadFound = true;
                        break;
                    }
                }

                // --- ENVIO VIA PHPMAILER ---
                if ($autoloadFound && class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
                    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                    try {
                        $mail->isSMTP();
                        $mail->Host       = $smtpHost;
                        $mail->SMTPAuth   = true;
                        $mail->Username   = $smtpUser;
                        $mail->Password   = $smtpPass;
                        $mail->SMTPSecure = ($smtpPort == 465)
                            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
                            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                        $mail->Port       = $smtpPort;
                        $mail->CharSet    = 'UTF-8';

                        // setFrom usa o email autenticado para não ser bloqueado pelo Gmail
                        $mail->setFrom($smtpUser, $smtpFromName);
                        $mail->addAddress($adminEmail);
                        $mail->addReplyTo($email, $name); // permite responder diretamente ao visitante

                        $mail->isHTML(true);
                        $mail->Subject = "[GuideLines Contact] " . $subject;
                        $mail->Body    = "
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                                <h2 style='color: #d4a547; margin-top: 0;'>New Contact Message</h2>
                                <p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
                                <p><strong>Email:</strong> <a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></p>
                                <p><strong>Subject:</strong> " . htmlspecialchars($subject) . "</p>
                                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                                <p><strong>Message:</strong></p>
                                <div style='background: #f9f9f9; padding: 16px; border-left: 4px solid #d4a547; border-radius: 4px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;'>" . nl2br(htmlspecialchars($message)) . "</div>
                                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                                <p style='font-size: 12px; color: #999; margin-bottom: 0;'>Enviado via formulário de contato — guilherme.onnetweb.com</p>
                            </div>
                        ";
                        $mail->AltBody =
                            "Name: {$name}\n" .
                            "Email: {$email}\n" .
                            "Subject: {$subject}\n\n" .
                            "Message:\n{$message}";

                        $mail->send();
                        $emailSent = true;

                    } catch (\Exception $e) {
                        $mailError = $mail->ErrorInfo;
                    }
                }

                // --- TRATAMENTO DE FALHA: SEM FALSOS POSITIVOS ---
                // Remove o mail() nativo silencioso. Se o PHPMailer falhar ou não
                // for encontrado, o erro real é propagado para o frontend.
                if (!$emailSent) {
                    if (!$autoloadFound || !class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
                        throw new \Exception(
                            "PHPMailer não encontrado. Execute 'composer require phpmailer/phpmailer' " .
                            "dentro da pasta /api ou na raiz do projeto."
                        );
                    }

                    throw new \Exception("Falha no envio SMTP: " . $mailError);
                }

                echo json_encode([
                    "success" => true,
                    "message" => "Message sent successfully! We will get back to you soon."
                ]);

            } catch (\Throwable $e) {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "Internal server error.",
                    "error"   => $e->getMessage()
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
        }
        break;

    case 'getMessages':
        if ($method === 'GET') {
            try {
                $stmt = $conn->prepare(
                    "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100"
                );
                $stmt->execute();
                $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($messages);
            } catch (\Throwable $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        break;

    case 'deleteMessage':
        if ($method === 'POST' && isset($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM contact_messages WHERE id = ?");
                $stmt->execute([$data->id]);
                echo json_encode(["success" => true]);
            } catch (\Throwable $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => $e->getMessage()]);
            }
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid action: " . $action]);
        break;
}
?>