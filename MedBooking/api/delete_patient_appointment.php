<?php
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/send_email.php';
require_once __DIR__ . '/email_templates.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $_ENV['JWT_SECRET_KEY']);
    if (!$decodedToken || $decodedToken['user_type'] !== 'patient') {
        throw new Exception("Access denied. For patients only.", 403);
    }
    $patientId = $decodedToken['user_id'];

    $data = json_decode(file_get_contents("php://input"), true);
    $appointmentId = $data['appointment_id'] ?? null;

    if (!$appointmentId) {
        throw new Exception("Appointment ID is required.", 400);
    }

    global $pdo;
    $pdo->beginTransaction();

    $stmt_select = $pdo->prepare("SELECT a.doctor_id, a.patient_id, a.appointment_date, a.appointment_time, a.google_calendar_event_id, p.full_name as patient_name, p.email as patient_email, d.full_name as doctor_name, d.email as doctor_email FROM appointments a JOIN users_patients p ON a.patient_id = p.patient_id JOIN users_doctors d ON a.doctor_id = d.doctor_id WHERE a.appointment_id = ? AND a.patient_id = ?");
    $stmt_select->execute([$appointmentId, $patientId]);
    $appointment = $stmt_select->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        throw new Exception("Appointment not found or does not belong to this patient.", 404);
    }

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
                    error_log("Google Calendar event deleted (by patient delete) for appointment_id: $appointmentId");
                }
            } catch (Exception $google_e) {
                // --- INÍCIO DA MELHORIA: DETEÇÃO DE TOKEN INVÁLIDO ---
                if (strpos($google_e->getMessage(), 'invalid_grant') !== false) {
                    error_log("Invalid Google token (invalid_grant) for doctor_id: {$appointment['doctor_id']} during event deletion. Clearing token from DB.");
                    // O token é inválido (zombie). Limpá-lo da DB.
                    $stmt_clear_token = $pdo->prepare("UPDATE users_doctors SET google_refresh_token = NULL, google_access_token = NULL, google_access_token_expiry = NULL WHERE doctor_id = ?");
                    $stmt_clear_token->execute([$appointment['doctor_id']]);
                } else {
                    // Outro erro da Google
                    error_log("Failed to delete Google Calendar event (ID: {$appointment['google_calendar_event_id']}) during patient deletion: " . $google_e->getMessage());
                }
                // --- FIM DA MELHORIA ---
            }
        }
    }

    $stmt = $pdo->prepare("DELETE FROM appointments WHERE appointment_id = ? AND patient_id = ?");
    $stmt->execute([$appointmentId, $patientId]);

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
                "Patient" // Deletado pelo paciente
            );
            
            $altBodyText = "Appointment Canceled: The appointment between " . $appointment['patient_name'] . " and Dr. " . $appointment['doctor_name'] . " on " . $appointmentDateFormatted . " at " . $appointmentTimeFormatted . " has been canceled by the Patient.";
            
            sendEmail($appointment['patient_email'], $appointment['patient_name'], $emailSubject, $emailHtmlBody, $altBodyText);
            sendEmail($appointment['doctor_email'], $appointment['doctor_name'], $emailSubject, $emailHtmlBody, $altBodyText);
        
        } catch (Exception $email_e) {
            error_log("Failed to send deletion email for appointment (ID: $appointmentId): " . $email_e->getMessage());
        }
        
        $pdo->commit();
        sendJsonResponse(["success" => true, "message" => "Appointment record deleted successfully."]);
    } else {
        throw new Exception("Appointment not found or does not belong to this patient.", 404);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("delete_patient_appointment.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>