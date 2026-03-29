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

    $stmt = $pdo->prepare("SELECT doctor_id, full_name, email, password_hash, is_active FROM users_doctors WHERE email = ?");
    $stmt->execute([$email]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($doctor && verifyPassword($password, $doctor['password_hash'])) {
        if ($doctor['is_active'] == 0) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Your doctor account is inactive. Please contact support.",
                "is_active" => false
            ]);
            exit();
        }

        $token = generateJwtToken($doctor['doctor_id'], 'doctor', $doctor['email'], $secretKey);

        echo json_encode([
            "success" => true,
            "message" => "Doctor login successful!",
            "token" => $token,
            "user" => [
                "id" => $doctor['doctor_id'],
                "name" => $doctor['full_name'],
                "email" => $doctor['email'],
                "user_type" => "doctor",
                "is_active" => (bool)$doctor['is_active']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid credentials."]);
    }
} catch (PDOException $e) {
    error_log("Doctor login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error while trying to log in."]);
} catch (Exception $e) {
    error_log("General doctor login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unexpected server error."]);
}
?>
