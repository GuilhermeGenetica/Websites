<?php
// /api/google-callback.php
// Final production-ready version with robust error handling.

// This helper function MUST be defined at the very top.
function post_message_to_opener($data) {
    if (!isset($data['source'])) {
        $data['source'] = 'google-oauth';
    }
    $jsonData = json_encode($data);
    echo <<<HTML
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Processing</title>
        <script>
            try {
                if (window.opener && !window.opener.closed) {
                    const targetOrigin = window.location.origin;
                    window.opener.postMessage($jsonData, targetOrigin);
                }
            } catch (e) {
                console.error("postMessage failed:", e);
            } finally {
                window.close();
            }
        </script>
    </head>
    <body><p>Processing... this window will close automatically.</p></body>
    </html>
HTML;
    exit();
}

// Failsafe shutdown function: This is guaranteed to run even on fatal errors.
register_shutdown_function(function() {
    $error = error_get_last();
    // Check if a fatal error occurred.
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        // Log the fatal error (requires config.php to have loaded for log_error).
        if (function_exists('log_error')) {
            log_error($error['message'], $error['file'], $error['line'], ['type' => 'FATAL_SHUTDOWN']);
        }
        // Send a generic error message back to the frontend.
        post_message_to_opener([
            'success' => false, 
            'error' => 'A fatal server error occurred during Google authentication. The administrator has been notified.',
            'source' => 'google-oauth-shutdown'
        ]);
    }
});

require_once __DIR__ . '/config.php'; // config.php now handles the autoloader

use Firebase\JWT\JWT;
use Google\Client;
use Google\Service\Oauth2;

try {
    $googleClientId = get_env_var('GOOGLE_CLIENT_ID');
    $googleClientSecret = get_env_var('GOOGLE_CLIENT_SECRET');
    $googleRedirectUri = get_env_var('GOOGLE_REDIRECT_URI');

    if (!$googleClientId || !$googleClientSecret || !$googleRedirectUri) {
        throw new Exception("Google OAuth credentials are not fully configured.");
    }

    $client = new Client();
    $client->setClientId($googleClientId);
    $client->setClientSecret($googleClientSecret);
    $client->setRedirectUri($googleRedirectUri);

    if (empty($_GET['code'])) {
        throw new Exception('Google authorization code was not received.');
    }

    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    if (isset($token['error'])) {
        // Log the specific error from Google for debugging
        log_error('Google Token Exchange Error: ' . ($token['error_description'] ?? 'Unknown error'), __FILE__, __LINE__);
        // Provide a user-friendly error
        throw new Exception('Failed to get access token from Google. Please try again.');
    }
    
    $client->setAccessToken($token);
    $google_oauth = new Oauth2($client);
    $google_account_info = $google_oauth->userinfo->get();
    
    $google_id = $google_account_info->id;
    $email = filter_var($google_account_info->email, FILTER_VALIDATE_EMAIL);
    $full_name = htmlspecialchars($google_account_info->name);
    $avatar_url = filter_var($google_account_info->picture, FILTER_VALIDATE_URL);

    if (!$email) {
        throw new Exception('A valid email could not be retrieved from the Google account.');
    }
    
    global $pdo;
    $stmt = $pdo->prepare("SELECT id, full_name, is_admin, has_paid, google_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user_by_email = $stmt->fetch();

    $user_id = null;
    $is_admin = 0;

    if ($user_by_email) {
        $user_id = $user_by_email['id'];
        $is_admin = $user_by_email['is_admin'];
        if (empty($user_by_email['google_id'])) {
            $updateStmt = $pdo->prepare("UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?");
            $updateStmt->execute([$google_id, $avatar_url, $user_id]);
        }
    } else {
        $insertStmt = $pdo->prepare(
            "INSERT INTO users (google_id, full_name, email, avatar_url, is_admin, has_paid, is_active) VALUES (?, ?, ?, ?, 0, 0, 1)"
        );
        $insertStmt->execute([$google_id, $full_name, $email, $avatar_url]);
        $user_id = $pdo->lastInsertId();
    }
    
    if (!$user_id) {
        throw new Exception('System Error: Failed to create or retrieve user from database.');
    }

    $issuedAt = time();
    $expirationTime = $issuedAt + (60 * 60 * 24); // 24 hours
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expirationTime,
        'data' => [
            'id' => $user_id,
            'email' => $email,
            'is_admin' => (bool)$is_admin
        ]
    ];
    $jwt = JWT::encode($payload, get_env_var('JWT_SECRET'), 'HS256');
    
    $isProduction = get_env_var('APP_ENV') !== 'development';
    setcookie('auth_token', $jwt, [
        'expires' => $expirationTime,
        'path' => '/',
        'domain' => '', 
        'secure' => $isProduction,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    post_message_to_opener(['success' => true]);

} catch (Throwable $e) {
    log_error("Google OAuth Callback Failed: " . $e->getMessage(), $e->getFile(), $e->getLine());
    post_message_to_opener(['success' => false, 'error' => 'An internal server error occurred during authentication. Our team has been notified.']);
}
?>

