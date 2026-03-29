<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
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
    $sql = "SELECT
                ud.doctor_id,
                ud.full_name,
                ud.email,
                ud.crm_number,
                ud.clinic_address,
                ud.clinic_phone,
                ud.whatsapp_number,
                ud.specialization,
                ud.sub_specialization,
                ud.education,
                ud.university,
                ud.graduation_year,
                ud.bio,
                ud.consultation_fee,
                ud.fee_currency,
                ud.website,
                ud.linkedin,
                ud.awards,
                ud.languages, 
                ud.countries_of_practice_json,
                ud.profile_picture_url,
                ud.certifications,
                ud.stripe_connect_id,
                ud.stripe_onboarding_complete,
                ud.updated_at,
                c.name as city_name,
                s.name as state_name,
                co.name as country_name
            FROM users_doctors ud
            LEFT JOIN cities c ON ud.city_id = c.city_id
            LEFT JOIN states s ON ud.state_id = s.state_id
            LEFT JOIN countries co ON ud.country_id = co.country_id
            WHERE ud.doctor_id = ? AND ud.is_active = 1 AND ud.is_approved = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$doctorId]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($doctor) {
        $language_ids = json_decode($doctor['languages'] ?? '[]', true);
        if (json_last_error() === JSON_ERROR_NONE && !empty($language_ids)) {
            $language_ids = array_map('intval', $language_ids);
            $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
            $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders) ORDER BY name ASC");
            $lang_stmt->execute($language_ids);
            $doctor['languages'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } else {
            $doctor['languages'] = [];
        }

        $countryIds = json_decode($doctor['countries_of_practice_json'] ?? '[]', true);
        if (json_last_error() === JSON_ERROR_NONE && !empty($countryIds)) {
            $countryIds = array_map('intval', $countryIds);
            $placeholders = implode(',', array_fill(0, count($countryIds), '?'));
            $countryStmt = $pdo->prepare("SELECT name FROM countries WHERE country_id IN ($placeholders) ORDER BY name ASC");
            $countryStmt->execute($countryIds);
            $doctor['countries_of_practice'] = $countryStmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } else {
            $doctor['countries_of_practice'] = [];
        }
        unset($doctor['countries_of_practice_json']);
        
        $doctor['stripe_onboarding_complete'] = (bool)$doctor['stripe_onboarding_complete'];
        
        echo json_encode(["success" => true, "doctor" => $doctor]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Doctor profile not found or is not active."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error in get_public_doctor_profile.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Internal server error while fetching public doctor profile. Details: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Unexpected error in get_public_doctor_profile.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Unexpected server error while fetching public doctor profile. Details: " . $e->getMessage()]);
}
?>