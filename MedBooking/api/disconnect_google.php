<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(["success" => false, "message" => "Method not allowed."], 405);
    exit();
}

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $_ENV['JWT_SECRET_KEY']);
    if (!$decodedToken || $decodedToken['user_type'] !== 'doctor') {
        throw new Exception("Access denied. For doctors only.", 403);
    }
    $doctorId = $decodedToken['user_id'];

    $stmt = $pdo->prepare("
        UPDATE users_doctors 
        SET 
            google_refresh_token = NULL, 
            google_access_token = NULL, 
            google_access_token_expiry = NULL 
        WHERE 
            doctor_id = ?
    ");
    
    $stmt->execute([$doctorId]);

    if ($stmt->rowCount() > 0) {
        sendJsonResponse(["success" => true, "message" => "Disconnected from Google Calendar successfully."]);
    } else {
        throw new Exception("No connection found or error while disconnecting.", 404);
    }

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("disconnect_google.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error: " . $e->getMessage()], $statusCode);
}
?>
