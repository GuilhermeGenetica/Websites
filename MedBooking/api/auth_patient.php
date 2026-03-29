<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

$secretKey = $_ENV['JWT_SECRET_KEY'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit();
}

$email = trim($data['email']);
$password = $data['password'];

try {
    global $pdo;

    $stmt = $pdo->prepare("SELECT patient_id, full_name, email, password_hash, is_active FROM users_patients WHERE email = ?");
    $stmt->execute([$email]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($patient && verifyPassword($password, $patient['password_hash'])) {
        if ($patient['is_active'] == 0) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Your patient account is inactive. Please contact support.",
                "is_active" => false
            ]);
            exit();
        }

        $token = generateJwtToken($patient['patient_id'], 'patient', $patient['email'], $secretKey);

        echo json_encode([
            "success" => true,
            "message" => "Patient login successful!",
            "token" => $token,
            "user" => [
                "id" => $patient['patient_id'],
                "name" => $patient['full_name'],
                "email" => $patient['email'],
                "user_type" => "patient",
                "is_active" => (bool)$patient['is_active']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid credentials."]);
    }
} catch (PDOException $e) {
    error_log("Patient login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error while trying to log in. Details: " . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General patient login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unexpected server error. Details: " . $e->getMessage()]);
}
?>
