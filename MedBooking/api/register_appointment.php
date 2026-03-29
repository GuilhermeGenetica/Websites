<?php
require_once 'config.php';

// Suprimir a saída de erros HTML
ini_set('display_errors', 0);

require_once 'utils.php';
require_once 'send_email.php';
require_once 'email_templates.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access. Token missing."]);
    exit();
}

$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken || !isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'patient') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Only patients can register appointments."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
if ($data === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid data."]);
    exit();
}

global $pdo;

$patientId = $decodedToken['user_id'] ?? null;
$doctorId = $data['doctor_id'] ?? null;
$appointmentDate = $data['appointment_date'] ?? null;
$appointmentTimeInput = $data['appointment_time'] ?? null; // e.g., "09:30"
$consultationFee = $data['consultation_fee'] ?? null;
$currency = $data['currency'] ?? 'eur';
$stripePaymentIntentId = $data['stripe_payment_intent_id'] ?? null;
$consultationType = $data['consultation_type'] ?? 'online';

if (!$patientId || !$doctorId || !$appointmentDate || !$appointmentTimeInput || !$stripePaymentIntentId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required appointment data."]);
    exit();
}

// --- CORREÇÃO DO FORMATO DA HORA (A CHAVE DO SUCESSO) ---
// Garantir que a hora está no formato HH:mm:ss que a API do Google exige
if (strlen($appointmentTimeInput) == 5) { // Se o formato for HH:mm
    $appointmentTime = $appointmentTimeInput . ':00'; // Adiciona :00
} else {
    $appointmentTime = $appointmentTimeInput; // Assumir que já está correto
}
// --- FIM DA CORREÇÃO ---


// Variáveis para os links
$googleMeetLink = null;
$googleEventId = null;
$jitsiMeetLink = null; // Re-adicionado
$linkForEmail = null; 

try {
    // --- Lógica baseada no test_google_meet.php (que funciona) ---
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT full_name, email FROM users_patients WHERE patient_id = ?");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT full_name, email, whatsapp_number, google_refresh_token FROM users_doctors WHERE doctor_id = ?");
    $stmt->execute([$doctorId]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient || !$doctor) {
        throw new Exception("Patient or doctor not found.");
    }

    // --- AMPLIAÇÃO: Adicionar Jitsi ---
    if ($consultationType === 'online') {
        $roomName = 'MedBooking-Appt-Temp-' . bin2hex(random_bytes(8));
        $jitsiMeetLink = 'https://meet.jit.si/' . $roomName;
    }
    $linkForEmail = $jitsiMeetLink; // Jitsi é o fallback
    // --- Fim da Ampliação Jitsi ---

    // INSERT (Lógica "dummy" do test.php, agora com Jitsi)
    $sql = "INSERT INTO appointments (
                doctor_id, patient_id, appointment_date, appointment_time, status, 
                consultation_type, consultation_fee, payment_status, stripe_payment_id,
                jitsi_meet_link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $doctorId,
        $patientId,
        $appointmentDate,
        $appointmentTime, // Usar a hora formatada (HH:mm:ss)
        'confirmed',
        $consultationType,
        $consultationFee,
        'paid',
        $stripePaymentIntentId,
        $jitsiMeetLink
    ]);

    $appointmentId = $pdo->lastInsertId();

    // --- AMPLIAÇÃO: Atualizar Jitsi link com o ID final ---
    if ($jitsiMeetLink) {
        $finalRoomName = 'MedBooking-Appt-' . $appointmentId . '-' . bin2hex(random_bytes(8));
        $jitsiMeetLink = 'https://meet.jit.si/' . $finalRoomName;
        $stmtUpdateJitsi = $pdo->prepare("UPDATE appointments SET jitsi_meet_link = ? WHERE appointment_id = ?");
        $stmtUpdateJitsi->execute([$jitsiMeetLink, $appointmentId]);
        $linkForEmail = $jitsiMeetLink; // Atualizar o link de email
    }
    // --- Fim da Ampliação Jitsi ---


    // --- Bloco Google Meet (Lógica do test_google_meet.php) ---
    if ($consultationType === 'online' && !empty($doctor['google_refresh_token'])) {
        try {
            
            $googleClient = new Google_Client();
            $googleClient->setClientId($_ENV['GOOGLE_CLIENT_ID']);
            $googleClient->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
            $googleClient->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']); 
            $googleClient->setAccessType('offline');
            
            $newAccessToken = $googleClient->fetchAccessTokenWithRefreshToken($doctor['google_refresh_token']);

            if (isset($newAccessToken['error'])) {
                throw new Exception("Failed to refresh Google access token: " . ($newAccessToken['error_description'] ?? 'Unknown error'));
            }

            if (isset($newAccessToken['access_token'])) {
                $googleClient->setAccessToken($newAccessToken);
            } else {
                 throw new Exception("Failed to refresh Google access token (access_token not found).");
            }

            $calendarService = new Google_Service_Calendar($googleClient);
            
            // Lógica de Attendees exata do test_google_meet.php (APENAS O MÉDICO, SEM responseStatus)
            $attendees = [];
            if (!empty($doctor['email'])) {
                $attendees[] = ['email' => $doctor['email']];
            }

            $event = new Google_Service_Calendar_Event([
                'summary' => 'MedBooking Consultation: Dr. ' . $doctor['full_name'] . ' & ' . $patient['full_name'],
                'description' => 'Online medical consultation scheduled via MedBooking.',
                'start' => [
                    'dateTime' => $appointmentDate . 'T' . $appointmentTime, // Usar a hora formatada
                    'timeZone' => 'UTC',
                ],
                'end' => [
                    'dateTime' => date('Y-m-d\TH:i:s', strtotime($appointmentDate . 'T' . $appointmentTime) + 30 * 60),
                    'timeZone' => 'UTC',
                ],
                'attendees' => $attendees,
                'conferenceData' => [
                    'createRequest' => [
                        'requestId' => 'medbooking-' . $appointmentId,
                        'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                    ],
                ],
            ]);

            $createdEvent = $calendarService->events->insert('primary', $event, ['conferenceDataVersion' => 1]);
            
            $googleMeetLink = $createdEvent->getHangoutLink();
            $googleEventId = $createdEvent->getId();
            $linkForEmail = $googleMeetLink; // Google tem prioridade para o email

        } catch (Throwable $googleError) { 
            error_log("Failed to create Google Calendar event for appointment {$appointmentId}: " . $googleError->getMessage());
            $googleMeetLink = null;
            $googleEventId = null;
            // $linkForEmail continua a ser o Jitsi link (fallback)
        }
    }

    // UPDATE (Lógica do test.php - Adiciona o Google Meet)
    $stmt = $pdo->prepare("UPDATE appointments SET google_meet_link = ?, google_calendar_event_id = ? WHERE appointment_id = ?");
    $stmt->execute([$googleMeetLink, $googleEventId, $appointmentId]);
    
    // Commit (Lógica do test.php)
    $pdo->commit();
    
    // --- Fim da Lógica do Google Meet ---
    
    try {
        $emailBody = getAppointmentConfirmationEmailHtml(
            $patient['full_name'],
            $doctor['full_name'],
            date("m/d/Y", strtotime($appointmentDate)),
            $appointmentTime,
            $consultationType,
            $linkForEmail // Envia o link correto (Google ou Jitsi)
        );
        $subject = "Appointment Confirmation - MedBooking: Dr. {$doctor['full_name']} & {$patient['full_name']}";
        
        sendEmail($patient['email'], $patient['full_name'], $subject, $emailBody);
        sendEmail($doctor['email'], $doctor['full_name'], $subject, $emailBody);

    } catch (Throwable $emailError) { 
        error_log("Failed to send confirmation emails for appointment {$appointmentId}: " . $emailError->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "Appointment registered successfully.",
        "appointment_id" => $appointmentId,
        "google_meet_link" => $googleMeetLink, // (null ou link)
        "jitsi_meet_link" => $jitsiMeetLink // (link)
    ]);

} catch (Throwable $e) { 
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error in register_appointment.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal server error while registering appointment. Details: " . $e->getMessage()
    ]);
}
?>