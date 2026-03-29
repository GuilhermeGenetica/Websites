<?php
// api/get_patient_details_for_doctor.php

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
    if (!$decodedToken || $decodedToken['user_type'] !== 'doctor') {
        throw new Exception("Access denied. For doctors only.", 403);
    }
    $doctorId = $decodedToken['user_id'];
    $patientId = filter_input(INPUT_GET, 'patient_id', FILTER_VALIDATE_INT);

    if (!$patientId) {
        throw new Exception("Patient ID is required.", 400);
    }

    $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND patient_id = ?");
    $stmt_check->execute([$doctorId, $patientId]);
    if ($stmt_check->fetchColumn() == 0) {
        throw new Exception("Unauthorized access to this patient profile.", 403);
    }

    // SOLUTION: Added p.updated_at to the SELECT statement
    $stmt = $pdo->prepare("
        SELECT 
            p.full_name, p.email, p.phone_number, p.whatsapp_number, p.date_of_birth, p.gender,
            p.nationality, p.emergency_contact_name, p.emergency_contact_phone,
            p.medical_history, p.allergies, p.medications, p.profile_picture_url,
            p.updated_at,
            c.name as city_name, s.name as state_name, co.name as country_name
        FROM users_patients p
        LEFT JOIN cities c ON p.city_id = c.city_id
        LEFT JOIN states s ON p.state_id = s.state_id
        LEFT JOIN countries co ON p.country_id = co.country_id
        WHERE p.patient_id = ?
    ");
    $stmt->execute([$patientId]);
    $patientProfile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($patientProfile) {
        sendJsonResponse(["success" => true, "profile" => $patientProfile]);
    } else {
        throw new Exception("Patient profile not found.", 404);
    }

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("get_patient_details_for_doctor.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>
