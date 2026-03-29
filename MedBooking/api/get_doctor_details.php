<?php
// api/get_doctor_details.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'] ?? null;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

if (!$decodedToken) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token. Please log in again."]);
    exit();
}

$doctorId = filter_input(INPUT_GET, 'doctor_id', FILTER_VALIDATE_INT);

if (!$doctorId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Doctor ID not provided or invalid."]);
    exit();
}

global $pdo;

try {
    // Adicionado 'ud.bank_payment_details' e 'ud.updated_at' à query
    $sql = "SELECT
                ud.doctor_id,
                ud.full_name,
                ud.email,
                ud.phone_number,
                ud.whatsapp_number,
                ud.crm_number,
                ud.specialization,
                ud.sub_specialization,
                ud.education,
                ud.university,
                ud.graduation_year,
                ud.bio,
                ud.consultation_fee,
                ud.website,
                ud.linkedin,
                ud.awards,
                ud.languages, 
                ud.countries_of_practice_json,
                ud.profile_picture_url,
                ud.date_of_birth,
                ud.gender,
                ud.address_street,
                ud.address_number,
                ud.address_complement,
                ud.address_district,
                ud.address_zip_code,
                ud.full_address,
                ud.city_id,
                c.name as city_name,
                ud.state_id,
                s.name as state_name,
                ud.country_id,
                co.name as country_name,
                ud.created_at,
                ud.updated_at,
                ud.certifications,
                ud.bank_payment_details,
                ud.updated_at
            FROM users_doctors ud
            LEFT JOIN cities c ON ud.city_id = c.city_id
            LEFT JOIN states s ON ud.state_id = s.state_id
            LEFT JOIN countries co ON ud.country_id = co.country_id
            WHERE ud.doctor_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$doctorId]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($doctor) {
        $language_ids = json_decode($doctor['languages'] ?? '[]', true);
        if (json_last_error() === JSON_ERROR_NONE && !empty($language_ids)) {
            $language_ids = array_map('intval', $language_ids);
            $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
            $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders)");
            $lang_stmt->execute($language_ids);
            $doctor['languages'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } else {
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("get_doctor_details.php: JSON decode error for languages: " . json_last_error_msg());
            }
            $doctor['languages'] = [];
        }

        $countryIds = json_decode($doctor['countries_of_practice_json'] ?? '[]', true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("get_doctor_details.php: JSON decode error for countries_of_practice_json: " . json_last_error_msg());
            $countryIds = [];
        }
        $doctor['countriesOfPractice'] = [];
        if (!empty($countryIds)) {
            $countryIds = array_map('intval', $countryIds);
            $placeholders = implode(',', array_fill(0, count($countryIds), '?'));
            $countryStmt = $pdo->prepare("SELECT country_id as id, name FROM countries WHERE country_id IN ($placeholders)");
            $countryStmt->execute($countryIds);
            $doctor['countriesOfPractice'] = $countryStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($doctor['countries_of_practice_json']);
        
        $doctor['consultation_fee'] = (float)($doctor['consultation_fee'] ?? 0); 
        $doctor['city_id'] = $doctor['city_id'] !== null ? (int)$doctor['city_id'] : null;
        $doctor['state_id'] = $doctor['state_id'] !== null ? (int)$doctor['state_id'] : null;
        $doctor['country_id'] = $doctor['country_id'] !== null ? (int)$doctor['country_id'] : null;

        echo json_encode(["success" => true, "doctor" => $doctor]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Doctor not found."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error in get_doctor_details.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Internal server error while fetching doctor details. Details: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Unexpected error in get_doctor_details.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Unexpected server error while fetching doctor details. Details: " . $e->getMessage()]);
}
?>
