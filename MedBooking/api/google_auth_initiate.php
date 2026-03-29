<?php
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

setCorsHeaders();

session_start();

$secretKey = $_ENV['JWT_SECRET_KEY'];

try {
    $token = getBearerToken();
    if (!$token) {
        throw new Exception("Authorization token missing.", 401);
    }

    $decodedToken = decodeJwtToken($token, $secretKey);
    if (!$decodedToken || $decodedToken['user_type'] !== 'doctor') {
        throw new Exception("Access denied. For doctors only.", 403);
    }
    
    $_SESSION['doctor_id_google_auth'] = $decodedToken['user_id'];

    $client = new Google_Client();
    $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
    $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
    
    if (empty($_ENV['GOOGLE_REDIRECT_URI'])) {
        throw new Exception("The GOOGLE_REDIRECT_URI variable is not configured in the .env file.");
    }
    $client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);
    
    $client->addScope(Google_Service_Calendar::CALENDAR);
    $client->setAccessType('offline');
    $client->setPrompt('consent');

    $authUrl = $client->createAuthUrl();

    sendJsonResponse(['success' => true, 'redirect_url' => $authUrl]);

} catch (Exception $e) {
    $statusCode = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("google_auth_initiate.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error initiating connection with Google: " . $e->getMessage()], $statusCode);
}
?>
