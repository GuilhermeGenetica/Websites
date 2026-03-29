<?php
// api/profile_doctor_functions.php

function handleFileUpload($pdo, $userId, $fileKey, $targetSubDir, $allowedMimeTypes, $dbColumn) {
    error_log("Attempting file upload for user_id: {$userId}, fileKey: {$fileKey}, target: {$targetSubDir}");

    if (!isset($_FILES[$fileKey])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "No file uploaded with key '{$fileKey}'."]);
        error_log("Upload failed: No file found in \$_FILES['{$fileKey}'].");
        return;
    }

    $file = $_FILES[$fileKey];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error during file upload: ' . $file['error']]);
        error_log("Upload failed: Upload error code: " . $file['error']);
        return;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimeTypes)) {
        http_response_code(415);
        echo json_encode(['success' => false, 'message' => "Invalid file type. Allowed types: " . implode(', ', $allowedMimeTypes)]);
        error_log("Upload failed: Invalid MIME type '{$mimeType}'.");
        return;
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(413);
        echo json_encode(['success' => false, 'message' => 'File is too large. Maximum size is 5MB.']);
        error_log("Upload failed: File size " . $file['size'] . " exceeds 5MB limit.");
        return;
    }

    deleteOldFile($pdo, $userId, $dbColumn);

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid('doc_' . $userId . '_', true) . '.' . $extension;
    
    $uploadDir = dirname(__DIR__) . '/' . $targetSubDir . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $destination = $uploadDir . $newFileName;
    
    $fileUrl = $targetSubDir . '/' . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        try {
            $stmt = $pdo->prepare("UPDATE users_doctors SET {$dbColumn} = ? WHERE doctor_id = ?");
            $stmt->execute([$fileUrl, $userId]);
            
            echo json_encode(['success' => true, 'message' => 'File uploaded successfully.', 'filePath' => $fileUrl]);
            error_log("Upload success for user_id: {$userId}. File saved to {$destination} and URL {$fileUrl} saved to DB.");
        } catch (PDOException $e) {
            unlink($destination);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update database.']);
            error_log("Upload DB error for user_id: {$userId}. " . $e->getMessage());
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
        error_log("Upload failed: Could not move file from {$file['tmp_name']} to {$destination}. Check permissions.");
    }
}

function handleDeleteFile($pdo, $userId, $dbColumn) {
    error_log("Attempting to delete file for user_id: {$userId}, column: {$dbColumn}");
    deleteOldFile($pdo, $userId, $dbColumn, true);
    echo json_encode(['success' => true, 'message' => 'Document deleted successfully.']);
}

function deleteOldFile($pdo, $userId, $dbColumn, $forceDbUpdate = false) {
    try {
        $stmt = $pdo->prepare("SELECT {$dbColumn} FROM users_doctors WHERE doctor_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result[$dbColumn])) {
            $filePath = dirname(__DIR__) . '/' . $result[$dbColumn];
            if (file_exists($filePath)) {
                unlink($filePath);
                error_log("Old file deleted for user_id {$userId} at path: {$filePath}");
            } else {
                error_log("Old file path found in DB for user_id {$userId} but file does not exist at: {$filePath}");
            }
        }
        
        if ($forceDbUpdate) {
            $updateStmt = $pdo->prepare("UPDATE users_doctors SET {$dbColumn} = NULL WHERE doctor_id = ?");
            $updateStmt->execute([$userId]);
            error_log("DB column {$dbColumn} cleared for user_id {$userId}.");
        }
    } catch (PDOException $e) {
        error_log("Error during old file deletion process for user_id {$userId}: " . $e->getMessage());
    }
}

function handleGetDoctorProfile($pdo, $userId) {
    try {
        $sql = "SELECT
                    ud.doctor_id, ud.full_name, ud.email, ud.phone_number, ud.whatsapp_number,
                    ud.crm_number, ud.specialization, ud.sub_specialization, ud.education,
                    ud.university, ud.graduation_year, ud.bio, ud.consultation_fee,
                    ud.website, ud.linkedin, ud.awards, ud.languages, ud.countries_of_practice_json,
                    ud.profile_picture_url, ud.document_url, ud.date_of_birth, ud.gender,
                    ud.address_street, ud.address_number, ud.address_complement, ud.address_district,
                    ud.address_zip_code, ud.full_address, ud.city_id, c.name as city_name,
                    ud.state_id, s.name as state_name, ud.country_id, co.name as country_name,
                    ud.created_at, ud.updated_at, ud.certifications, ud.is_active, ud.is_approved,
                    ud.clinic_address, ud.clinic_phone,
                    ud.fee_currency,
                    ud.bank_payment_details,
                    ud.stripe_connect_id,
                    ud.stripe_onboarding_complete
                FROM users_doctors ud
                LEFT JOIN cities c ON ud.city_id = c.city_id
                LEFT JOIN states s ON ud.state_id = s.state_id
                LEFT JOIN countries co ON ud.country_id = co.country_id
                WHERE ud.doctor_id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($doctor) {
            $language_ids = json_decode($doctor['languages'] ?? '[]', true);
            $doctor['languages'] = array_map('intval', $language_ids);

            if (!empty($language_ids)) {
                $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
                $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders)");
                $lang_stmt->execute($language_ids);
                $doctor['language_names'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            } else {
                $doctor['language_names'] = [];
            }

            $doctor['countriesOfPractice'] = json_decode($doctor['countries_of_practice_json'] ?? '[]', true);
            $doctor['countriesOfPractice'] = array_map('intval', $doctor['countriesOfPractice']);
            unset($doctor['countries_of_practice_json']);

            $doctor['consultation_fee'] = ($doctor['consultation_fee'] !== null) ? (float)$doctor['consultation_fee'] : null;
            $doctor['city_id'] = $doctor['city_id'] !== null ? (int)$doctor['city_id'] : null;
            $doctor['state_id'] = $doctor['state_id'] !== null ? (int)$doctor['state_id'] : null;
            $doctor['country_id'] = $doctor['country_id'] !== null ? (int)$doctor['country_id'] : null;
            $doctor['is_active'] = (bool)$doctor['is_active'];
            $doctor['is_approved'] = (bool)$doctor['is_approved'];
            $doctor['stripe_onboarding_complete'] = (bool)$doctor['stripe_onboarding_complete'];

            echo json_encode(["success" => true, "message" => "Doctor profile found.", "profile" => $doctor]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Doctor profile not found."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching profile (DB)."]);
    }
}

function handleUpdateDoctorProfile($pdo, $userId) {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid data."]);
        exit();
    }
    
    $fieldMapping = [
        'full_name' => ['db_field' => 'full_name', 'type' => 'string'],
        'phone_number' => ['db_field' => 'phone_number', 'type' => 'string'],
        'whatsapp_number' => ['db_field' => 'whatsapp_number', 'type' => 'string'],
        'crm_number' => ['db_field' => 'crm_number', 'type' => 'string'],
        'specialization' => ['db_field' => 'specialization', 'type' => 'string'],
        'sub_specialty' => ['db_field' => 'sub_specialization', 'type' => 'string'],
        'education' => ['db_field' => 'education', 'type' => 'string'],
        'university' => ['db_field' => 'university', 'type' => 'string'],
        'graduation_year' => ['db_field' => 'graduation_year', 'type' => 'int'],
        'bio' => ['db_field' => 'bio', 'type' => 'string'],
        'consultation_fee' => ['db_field' => 'consultation_fee', 'type' => 'float_or_null'],
        'fee_currency' => ['db_field' => 'fee_currency', 'type' => 'string'],
        'website' => ['db_field' => 'website', 'type' => 'string'],
        'linkedin' => ['db_field' => 'linkedin', 'type' => 'string'],
        'awards' => ['db_field' => 'awards', 'type' => 'string'],
        'certifications' => ['db_field' => 'certifications', 'type' => 'string'],
        'languages' => ['db_field' => 'languages', 'type' => 'json'],
        'countriesOfPractice' => ['db_field' => 'countries_of_practice_json', 'type' => 'json'],
        'address_street' => ['db_field' => 'address_street', 'type' => 'string'],
        'address_number' => ['db_field' => 'address_number', 'type' => 'string'],
        'address_complement' => ['db_field' => 'address_complement', 'type' => 'string'],
        'address_district' => ['db_field' => 'address_district', 'type' => 'string'],
        'address_zip_code' => ['db_field' => 'address_zip_code', 'type' => 'string'],
        'full_address' => ['db_field' => 'full_address', 'type' => 'string'],
        'city_id' => ['db_field' => 'city_id', 'type' => 'int'],
        'state_id' => ['db_field' => 'state_id', 'type' => 'int'],
        'country_id' => ['db_field' => 'country_id', 'type' => 'int'],
        'date_of_birth' => ['db_field' => 'date_of_birth', 'type' => 'string_or_null'],
        'gender' => ['db_field' => 'gender', 'type' => 'string_or_null'],
        'clinic_address' => ['db_field' => 'clinic_address', 'type' => 'string'],
        'clinic_phone' => ['db_field' => 'clinic_phone', 'type' => 'string'],
        'bank_payment_details' => ['db_field' => 'bank_payment_details', 'type' => 'string'],
        'stripe_connect_id' => ['db_field' => 'stripe_connect_id', 'type' => 'string_or_null'],
    ];

    $setClauses = [];
    $executeParams = [];
    $updateStripeOnboarding = false;

    foreach ($fieldMapping as $frontendField => $mapping) {
        if (array_key_exists($frontendField, $data)) {
            $dbField = $mapping['db_field'];
            $type = $mapping['type'];
            $value = $data[$frontendField];

            if ($dbField === 'stripe_connect_id') {
                $updateStripeOnboarding = true;
            }
            
            if ($type === 'json') {
                $value = (is_array($value) || is_object($value)) ? json_encode($value) : null;
            } elseif ($type === 'int') {
                $value = ($value === null || $value === '') ? null : (int)$value;
            } elseif ($type === 'float_or_null') {
                $value = ($value === null || $value === '') ? null : (float)$value;
            } elseif ($type === 'string_or_null') {
                $value = ($value === '') ? null : $value;
            }

            $setClauses[] = "$dbField = ?";
            $executeParams[] = $value;
        }
    }

    if (empty($setClauses)) {
        echo json_encode(["success" => true, "message" => "No data to update."]);
        exit();
    }
    
    if ($updateStripeOnboarding) {
         $setClauses[] = "stripe_onboarding_complete = 0";
    }

    $executeParams[] = $userId;

    try {
        $sql = "UPDATE users_doctors SET " . implode(', ', $setClauses) . ", updated_at = NOW() WHERE doctor_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($executeParams);

        if ($updateStripeOnboarding) {
            echo json_encode(["success" => true, "message" => "Doctor profile updated. Please re-verify your Stripe account status."]);
        } else {
            echo json_encode(["success" => true, "message" => "Doctor profile updated successfully!"]);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when updating profile: " . $e->getMessage()]);
    }
}


function handleGetLanguages($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, name FROM languages ORDER BY name ASC");
        $languages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "languages" => $languages]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching languages: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Error fetching languages."]);
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

function handleGetMedicalSpecialties($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, specialty_name FROM medical_specialties ORDER BY specialty_name ASC");
        $specialties = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "specialties" => $specialties]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Error fetching medical specialties: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Error fetching medical specialties."]);
    }
}

function handleGetMedBookingointments($pdo, $doctorId) {
    try {
        $stmt = $pdo->prepare("SELECT
                                    a.appointment_id as id,
                                    a.appointment_date as date,
                                    a.appointment_time as time,
                                    a.status,
                                    up.full_name as patientName,
                                    up.email as patientEmail
                                FROM appointments a
                                JOIN users_patients up ON a.patient_id = up.patient_id
                                WHERE a.doctor_id = ?
                                ORDER BY a.appointment_date ASC, a.appointment_time ASC");
        $stmt->execute([$doctorId]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => "Doctor's appointments found.",
            "appointments" => $appointments
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching appointments."]);
    }
}

function handleGetPublicDoctors($pdo) {
    try {
        $baseSql = "SELECT
                    ud.doctor_id,
                    ud.full_name,
                    ud.specialization,
                    ud.sub_specialization,
                    ud.profile_picture_url,
                    ud.consultation_fee,
                    ud.fee_currency,
                    ud.bio,
                    ud.crm_number,
                    ud.phone_number,
                    ud.whatsapp_number,
                    ud.email,
                    ud.education,
                    ud.university,
                    ud.graduation_year,
                    ud.website,
                    ud.linkedin,
                    ud.awards,
                    ud.languages,
                    ud.countries_of_practice_json,
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
                    ud.is_active,
                    ud.is_approved,
                    ud.stripe_connect_id,
                    ud.stripe_onboarding_complete,
                    ud.updated_at
                FROM users_doctors ud
                LEFT JOIN cities c ON ud.city_id = c.city_id
                LEFT JOIN states s ON ud.state_id = s.state_id
                LEFT JOIN countries co ON ud.country_id = co.country_id";

        $params = [];
        $whereClauses = ["ud.is_active = 1", "ud.is_approved = 1"];

        if (!empty($_GET['specialty'])) {
            $whereClauses[] = "ud.specialization = ?";
            $params[] = $_GET['specialty'];
        }
        if (!empty($_GET['country_id'])) {
            $whereClauses[] = "ud.country_id = ?";
            $params[] = $_GET['country_id'];
        }
        if (!empty($_GET['state_id'])) {
            $whereClauses[] = "ud.state_id = ?";
            $params[] = $_GET['state_id'];
        }
        if (!empty($_GET['city_id'])) {
            $whereClauses[] = "ud.city_id = ?";
            $params[] = $_GET['city_id'];
        }

        $sql = $baseSql . " WHERE " . implode(' AND ', $whereClauses) . " ORDER BY ud.full_name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // --- MODIFICATION START ---
        // Prepare schedule lookup statement before the loop for efficiency
        $schedule_stmt = $pdo->prepare("SELECT schedule_data FROM schedule_doctors WHERE doctor_id = ?");
        $today = date('Y-m-d');
        // --- MODIFICATION END ---

        foreach ($doctors as &$doctor) {
            $language_ids = json_decode($doctor['languages'] ?? '[]', true);
            if (json_last_error() === JSON_ERROR_NONE && !empty($language_ids)) {
                $language_ids = array_map('intval', $language_ids);
                $placeholders = implode(',', array_fill(0, count($language_ids), '?'));
                $lang_stmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ($placeholders)");
                $lang_stmt->execute($language_ids);
                $doctor['languages'] = $lang_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            } else {
                $doctor['languages'] = [];
            }

            $country_ids = json_decode($doctor['countries_of_practice_json'] ?? '[]', true);
            if (json_last_error() === JSON_ERROR_NONE && !empty($country_ids)) {
                $country_ids = array_map('intval', $country_ids);
                $placeholders = implode(',', array_fill(0, count($country_ids), '?'));
                $country_stmt = $pdo->prepare("SELECT name FROM countries WHERE country_id IN ($placeholders) ORDER BY name ASC");
                $country_stmt->execute($country_ids);
                $doctor['countries_of_practice'] = $country_stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            } else {
                $doctor['countries_of_practice'] = [];
            }
            unset($doctor['countries_of_practice_json']);

            $doctor['consultation_fee'] = ($doctor['consultation_fee'] !== null) ? (float)$doctor['consultation_fee'] : null;
            $doctor['city_id'] = $doctor['city_id'] !== null ? (int)$doctor['city_id'] : null;
            $doctor['state_id'] = $doctor['state_id'] !== null ? (int)$doctor['state_id'] : null;
            $doctor['country_id'] = $doctor['country_id'] !== null ? (int)$doctor['country_id'] : null;
            $doctor['is_active'] = (bool)$doctor['is_active'];
            $doctor['is_approved'] = (bool)$doctor['is_approved'];
            $doctor['stripe_onboarding_complete'] = (bool)$doctor['stripe_onboarding_complete'];

            // --- MODIFICATION START ---
            // Check for the next available schedule date
            $doctor['next_available_date'] = null;
            try {
                $schedule_stmt->execute([$doctor['doctor_id']]);
                $scheduleResult = $schedule_stmt->fetch(PDO::FETCH_ASSOC);

                if ($scheduleResult && !empty($scheduleResult['schedule_data'])) {
                    $scheduleData = json_decode($scheduleResult['schedule_data'], true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && isset($scheduleData['dates']) && (is_array($scheduleData['dates']) || is_object($scheduleData['dates']))) {
                        
                        $dateKeys = array_keys((array)$scheduleData['dates']);
                        sort($dateKeys); // Ensure dates are in chronological order

                        foreach ($dateKeys as $dateStr) {
                            // Check if date is today or in the future
                            if ($dateStr >= $today) {
                                // Check if this date has any time slots defined
                                if (!empty($scheduleData['dates'][$dateStr]['timeSlots'])) {
                                    $doctor['next_available_date'] = $dateStr;
                                    break; // Found the earliest available date with slots
                                }
                            }
                        }
                    }
                }
            } catch (PDOException $e) {
                // Log the error but don't fail the entire doctor list
                error_log("Error fetching schedule for doctor {$doctor['doctor_id']} in handleGetPublicDoctors: " . $e->getMessage());
            }
            // --- MODIFICATION END ---

        }
        unset($doctor);

        echo json_encode(["success" => true, "doctors" => $doctors]);
    } catch (PDOException $e) {
        error_log("PDO Error fetching public doctors: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Internal server error when fetching public doctors."]);
    }
}
?>