<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? null;
$userType = $data['userType'] ?? null;

if (empty($email) || empty($userType)) {
    sendJsonResponse(["success" => false, "message" => "Email and user type are required."], 400);
    exit();
}

$tableName = $userType === 'patient' ? 'users_patients' : 'users_doctors';
$idField = $userType === 'patient' ? 'patient_id' : 'doctor_id';
$appUrl = $_ENV['APP_URL'];

try {
    $stmt = $pdo->prepare("SELECT $idField, full_name FROM $tableName WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJsonResponse(["success" => true, "message" => "If an account with this email exists, a recovery link has been sent."]);
        exit();
    }

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $expiresAt = new DateTime();
    $expiresAt->add(new DateInterval('PT1H'));
    $expiresAtFormatted = $expiresAt->format('Y-m-d H:i:s');

    $updateStmt = $pdo->prepare(
        "UPDATE $tableName SET reset_token = ?, reset_token_expires_at = ? WHERE $idField = ?"
    );
    $updateStmt->execute([$tokenHash, $expiresAtFormatted, $user[$idField]]);

    $resetLink = $appUrl . "/reset-password?token=$token&type=$userType";

    $mail = new PHPMailer(true);
    
    $mail->isSMTP();
    $mail->Host       = $_ENV['MAIL_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['MAIL_USERNAME'];
    $mail->Password   = $_ENV['MAIL_PASSWORD'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = (int)$_ENV['MAIL_PORT'];
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($_ENV['MAIL_USERNAME'], $_ENV['MAIL_FROM_NAME']);
    $mail->addAddress($email, $user['full_name']);

    $mail->isHTML(true);
    $mail->Subject = 'Password Recovery - MedBooking';
    $mail->Body    = "
        <h1>Password Recovery</h1>
        <p>Hello, {$user['full_name']}.</p>
        <p>We received a request to reset your password on the MedBooking platform. If this was not you, please ignore this email.</p>
        <p>To create a new password, click the link below:</p>
        <p><a href='{$resetLink}'>Reset my password</a></p>
        <p>This link is valid for 1 hour.</p>
        <p>Sincerely,<br>The MedBooking Team</p>
    ";
    $mail->AltBody = "Hello, {$user['full_name']}. To reset your password, copy and paste the following link into your browser: {$resetLink}";

    $mail->send();

    sendJsonResponse(["success" => true, "message" => "If an account with this email exists, a recovery link has been sent."]);

} catch (Exception $e) {
    error_log("Error sending recovery email: " . $mail->ErrorInfo . " | General error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Could not send recovery email. Please try again later."], 500);
}
?>