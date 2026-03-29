<?php
session_start();

require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

function render_popup_page($title, $message, $isSuccess) {
    $bgColor = $isSuccess ? '#f0fdf4' : '#fef2f2';
    $textColor = $isSuccess ? '#166534' : '#991b1b';
    $buttonColor = $isSuccess ? '#22c55e' : '#ef4444';

    echo <<<HTML
    <!DOCTYPE html>
    <html lang="en-US">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>$title</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: $bgColor; color: $textColor; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .container { max-width: 400px; padding: 2rem; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { font-size: 1.5rem; margin-bottom: 1rem; }
            p { margin-bottom: 2rem; }
            button { background-color: $buttonColor; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-size: 1rem; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>$title</h1>
            <p>$message</p>
            <button onclick="window.close()">Close Window</button>
        </div>
    </body>
    </html>
HTML;
    exit();
}


try {
    if (!isset($_GET['code'])) {
        throw new Exception("Google authorization code not found.");
    }
    
    if (!isset($_SESSION['doctor_id_google_auth'])) {
        throw new Exception("Doctor session expired or invalid. Please try again.");
    }
    
    $doctorId = $_SESSION['doctor_id_google_auth'];
    unset($_SESSION['doctor_id_google_auth']);

    $client = new Google_Client();
    $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
    $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
    $client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);

    $accessToken = $client->fetchAccessTokenWithAuthCode($_GET['code']);

    if (isset($accessToken['error'])) {
        throw new Exception("Error getting access token: " . ($accessToken['error_description'] ?? 'Unknown error'));
    }

    $refreshToken = $client->getRefreshToken();
    if (!$refreshToken) {
        $stmt = $pdo->prepare("SELECT google_refresh_token FROM users_doctors WHERE doctor_id = ?");
        $stmt->execute([$doctorId]);
        $existingToken = $stmt->fetchColumn();
        if (!$existingToken) {
            throw new Exception("Could not get refresh token. Try removing MedBooking access from your Google account and connecting again.");
        }
        $refreshToken = $existingToken;
    }

    $accessTokenJson = json_encode($client->getAccessToken());
    $expiryTimestamp = time() + ($accessToken['expires_in'] ?? 3600);

    $stmt = $pdo->prepare(
        "UPDATE users_doctors SET 
            google_refresh_token = ?, 
            google_access_token = ?, 
            google_access_token_expiry = FROM_UNIXTIME(?) 
         WHERE doctor_id = ?"
    );
    $stmt->execute([$refreshToken, $accessTokenJson, $expiryTimestamp, $doctorId]);

    render_popup_page('Connection Successful!', 'Your account has been connected to Google Calendar. You can close this window.', true);

} catch (Exception $e) {
    error_log("google_auth_callback.php Error: " . $e->getMessage());
    render_popup_page('Connection Error', 'An error occurred: ' . $e->getMessage(), false);
}
?>
