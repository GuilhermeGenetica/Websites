<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $_ENV['JWT_SECRET_KEY']);
    if (!$decodedToken) {
        throw new Exception("Access denied. Invalid or expired token.", 403);
    }
    $doctorId = $decodedToken['user_id'];

    $selectedDate = filter_input(INPUT_GET, 'date', FILTER_UNSAFE_RAW);
    $startDate = filter_input(INPUT_GET, 'startDate', FILTER_UNSAFE_RAW);
    $endDate = filter_input(INPUT_GET, 'endDate', FILTER_UNSAFE_RAW);

    $sql = "
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.consultation_type,
            a.google_meet_link,
            a.jitsi_meet_link,
            p.patient_id,
            p.full_name AS patient_name
        FROM appointments a
        JOIN users_patients p ON a.patient_id = p.patient_id
        WHERE a.doctor_id = ?
    ";
    
    $params = [$doctorId];

    if ($startDate && $endDate) {
        // Handle date range for reports
        $sql .= " AND a.appointment_date BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
    } elseif ($selectedDate) {
        // Handle single date for calendar view
        $sql .= " AND a.appointment_date = ?";
        $params[] = $selectedDate;
    }

    $sql .= " ORDER BY a.appointment_date ASC, a.appointment_time ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse(["success" => true, "appointments" => $appointments]);

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("get_doctor_appointments.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>