<?php
// api/profile_patient.php

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

$method = $_SERVER['REQUEST_METHOD'];

$action = $_REQUEST['action'] ?? null;

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

if ($decodedToken['user_type'] !== 'patient') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Only patients can perform this action."]);
    exit();
}

$userId = $decodedToken['user_id'];

global $pdo;

switch ($method) {
    case 'GET':
        if ($action === 'get_profile') {
            handleGetPatientProfile($pdo, $userId);
        } elseif ($action === 'get_appointments') {
            handleGetPatientAppointments($pdo, $userId);
        } elseif ($action === 'get_countries') {
            handleGetCountries($pdo);
        } elseif ($action === 'get_states') {
            handleGetStates($pdo);
        } elseif ($action === 'get_cities') {
            handleGetCities($pdo);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid or unspecified GET action."]);
        }
        break;
    case 'POST':
        if ($action === 'upload_profile_picture') {
            handlePatientFileUpload($pdo, $userId, 'profile_picture', 'media', ['image/jpeg', 'image/png', 'image/gif'], 'profile_picture_url');
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid POST action."]);
        }
        break;
    case 'PUT':
        handleUpdatePatientProfile($pdo, $userId);
        break;
    case 'DELETE':
        handleDeletePatientProfile($pdo, $userId);
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed."]);
        break;
}

function handleDeletePatientProfile($pdo, $userId) {
    try {
        $pdo->beginTransaction();


        $stmt = $pdo->prepare("DELETE FROM users_patients WHERE patient_id = ?");
        $stmt->execute([$userId]);

        if ($stmt->rowCount() > 0) {
            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Patient profile deleted successfully."]);
        } else {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Patient not found or already deleted."]);
        }
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        error_log("Error deleting patient profile for user_id {$userId}: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Internal server error while deleting profile."]);
    }
}

function handlePatientFileUpload($pdo, $userId, $fileKey, $targetSubDir, $allowedMimeTypes, $dbColumn) {
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

    if ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
        http_response_code(413);
        echo json_encode(['success' => false, 'message' => 'File is too large. Maximum size is 5MB.']);
        return;
    }
    
    try {
        // This logic is correct and already deletes the old file
        $stmt = $pdo->prepare("SELECT {$dbColumn} FROM users_patients WHERE patient_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result[$dbColumn])) {
            $filePath = dirname(__DIR__) . '/' . $result[$dbColumn];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }
    } catch (PDOException $e) {
        error_log("Error deleting old patient file for user_id {$userId}: " . $e->getMessage());
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = 'patient_' . $userId . '_' . uniqid('', true) . '.' . $extension;
    
    $uploadDir = dirname(__DIR__) . '/' . $targetSubDir . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $destination = $uploadDir . $newFileName;
    
    $fileUrl = $targetSubDir . '/' . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        try {
            $stmt = $pdo->prepare("UPDATE users_patients SET {$dbColumn} = ?, updated_at = NOW() WHERE patient_id = ?");
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


function handleGetPatientProfile($pdo, $userId) {
    try {
        // SOLUTION: Added up.updated_at to the SELECT statement
        $sql = "SELECT
                    up.patient_id, up.full_name, up.email, up.phone_number, up.whatsapp_number,
                    up.date_of_birth, up.gender, up.address_street, up.address_number, up.address_complement,
                    up.address_district, up.address_zip_code, up.full_address, up.city_id, c.name as city_name,
                    up.state_id, s.name as state_name, up.country_id, co.name as country_name, up.nationality,
                    up.emergency_contact_name, up.emergency_contact_phone, up.medical_history, up.allergies,
                    up.medications, up.profile_picture_url,
                    up.updated_at
                FROM users_patients up
                LEFT JOIN cities c ON up.city_id = c.city_id
                LEFT JOIN states s ON up.state_id = s.state_id
                LEFT JOIN countries co ON up.country_id = co.country_id
                WHERE up.patient_id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $patient = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($patient) {
            $patient['city_id'] = $patient['city_id'] !== null ? (int)$patient['city_id'] : null;
            $patient['state_id'] = $patient['state_id'] !== null ? (int)$patient['state_id'] : null;
            $patient['country_id'] = $patient['country_id'] !== null ? (int)$patient['country_id'] : null;
            
            echo json_encode(["success" => true, "message" => "Patient profile found.", "profile" => $patient]);

        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Patient profile not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching profile: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Internal server error while fetching profile."]);
    }
}

function handleGetCountries($pdo) {
    try {
        $stmt = $pdo->query("SELECT country_id, name FROM countries ORDER BY name ASC");
        $countries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "countries" => $countries]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching countries: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Error fetching countries."]);
    }
}

function handleGetStates($pdo) {
    $countryId = filter_input(INPUT_GET, 'country_id', FILTER_VALIDATE_INT);
    if (!$countryId) {
        echo json_encode(["success" => true, "states" => []]);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT state_id, name FROM states WHERE country_id = ? ORDER BY name ASC");
        $stmt->execute([$countryId]);
        $states = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "states" => $states]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching states: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Error fetching states."]);
    }
}

function handleGetCities($pdo) {
    $stateId = filter_input(INPUT_GET, 'state_id', FILTER_VALIDATE_INT);
    if (!$stateId) {
        echo json_encode(["success" => true, "cities" => []]);
        return;
    }

    try {
        $stmt = $pdo->prepare("SELECT city_id, name FROM cities WHERE state_id = ? ORDER BY name ASC");
        $stmt->execute([$stateId]);
        $cities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "cities" => $cities]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching cities: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Error fetching cities."]);
    }
}

function handleGetPatientAppointments($pdo, $patientId) {
    try {
        $sql = "SELECT
                    a.appointment_id as id, a.appointment_date as date, a.appointment_time as time,
                    a.status, a.consultation_fee, ud.full_name as doctor_name, ud.specialization as doctor_specialty
                FROM appointments a
                JOIN users_doctors ud ON a.doctor_id = ud.doctor_id
                WHERE a.patient_id = ?
                ORDER BY a.appointment_date ASC, a.appointment_time ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$patientId]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => "Patient's appointments found.",
            "appointments" => $appointments
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error while fetching appointments."]);
    }
}

function handleUpdatePatientProfile($pdo, $userId) {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid data."]);
        exit();
    }

    $allowedFields = [
        'full_name', 'email', 'phone_number', 'whatsapp_number', 'date_of_birth', 'gender',
        'address_street', 'address_number', 'address_complement', 'address_district',
        'address_zip_code', 'full_address', 'city_id', 'state_id', 'country_id', 'nationality',
        'emergency_contact_name', 'emergency_contact_phone', 'medical_history', 'allergies', 'medications'
    ];

    $setClauses = [];
    $executeParams = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $value = $data[$field];
            if ($value === '' || $value === 'null') {
                $value = null;
            }
            if (in_array($field, ['city_id', 'state_id', 'country_id']) && $value !== null) {
                $value = (int)$value;
            }

            $setClauses[] = "$field = ?";
            $executeParams[] = $value;
        }
    }

    if (empty($setClauses)) {
        echo json_encode(["success" => true, "message" => "No data to update."]);
        exit();
    }
    
    $executeParams[] = $userId;

    try {
        $sql = "UPDATE users_patients SET " . implode(', ', $setClauses) . ", updated_at = NOW() WHERE patient_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($executeParams);

        echo json_encode(["success" => true, "message" => "Patient profile updated successfully!"]);
        
    } catch (PDOException $e) {
        error_log("Error updating profile: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when updating profile."]);
    }
}
?>
