<?php
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
    error_log("❌ Invalid request method: " . $_SERVER['REQUEST_METHOD']);
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
    error_log("❌ Authentication token missing.");
    exit();
}

$decodedToken = decodeJwtToken($token, $secretKey);

if (!$decodedToken) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token. Please log in again."]);
    error_log("❌ Invalid or expired token.");
    exit();
}

global $pdo;

try {
    $specialty = $_GET['specialty'] ?? null;
    $country_id = filter_input(INPUT_GET, 'country_id', FILTER_VALIDATE_INT);
    $state_id = filter_input(INPUT_GET, 'state_id', FILTER_VALIDATE_INT);
    $city_id = filter_input(INPUT_GET, 'city_id', FILTER_VALIDATE_INT);

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
                ud.certifications
            FROM users_doctors ud
            LEFT JOIN cities c ON ud.city_id = c.city_id
            LEFT JOIN states s ON ud.state_id = s.state_id
            LEFT JOIN countries co ON ud.country_id = co.country_id
            WHERE 1=1";

    $params = [];

    if ($specialty) {
        $sql .= " AND ud.specialization = ?";
        $params[] = $specialty;
    }
    if ($country_id) {
        $sql .= " AND ud.country_id = ?";
        $params[] = $country_id;
    }
    if ($state_id) {
        $sql .= " AND ud.state_id = ?";
        $params[] = $state_id;
    }
    if ($city_id) {
        $sql .= " AND ud.city_id = ?";
        $params[] = $city_id;
    }

    $sql .= " ORDER BY ud.full_name ASC";

    error_log("🔍 Doctor search SQL: " . $sql);
    error_log("🔍 Doctor search parameters: " . json_encode($params));

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($doctors as &$doctor) {
        // ** INÍCIO DA CORREÇÃO DE IDIOMAS **
        $language_ids = !empty($doctor['languages']) ? json_decode($doctor['languages'], true) : [];
        if (json_last_error() === JSON_ERROR_NONE && !empty($language_ids)) {
            $language_ids = array_map('intval', $language_ids);
            $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
            $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders)");
            $lang_stmt->execute($language_ids);
            // Substitui o array de IDs pelo array de nomes
            $doctor['languages'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } else {
             if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("search_doctors.php: JSON decode error for languages: " . json_last_error_msg());
            }
            $doctor['languages'] = [];
        }
        // ** FIM DA CORREÇÃO DE IDIOMAS **

        // Lógica original para países de atuação restaurada
        $countryIds = json_decode($doctor['countries_of_practice_json'] ?? '[]', true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("search_doctors.php: JSON decode error for countries_of_practice_json: " . json_last_error_msg());
            $countryIds = [];
        }
        $doctor['countries_of_practice'] = [];
        if (!empty($countryIds)) {
            $countryIds = array_map('intval', $countryIds);
            $placeholders = implode(',', array_fill(0, count($countryIds), '?'));
            $countryStmt = $pdo->prepare("SELECT country_id as id, name FROM countries WHERE country_id IN ($placeholders)");
            $countryStmt->execute($countryIds);
            $doctor['countries_of_practice'] = $countryStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($doctor['countries_of_practice_json']);

        // Lógica original de valores por defeito restaurada
        $doctor['city_name'] = $doctor['city_name'] ?? '';
        $doctor['state_name'] = $doctor['state_name'] ?? '';
        $doctor['country_name'] = $doctor['country_name'] ?? '';
    }
    unset($doctor); // Desfaz a referência para evitar efeitos colaterais

    echo json_encode(["success" => true, "doctors" => $doctors]);
    error_log("✅ Doctor search completed successfully. Found " . count($doctors) . " doctors.");

} catch (PDOException $e) {
    http_response_code(500);
    error_log("❌ PDO Error in search_doctors.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Internal server error while searching for doctors. Details: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("❌ Unexpected error in search_doctors.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Unexpected server error while searching for doctors. Details: " . $e->getMessage()]);
}
?>
