<?php
// /api/send_report.php


require_once 'config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- 1. Authenticate User & Check Payment Status ---
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

$user_id = null;
$user = null;
try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
    $user_id = $decoded->data->id;

    $stmt = $pdo->prepare("SELECT has_paid, full_name, email FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['error' => 'User not found.'], 404);
    }
    if (!$user['has_paid']) {
        json_response(['error' => 'This is a premium feature. Payment is required.'], 403);
    }
} catch (Exception $e) {
    json_response(['error' => 'Invalid authentication token.'], 401);
}

// --- 2. Get POST data and Validate ---
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['doctorName']) || !isset($data['doctorEmail']) || !filter_var($data['doctorEmail'], FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Invalid input. Doctor name and valid email are required.'], 400);
}

$doctorName = htmlspecialchars($data['doctorName']);
$doctorEmail = $data['doctorEmail'];
$messageToDoctor = isset($data['message']) && !empty($data['message']) ? htmlspecialchars($data['message']) : 'Please find the patient\'s report linked below for your review.';

// --- 3. Generate a Secure, Unique Token ---
$token = bin2hex(random_bytes(32));
$expires_at = date('Y-m-d H:i:s', strtotime('+7 days')); // Link is valid for 7 days

// --- 4. Store the Token in the Database ---
try {
    $stmt = $pdo->prepare(
        "INSERT INTO shared_reports (user_id, token, expires_at) VALUES (?, ?, ?)"
    );
    $stmt->execute([$user_id, $token, $expires_at]);
} catch (PDOException $e) {
    log_error("Failed to store share token: " . $e->getMessage(), __FILE__, $e->getLine());
    json_response(['error' => 'Could not create a secure share link.'], 500);
}

// --- 5. Construct the Share Link ---
$shareLink = get_env_var('DOMAIN_URL') . '/report/shared/' . $token;

// --- 6. Send Email with the Link ---
$mail = new PHPMailer(true);
try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = get_env_var('SMTP_HOST');
    $mail->SMTPAuth   = true;
    $mail->Username   = get_env_var('SMTP_USER');
    $mail->Password   = get_env_var('SMTP_PASS');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = (int)get_env_var('SMTP_PORT');

    // Recipients
    $mail->setFrom(get_env_var('SMTP_FROM_EMAIL'), get_env_var('SMTP_FROM_NAME'));
    $mail->addAddress($doctorEmail, $doctorName);
    $mail->addReplyTo($user['email'], $user['full_name']);

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Nutrigenomic Report for ' . $user['full_name'];
    $mail->Body    = "Dear Dr. {$doctorName},<br><br>" .
                     "Your patient, <b>{$user['full_name']}</b>, has shared their NutraGenius report with you.<br>" .
                     "You can reply directly to the patient at: <b>{$user['email']}</b><br><br>" .
                     "<b>Patient's message:</b><br><i>\"" . nl2br($messageToDoctor) . "\"</i><br><br>" .
                     "You can view the secure, web-based report by clicking the link below. The link will be active for 7 days.<br><br>" .
                     "<a href='{$shareLink}' style='background-color: #f59e0b; color: #1e3a8a; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;'>View Secure Report</a><br><br>" .
                     "If the button does not work, please copy and paste this URL into your browser:<br>{$shareLink}<br><br>" .
                     "Best regards,<br>The NutraGenius Platform";
    
    $mail->send();
    json_response(['message' => 'A link to the report has been sent successfully to ' . $doctorEmail]);

} catch (Exception $e) {
    log_error("PHPMailer error while sending report link: " . $mail->ErrorInfo, __FILE__, __LINE__);
    json_response(['error' => 'Failed to send the email.'], 500);
}

