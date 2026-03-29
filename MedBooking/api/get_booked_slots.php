<?php
require_once 'config.php';

// CORREÇÃO: Suprimir a saída de erros HTML para garantir uma resposta JSON válida.
// O config.php força display_errors=1, o que quebra os endpoints da API.
ini_set('display_errors', 0);

require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $_ENV['JWT_SECRET_KEY']);
    if (!$decodedToken) {
        throw new Exception("Invalid or expired token.", 401);
    }

    $doctorId = filter_input(INPUT_GET, 'doctor_id', FILTER_VALIDATE_INT);
    // CORREÇÃO: Substituído o filtro obsoleto FILTER_SANITIZE_STRING.
    $date = filter_input(INPUT_GET, 'date', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

    if (!$doctorId || !$date) {
        throw new Exception("Doctor ID and date are required.", 400);
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new Exception("Invalid date format. Use YYYY-MM-DD.", 400);
    }

    global $pdo;
    $stmt = $pdo->prepare(
        "SELECT appointment_time FROM appointments 
         WHERE doctor_id = ? AND appointment_date = ? AND (status = 'confirmed' OR status = 'paid')"
    );
    $stmt->execute([$doctorId, $date]);
    
    $bookedSlots = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    $formattedSlots = array_map(function($time) {
        return substr($time, 0, 5);
    }, $bookedSlots);

    sendJsonResponse(["success" => true, "bookedSlots" => $formattedSlots]);

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("get_booked_slots.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>