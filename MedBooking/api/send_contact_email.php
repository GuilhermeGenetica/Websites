<?php
// /api/send_contact_email.php
// v2.0 - Added Database Save & Client Confirmation Email

require_once 'config.php'; // Provides $pdo and loads .env
require_once 'utils.php';
// The send_email.php helper is in the root directory
require_once __DIR__ . '/send_email.php'; 

setCorsHeaders();

$adminEmail = $_ENV['MAIL_USERNAME']; // Admin email from .env

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Get data from the form payload
$senderName = htmlspecialchars(trim($data['senderName'] ?? 'Anonymous'));
$senderEmail = filter_var($data['senderEmail'] ?? '', FILTER_VALIDATE_EMAIL);
$subject = htmlspecialchars(trim($data['subject'] ?? 'No Subject'));
$messageBody = htmlspecialchars(trim($data['message'] ?? ''));

if (empty($subject) || empty($messageBody) || !$senderEmail || empty($senderName)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid data: sender's name, email, subject, and message are required."]);
    exit();
}

// --- STEP 1: Save to Database (NEW) ---
// This is the most critical step to ensure no data is lost.
try {
    $stmt = $pdo->prepare(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (:name, :email, :subject, :message)"
    );
    $stmt->execute([
        'name' => $senderName,
        'email' => $senderEmail,
        'subject' => $subject,
        'message' => $messageBody
    ]);
    error_log("send_contact_email.php: Message from $senderEmail saved to DB.");
} catch (PDOException $e) {
    http_response_code(500);
    error_log("send_contact_email.php DB Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Failed to save the message. A server error occurred."]);
    // Stop execution if DB save fails.
    exit();
}

// --- STEP 2: Send Email to Admin (Original Code) ---
// This will now run *after* the DB save is successful.
try {
    $adminSubject = "Contact Message via MedBooking: " . $subject;
    $adminHtmlBody = "
        <html><body>
            <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <h2>$adminSubject</h2>
                <hr>
                <p><strong>From:</strong> $senderName ($senderEmail)</p>
                <p><strong>Original Subject:</strong> $subject</p>
                <p><strong>Message:</strong></p>
                <p>" . nl2br($messageBody) . "</p>
                <hr>
                <p style='font-size: 0.9em; color: #777;'>This message was sent through the MedBooking contact form.</p>
            </div>
        </body></html>
    ";
    $adminAltBody = "Contact Message via MedBooking: $subject\n\nFrom: $senderName ($senderEmail)\n\nMessage:\n$messageBody";
    $adminToName = $_ENV['MAIL_FROM_NAME'] . ' (Administrator)';

    // Call the helper function from send_email.php
    $emailResultAdmin = sendEmail($adminEmail, $adminToName, $adminSubject, $adminHtmlBody, $adminAltBody);

    if (!$emailResultAdmin['success']) {
        // Log the error but do not stop the script, as DB save was successful
        error_log("send_contact_email.php Admin Email Error: " . $emailResultAdmin['message']);
    }
} catch (Exception $e) {
    error_log("send_contact_email.php Admin Email Exception: " . $e->getMessage());
}

// --- STEP 3: Send Confirmation Email to Client (NEW) ---
// This is a "try-and-log" step. It will not fail the request if it errors.
try {
    $clientSubject = "We have received your message: " . $subject;
    $clientHtmlBody = "
        <html><body>
            <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <h2>Hello $senderName,</h2>
                <p>Thank you for contacting MedBooking. We have successfully received your message and will get back to you as soon as possible.</p>
                <p><strong>A copy of your message:</strong></p>
                <blockquote style='border-left: 4px solid #ccc; padding-left: 1em; margin-left: 1em; color: #555;'>
                    <p><strong>Subject:</strong> $subject</p>
                    <p>" . nl2br($messageBody) . "</p>
                </blockquote>
                <hr>
                <p style='font-size: 0.9em; color: #777;'>Best regards,<br>The MedBooking Team</p>
            </div>
        </body></html>
    ";
    $clientAltBody = "Hello $senderName,\n\nThank you for contacting MedBooking. We have successfully received your message.\n\nYour message:\nSubject: $subject\n" . $messageBody;
    
    // Call the helper function again, this time for the user
    $emailResultClient = sendEmail($senderEmail, $senderName, $clientSubject, $clientHtmlBody, $clientAltBody);

    if (!$emailResultClient['success']) {
        // Log the error
        error_log("send_contact_email.php Client Email Error: " . $emailResultClient['message']);
    }
} catch (Exception $e) {
    error_log("send_contact_email.php Client Email Exception: " . $e->getMessage());
}

// --- STEP 4: Send Final Success Response ---
// We send success because the DB save (Step 1) was successful.
echo json_encode(["success" => true, "message" => "Your message has been sent successfully!"]);
?>
