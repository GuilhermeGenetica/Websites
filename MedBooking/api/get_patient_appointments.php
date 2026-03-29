<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed. Use GET."], 405);
    exit();
}

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $_ENV['JWT_SECRET_KEY']);
    if (!$decodedToken || $decodedToken['user_type'] !== 'patient') {
        sendJsonResponse(["success" => false, "message" => "Access denied. For patients only."], 403);
        exit();
    }
    $patientId = $decodedToken['user_id'];

    // *** MODIFICATION START ***
    $stmt = $pdo->prepare("
        SELECT 
            a.appointment_id,
            ud.doctor_id,
            ud.full_name AS doctor_name,
            ud.specialization,
            ud.whatsapp_number,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.consultation_type,
            a.google_meet_link,
            a.jitsi_meet_link
        FROM appointments a
        JOIN users_doctors ud ON a.doctor_id = ud.doctor_id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    ");
    // *** MODIFICATION END ***
    
    $stmt->execute([$patientId]);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse(["success" => true, "appointments" => $appointments]);

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 401;
    error_log("get_patient_appointments.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>