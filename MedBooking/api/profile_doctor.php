<?php
require_once 'config.php';
require_once 'utils.php';
require_once 'profile_doctor_functions.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

$method = $_SERVER['REQUEST_METHOD'];

$action = null; 

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

$decodedToken = null;
if ($token) {
    $decodedToken = decodeJwtToken($token, $secretKey);
}

if (!isset($_REQUEST['action']) || ($_REQUEST['action'] !== 'get_public_doctors' && $_REQUEST['action'] !== 'get_languages')) {
    if (!$decodedToken || !isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'doctor') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Access denied. A valid doctor token is required for this action."]);
        exit();
    }
}

global $pdo;

function handleDoctorFileUpload($pdo, $userId, $fileKey, $targetSubDir, $allowedMimeTypes, $dbColumn) {
    if (!isset($_FILES[$fileKey])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "No file uploaded with key '{$fileKey}'."]);
        return;
    }

    $file = $_FILES[$fileKey];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error during file upload: ' . $file['error']]);
        return;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimeTypes)) {
        http_response_code(415);
        echo json_encode(['success' => false, 'message' => "Invalid file type. Allowed types: " . implode(', ', $allowedMimeTypes)]);
        return;
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(413);
        echo json_encode(['success' => false, 'message' => 'File is too large. Maximum size is 5MB.']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT {$dbColumn} FROM users_doctors WHERE doctor_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result[$dbColumn])) {
            $filePath = dirname(__DIR__) . '/' . $result[$dbColumn];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }
    } catch (PDOException $e) {
        error_log("Error deleting old doctor file for user_id {$userId}: " . $e->getMessage());
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = 'doctor_' . $userId . '_' . uniqid('', true) . '.' . $extension;
    
    $uploadDir = dirname(__DIR__) . '/' . $targetSubDir . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $destination = $uploadDir . $newFileName;
    
    $fileUrl = $targetSubDir . '/' . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        try {
            $stmt = $pdo->prepare("UPDATE users_doctors SET {$dbColumn} = ?, updated_at = NOW() WHERE doctor_id = ?");
            $stmt->execute([$fileUrl, $userId]);
            
            echo json_encode(['success' => true, 'message' => 'File uploaded successfully.', 'filePath' => $fileUrl]);
        } catch (PDOException $e) {
            unlink($destination);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update database.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
    }
}

function handleLocalGetDoctorProfile($pdo, $userId) {
     try {
        $sql = "SELECT
                ud.doctor_id, ud.full_name, ud.email, ud.phone_number, ud.whatsapp_number,
                ud.crm_number, ud.specialization, ud.sub_specialization, ud.education,
                ud.university, ud.graduation_year, ud.address_street, ud.address_number,
                ud.address_complement, ud.address_district, ud.address_zip_code,
                ud.full_address, ud.city_id, ud.state_id, ud.country_id,
                ud.languages, ud.bio, ud.consultation_fee, ud.fee_currency,
                ud.website, ud.linkedin, ud.certifications, ud.awards,
                ud.countries_of_practice_json as countriesOfPractice, 
                ud.profile_picture_url, ud.document_url,
                ud.date_of_birth, ud.gender, ud.clinic_address, ud.clinic_phone,
                ud.bank_payment_details,
                ud.stripe_connect_id,
                ud.stripe_onboarding_complete,
                ud.updated_at
            FROM users_doctors ud
            WHERE ud.doctor_id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($doctor) {
            $language_ids = json_decode($doctor['languages'] ?? '[]', true);
            if (json_last_error() === JSON_ERROR_NONE && !empty($language_ids)) {
                $doctor['languages'] = array_map('strval', $language_ids);
            } else {
                $doctor['languages'] = [];
            }

            $countryIds = json_decode($doctor['countriesOfPractice'] ?? '[]', true);
             if (json_last_error() === JSON_ERROR_NONE && !empty($countryIds)) {
                $doctor['countriesOfPractice'] = array_map('strval', $countryIds);
            } else {
                $doctor['countriesOfPractice'] = [];
            }
            unset($doctor['countries_of_practice_json']);

            $doctor['city_id'] = $doctor['city_id'] !== null ? (int)$doctor['city_id'] : null;
            $doctor['state_id'] = $doctor['state_id'] !== null ? (int)$doctor['state_id'] : null;
            $doctor['country_id'] = $doctor['country_id'] !== null ? (int)$doctor['country_id'] : null;
            $doctor['stripe_onboarding_complete'] = (bool)$doctor['stripe_onboarding_complete'];
            
            echo json_encode(["success" => true, "message" => "Doctor profile found.", "profile" => $doctor]);

        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Doctor profile not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching doctor profile: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Internal server error while fetching profile."]);
    }
}


switch ($method) {
    case 'GET':
        $action = $_REQUEST['action'] ?? null;
        if ($action === 'get_profile') {
            handleLocalGetDoctorProfile($pdo, $decodedToken['user_id']);
        } elseif ($action === 'get_appointments') {
            handleGetMedBookingointments($pdo, $decodedToken['user_id']);
        } elseif ($action === 'get_countries') {
            handleGetCountries($pdo);
        } elseif ($action === 'get_states') {
            handleGetStates($pdo);
        } elseif ($action === 'get_cities') {
            handleGetCities($pdo);
        } elseif ($action === 'get_medical_specialties') {
            handleGetMedicalSpecialties($pdo);
        } elseif ($action === 'get_public_doctors') {
            handleGetPublicDoctors($pdo);
        } elseif ($action === 'get_languages') {
            handleGetLanguages($pdo);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid or unspecified GET action."]);
        }
        break;
    case 'POST':
        $postData = json_decode(file_get_contents("php://input"), true);
        $action = $postData['action'] ?? ($_FILES ? ($_POST['action'] ?? null) : null);

        if (!$action) {
            $action = $_REQUEST['action'] ?? null;
        }

        if ($action === 'upload_profile_picture') {
            handleDoctorFileUpload($pdo, $decodedToken['user_id'], 'profile_picture', 'media', ['image/jpeg', 'image/png', 'image/gif'], 'profile_picture_url');
        } elseif ($action === 'upload_document') {
            handleDoctorFileUpload($pdo, $decodedToken['user_id'], 'document', 'documents', ['application/pdf'], 'document_url');
        } elseif ($action === 'delete_document') {
            handleDeleteFile($pdo, $decodedToken['user_id'], 'document_url');
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid POST action."]);
        }
        break;
    case 'PUT':
        handleUpdateDoctorProfile($pdo, $decodedToken['user_id']);
        break;
    case 'DELETE':
        $action = $_REQUEST['action'] ?? null;
        if ($action === 'delete_profile') {
            handleDeleteProfile($pdo, $decodedToken['user_id']);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid DELETE action."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed."]);
        break;
}
?>
