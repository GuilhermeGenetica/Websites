<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("register_patient.php: Script started.");

require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

error_log("register_patient.php: Data received: " . print_r($data, true));

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

error_log("register_patient.php: Essential variables processed: Name=" . $name . ", Email=" . $email);

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
    error_log("register_patient.php: PDO connection available.");

    $stmt = $pdo->prepare("SELECT patient_id FROM users_patients WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "This email is already registered."]);
        exit();
    }
    error_log("register_patient.php: Email not duplicated.");

    if (!function_exists('hashPassword')) {
        error_log("register_patient.php: FATAL ERROR - hashPassword function not found. Check utils.php.");
        throw new Exception("hashPassword function not defined. Check utils.php.");
    }
    $hashedPassword = hashPassword($password);
    error_log("register_patient.php: Password hash generated.");

    $sql = "INSERT INTO users_patients (
        full_name, email, password_hash
    ) VALUES (?, ?, ?)";
    
    error_log("register_patient.php: SQL INSERT: " . $sql);

    $stmt = $pdo->prepare($sql);

    $params = [
        $name, 
        $email, 
        $hashedPassword
    ];
    error_log("register_patient.php: Execution parameters: " . print_r($params, true));

    $stmt->execute($params);
    error_log("register_patient.php: INSERT execution completed.");

    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Patient registration successful!"]);
    error_log("register_patient.php: Success response sent.");

} catch (PDOException $e) {
    error_log("PDO Error in patient registration: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error when registering the patient. Details: " . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error in patient registration: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error when registering the patient. Details: " . $e->getMessage()]);
}
?>
