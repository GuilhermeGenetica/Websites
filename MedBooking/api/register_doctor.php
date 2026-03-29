<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$requiredFields = ['name', 'email', 'password'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "All required fields must be filled: " . $field]);
        exit();
    }
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];

$crm = trim($data['crm'] ?? '');
$specialty = trim($data['specialty'] ?? '');
$phone = trim($data['phone'] ?? '');
$whatsapp = trim($data['whatsapp'] ?? '');
$bio = trim($data['bio'] ?? '');
$consultation_fee = isset($data['consultation_fee']) && $data['consultation_fee'] !== '' ? (float)$data['consultation_fee'] : null;
$address = trim($data['address'] ?? '');
$city_id = isset($data['city_id']) && $data['city_id'] !== '' ? (int)$data['city_id'] : null;
$state_id = isset($data['state_id']) && $data['state_id'] !== '' ? (int)$data['state_id'] : null;
$country_id = isset($data['country_id']) && $data['country_id'] !== '' ? (int)$data['country_id'] : null;
$languages_spoken = json_encode($data['languages_spoken'] ?? []);
$availability_json = json_encode($data['availability_json'] ?? []);
$sub_specialty = trim($data['subSpecialty'] ?? '');
$education = trim($data['education'] ?? '');
$university = trim($data['university'] ?? '');
$graduation_year = isset($data['graduationYear']) && $data['graduationYear'] !== '' ? (int)$data['graduationYear'] : null;
$website_url = trim($data['website'] ?? '');
$linkedin_url = trim($data['linkedin'] ?? '');
$certifications = trim($data['certifications'] ?? '');
$awards = trim($data['awards'] ?? '');
$countries_of_practice_json = json_encode($data['countriesOfPractice'] ?? []);

if (!isValidEmail($email)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long."]);
    exit();
}

try {
    global $pdo;

    $stmt = $pdo->prepare("SELECT doctor_id FROM users_doctors WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "This email is already registered."]);
        exit();
    }

    if (!empty($crm) && !empty($country_id)) {
        $stmt = $pdo->prepare("SELECT doctor_id FROM users_doctors WHERE crm_number = ? AND country_id = ?");
        $stmt->execute([$crm, $country_id]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "This CRM is already registered for this country."]);
            exit();
        }
    }

    $hashedPassword = hashPassword($password);

    $stmt = $pdo->prepare("INSERT INTO users_doctors (
        full_name, email, password_hash, crm_number, specialization, phone_number, whatsapp_number, bio, consultation_fee, 
        address_street, city_id, state_id, country_id, languages, sub_specialty, education, university, 
        graduation_year, website_url, linkedin_url, certifications, awards, countries_of_practice_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $name, $email, $hashedPassword, $crm, $specialty, $phone, $whatsapp, $bio, $consultation_fee, 
        $address, $city_id, $state_id, $country_id, $languages_spoken, $sub_specialty, $education, $university, 
        $graduation_year, $website_url, $linkedin_url, $certifications, $awards, $countries_of_practice_json
    ]);

    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Doctor registration successful!"]);

} catch (PDOException $e) {
    error_log("Error in doctor registration: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error when registering the doctor."]);
}
?>
