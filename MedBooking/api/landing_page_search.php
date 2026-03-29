<?php
// Set the content type to JSON immediately. This is the most critical part.
header('Content-Type: application/json');

// Enable error reporting for development. All errors will be caught and formatted as JSON.
ini_set('display_errors', 0); // Disable direct output of errors
error_reporting(E_ALL);

// This function will handle any errors or exceptions, ensuring a JSON response.
function json_error_handler($severity, $message, $file, $line) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "A server error occurred.",
        "error_details" => "Error: [$severity] $message in $file on line $line"
    ]);
    exit();
}
set_error_handler('json_error_handler');

function json_exception_handler($exception) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "An unhandled exception occurred.",
        "error_details" => $exception->getMessage()
    ]);
    exit();
}
set_exception_handler('json_exception_handler');

// This function will handle any fatal errors that the other handlers might miss.
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "A critical server error occurred.",
                "error_details" => "Fatal error: " . $error['message'] . " in " . $error['file'] . " on line " . $error['line']
            ]);
        }
    }
});

// Now, start the main logic within a try-catch block for extra safety.
try {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/utils.php';

    global $pdo;
    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new Exception('Database connection failed.');
    }

    setCorsHeaders();

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Method not allowed. Only GET requests are accepted.', 405);
    }

    // CORRECTION: Replaced deprecated FILTER_SANITIZE_STRING with FILTER_SANITIZE_FULL_SPECIAL_CHARS
    $action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    if (!$action) {
        throw new Exception('Action parameter is missing.', 400);
    }
    
    switch ($action) {
        case 'get_filters':
            handle_get_filters($pdo);
            break;
        case 'search_doctors':
            handle_search_doctors($pdo);
            break;
        default:
            throw new Exception('Invalid action specified.', 400);
    }

} catch (Exception $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
    exit();
}

function handle_get_filters($pdo) {
    $stmt_specialties = $pdo->query("SELECT id, specialty_name FROM medical_specialties ORDER BY specialty_name ASC");
    $specialties = $stmt_specialties->fetchAll(PDO::FETCH_ASSOC);

    $stmt_countries = $pdo->query("SELECT country_id, name FROM countries ORDER BY name ASC");
    $countries = $stmt_countries->fetchAll(PDO::FETCH_ASSOC);

    $stmt_languages = $pdo->query("SELECT id, name FROM languages ORDER BY name ASC");
    $languages = $stmt_languages->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true, 
        "filters" => [
            "specialties" => $specialties,
            "countries" => $countries,
            "languages" => $languages
        ]
    ]);
}

function handle_search_doctors($pdo) {
    // CORRECTION: Replaced deprecated FILTER_SANITIZE_STRING with FILTER_SANITIZE_FULL_SPECIAL_CHARS
    $specialty = filter_input(INPUT_GET, 'specialty', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $country_id = filter_input(INPUT_GET, 'country_id', FILTER_VALIDATE_INT);
    $language_id = filter_input(INPUT_GET, 'language_id', FILTER_VALIDATE_INT);

    $sql = "SELECT
                ud.doctor_id, ud.full_name, ud.specialization, ud.sub_specialization,
                ud.bio, ud.consultation_fee, ud.fee_currency, ud.profile_picture_url,
                ud.languages AS languages_json,
                ud.countries_of_practice_json
            FROM users_doctors ud
            WHERE ud.is_active = 1 AND ud.is_approved = 1";

    $params = [];

    if ($specialty) {
        $sql .= " AND ud.specialization = ?";
        $params[] = $specialty;
    }
    if ($country_id) {
        $sql .= " AND JSON_CONTAINS(ud.countries_of_practice_json, ?)";
        $params[] = (string)$country_id;
    }
    if ($language_id) {
        $sql .= " AND JSON_CONTAINS(ud.languages, ?)";
        $params[] = (string)$language_id;
    }

    $sql .= " ORDER BY ud.full_name ASC LIMIT 12";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process JSON fields into readable arrays
    foreach ($doctors as &$doctor) {
        $language_ids = !empty($doctor['languages_json']) ? json_decode($doctor['languages_json'], true) : [];
        $doctor['languages'] = [];
        if (json_last_error() === JSON_ERROR_NONE && is_array($language_ids) && !empty($language_ids)) {
            $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
            $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders)");
            $lang_stmt->execute($language_ids);
            $doctor['languages'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        }
        unset($doctor['languages_json']);

        $countryIds = !empty($doctor['countries_of_practice_json']) ? json_decode($doctor['countries_of_practice_json'], true) : [];
        $doctor['countries_of_practice'] = [];
        if (json_last_error() === JSON_ERROR_NONE && is_array($countryIds) && !empty($countryIds)) {
            $placeholders = implode(',', array_fill(0, count($countryIds), '?'));
            $countryStmt = $pdo->prepare("SELECT name FROM countries WHERE country_id IN ($placeholders)");
            $countryStmt->execute($countryIds);
            $doctor['countries_of_practice'] = $countryStmt->fetchAll(PDO::FETCH_COLUMN, 0);
        }
        unset($doctor['countries_of_practice_json']);
    }
    unset($doctor);

    echo json_encode(["success" => true, "doctors" => $doctors]);
}
?>
