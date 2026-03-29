<?php
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/send_email.php';
require_once __DIR__ . '/email_templates.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    sendJsonResponse(["success" => false, "message" => "Authentication token missing."], 401);
    exit();
}
$token = $matches[1];
$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken) {
    sendJsonResponse(["success" => false, "message" => "Unauthorized access."], 403);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$appointmentId = $data['appointment_id'] ?? null;

if (empty($appointmentId)) {
    sendJsonResponse(["success" => false, "message" => "Appointment ID is required."], 400);
    exit();
}

try {
    global $pdo;
    
    $pdo->beginTransaction();

    $stmt_select = $pdo->prepare("SELECT a.doctor_id, a.patient_id, a.appointment_date, a.appointment_time, a.google_calendar_event_id, p.full_name as patient_name, p.email as patient_email, d.full_name as doctor_name, d.email as doctor_email FROM appointments a JOIN users_patients p ON a.patient_id = p.patient_id JOIN users_doctors d ON a.doctor_id = d.doctor_id WHERE a.appointment_id = ?");
    $stmt_select->execute([$appointmentId]);
    $appointment = $stmt_select->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Appointment not found or data is incomplete.");
    }

    $cancelledBy = ($decodedToken['user_type'] === 'doctor') ? 'Doctor' : 'Patient';

    if ($appointment && !empty($appointment['google_calendar_event_id'])) {
        $stmt_doctor = $pdo->prepare("SELECT google_refresh_token, google_access_token, google_access_token_expiry FROM users_doctors WHERE doctor_id = ?");
        $stmt_doctor->execute([$appointment['doctor_id']]);
        $doctor = $stmt_doctor->fetch(PDO::FETCH_ASSOC);

        if ($doctor && !empty($doctor['google_refresh_token'])) {
            try {
                $client = new Google_Client();
                $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
                $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
                
                // --- INÍCIO DA MELHORIA: ADICIONAR O REDIRECT_URI ---
                // Necessário para o fetchAccessTokenWithRefreshToken
                $client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);
                // --- FIM DA MELHORIA ---

                $client->setRefreshToken($doctor['google_refresh_token']);
                
                if (empty($doctor['google_access_token']) || (isset($doctor['google_access_token_expiry']) && strtotime($doctor['google_access_token_expiry']) < time())) {
                    $newAccessTokenData = $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
                    $client->setAccessToken($newAccessTokenData);
                } else {
                    $accessToken = json_decode($doctor['google_access_token'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $client->setAccessToken($accessToken);
                    }
                }

                if ($client->getAccessToken()) {
                    $calendarService = new Google_Service_Calendar($client);
                    $calendarService->events->delete('primary', $appointment['google_calendar_event_id']);
                    error_log("Google Calendar event deleted (canceled) for appointment_id: $appointmentId");
                }
            } catch (Exception $google_e) {
                // --- INÍCIO DA MELHORIA: DETEÇÃO DE TOKEN INVÁLIDO ---
                if (strpos($google_e->getMessage(), 'invalid_grant') !== false) {
                    error_log("Invalid Google token (invalid_grant) for doctor_id: {$appointment['doctor_id']} during event cancellation. Clearing token from DB.");
                    // O token é inválido (zombie). Limpá-lo da DB.
                    $stmt_clear_token = $pdo->prepare("UPDATE users_doctors SET google_refresh_token = NULL, google_access_token = NULL, google_access_token_expiry = NULL WHERE doctor_id = ?");
                    $stmt_clear_token->execute([$appointment['doctor_id']]);
                } else {
                    // Outro erro da Google
                    error_log("Failed to delete Google Calendar event (ID: {$appointment['google_calendar_event_id']}) during cancellation: " . $google_e->getMessage());
                }
                // --- FIM DA MELHORIA ---
            }
        }
    }

    $sql = "UPDATE appointments 
            SET 
                status = 'cancelled', 
                payment_status = 'cancelled',
                google_meet_link = NULL, 
                google_calendar_event_id = NULL 
            WHERE 
                appointment_id = ?";
                
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$appointmentId]);

    if ($stmt->rowCount() > 0) {
        
        try {
            $appointmentDateFormatted = (new DateTime($appointment['appointment_date']))->format('d/m/Y');
            $appointmentTimeFormatted = (new DateTime($appointment['appointment_time']))->format('H:i');
            $emailSubject = "Appointment Cancellation - MedBooking: Dr. " . $appointment['doctor_name'] . " & " . $appointment['patient_name'];
            
            $emailHtmlBody = getAppointmentCancellationEmailHtml(
                $appointment['patient_name'],
                $appointment['doctor_name'],
                $appointmentDateFormatted,
                $appointmentTimeFormatted,
                $cancelledBy
            );
            
            $altBodyText = "Appointment Canceled: The appointment between " . $appointment['patient_name'] . " and Dr. " . $appointment['doctor_name'] . " on " . $appointmentDateFormatted . " at " . $appointmentTimeFormatted . " has been canceled by the " . $cancelledBy . ".";
            
            sendEmail($appointment['patient_email'], $appointment['patient_name'], $emailSubject, $emailHtmlBody, $altBodyText);
            sendEmail($appointment['doctor_email'], $appointment['doctor_name'], $emailSubject, $emailHtmlBody, $altBodyText);
        
        } catch (Exception $email_e) {
            error_log("Failed to send cancellation email for appointment (ID: $appointmentId): " . $email_e->getMessage());
        }

        $pdo->commit();
        sendJsonResponse(["success" => true, "message" => "Appointment canceled successfully."]);
    } else {
        throw new Exception("Appointment not found or no changes were necessary.");
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Error canceling appointment (ID: $appointmentId): " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error processing cancellation: " . $e->getMessage()], 500);
}
?>