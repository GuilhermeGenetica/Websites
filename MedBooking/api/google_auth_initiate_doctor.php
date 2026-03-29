<?php
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

setCorsHeaders();
session_start();

try {
    $client = new Google_Client();
    $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
    $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
    
    $redirectUri = trim($_ENV['GOOGLE_REDIRECT_URI_DOCTOR'], '"');
    if (empty($redirectUri)) {
        throw new Exception("The GOOGLE_REDIRECT_URI_DOCTOR environment variable is not configured.");
    }
    $client->setRedirectUri($redirectUri);
    
    $client->addScope("email");
    $client->addScope("profile");
    
    $authUrl = $client->createAuthUrl();

    sendJsonResponse(['success' => true, 'redirect_url' => $authUrl]);

} catch (Exception $e) {
    error_log("google_auth_initiate_doctor.php Error: " . $e->getMessage());
    sendJsonResponse(["success" => false, "message" => "Error initiating Google login for doctor: " . $e->getMessage()], 500);
}
?>
