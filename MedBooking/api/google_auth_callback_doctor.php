<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
require_once 'config.php';
require_once 'utils.php';
require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Renders the HTML popup window for success or failure.
 * This new version uses a classic, minimalist, and responsive modal.
 * It handles both success and error states.
 * (All user-facing text is now in English)
 *
 * @param array $data Data to be sent to the parent window and displayed.
 */
function render_popup_script($data) {
    $jsonData = json_encode($data);
    $isSuccess = isset($data['success']) && $data['success'] === true;

    // --- Prepare Content based on Success or Error ---
    $title = '';
    $headerClass = '';
    $contentHtml = '';

    if ($isSuccess) {
        $title = 'Authentication Complete';
        $headerClass = 'success';
        
        // Make it more informative
        $userName = isset($data['user']['name']) ? htmlspecialchars($data['user']['name'], ENT_QUOTES, 'UTF-8') : 'User';
        $userEmail = isset($data['user']['email']) ? htmlspecialchars($data['user']['email'], ENT_QUOTES, 'UTF-8') : 'your email';

        // NOTE: The doctor's message is slightly different (e.g., mentions approval)
        // I will keep the original text from the file you provided, just translated.
        $contentHtml = <<<HTML
        <p>Hello, <strong>$userName</strong> ($userEmail)!</p>
        <p>Your registration or login via Google was completed successfully.</p>
        <ul>
            <li>If this is your first time logging in, or if it doesn't connect automatically, please click "Forgot your password?" on the login panel to create a new password.</li>
            <li>You will receive an email to set your new password (your Google password remains unchanged).</li>
            <li>After setting your password, please log in to the panel using your email ($userEmail) and the new password.</li>
            </ul>
        <p class="note">This window will close automatically in 30 seconds. You can close it now by clicking the 'X' or the "Close Window" button.</p>
HTML;

    } else {
        $title = 'Authentication Error';
        $headerClass = 'error';
        
        // Make it more robust and informative
        $errorMessage = isset($data['error']) ? htmlspecialchars($data['error'], ENT_QUOTES, 'UTF-8') : 'An unknown error occurred.';
        $errorFile = isset($data['file']) ? htmlspecialchars($data['file'], ENT_QUOTES, 'UTF-8') : 'N/A';
        $errorLine = isset($data['line']) ? htmlspecialchars($data['line'], ENT_QUOTES, 'UTF-8') : 'N/A';

        $contentHtml = <<<HTML
        <p>A problem occurred while trying to authenticate your Google account. The login or registration could not be completed.</p>
        <div class="error-details">
            <strong>Message:</strong> $errorMessage
            </div>
        <p>Please try again. If the problem persists, please contact support.</p>
        <p class="note">This window will close automatically in 30 seconds. You can close it now by clicking the 'X' or the "Close Window" button.</p>
HTML;
    }
    // --- End of Content Preparation ---

    // --- Main HTML Structure ---
    echo <<<HTML
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            /* Classic, Minimalist, and Responsive Styles */
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

            :root {
                --color-success: #28a745;
                --color-success-bg: #f0f9f2;
                --color-error: #dc3545;
                --color-error-bg: #fdf0f1;
                --color-text: #333;
                --color-text-light: #555;
                --color-border: #eeeeee;
                --color-bg: #f4f4f4;
                --color-white: #ffffff;
                --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: 'Roboto', sans-serif;
                background-color: var(--color-bg);
                color: var(--color-text);
                line-height: 1.6;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px; /* Provides spacing on mobile */
            }

            .popup-box {
                background: var(--color-white);
                border-radius: 8px;
                box-shadow: var(--shadow);
                width: 100%;
                max-width: 550px; /* Horizontal limit */
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border-top: 4px solid var(--color-border);
            }

            .popup-box.success {
                border-top-color: var(--color-success);
            }
            
            .popup-box.error {
                border-top-color: var(--color-error);
            }

            .popup-header {
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid var(--color-border);
            }
            
            .popup-header.success {
                background-color: var(--color-success-bg);
            }

            .popup-header.error {
                background-color: var(--color-error-bg);
            }

            .popup-header h2 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 500;
            }

            .popup-header.success h2 {
                color: var(--color-success);
            }

            .popup-header.error h2 {
                color: var(--color-error);
            }

            .popup-close {
                background: transparent;
                border: none;
                font-size: 1.6rem;
                font-weight: 700;
                color: #aaa;
                cursor: pointer;
                line-height: 1;
                padding: 0;
                text-shadow: none;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .popup-close:hover {
                opacity: 1;
                color: #000;
            }

            .popup-content {
                padding: 24px;
                max-height: 60vh; /* Vertical limit */
                overflow-y: auto;
            }

            .popup-content p {
                margin-bottom: 16px;
            }

            .popup-content ul {
                margin-bottom: 20px;
                padding-left: 20px;
            }
            
            .popup-content ul li {
                margin-bottom: 8px;
            }

            .popup-content .note {
                font-size: 0.875rem;
                color: var(--color-text-light);
                margin-top: 20px;
                margin-bottom: 0;
            }
            
            .popup-content .error-details {
                background: var(--color-error-bg);
                border: 1px solid var(--color-error);
                color: var(--color-error);
                padding: 12px 16px;
                border-radius: 4px;
                font-family: 'Consolas', 'Roboto Mono', monospace;
                font-size: 0.9rem;
                margin-bottom: 16px;
                word-break: break-all;
            }

            .popup-footer {
                padding: 16px 24px;
                background-color: #f9f9f9;
                border-top: 1px solid var(--color-border);
                text-align: right;
            }
            
            .popup-close-btn {
                background-color: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .popup-close-btn:hover {
                 background-color: #5a6268;
            }
            
            /* Responsive */
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                    align-items: flex-start; /* Align to top on small screens */
                }
                .popup-box {
                    width: 100%;
                    max-width: none;
                    margin: 10px 0;
                }
                .popup-header {
                    padding: 12px 16px;
                }
                 .popup-header h2 {
                    font-size: 1.1rem;
                 }
                .popup-content {
                    padding: 16px;
                    max-height: 70vh;
                }
                .popup-footer {
                    padding: 12px 16px;
                }
            }

        </style>
    </head>
    <body>

        <div class="popup-box $headerClass">
            <div class="popup-header $headerClass">
                <h2>$title</h2>
                <button type="button" class="popup-close" aria-label="Close" title="Close">&times;</button>
            </div>
            <div class="popup-content">
                $contentHtml
            </div>
            <div class="popup-footer">
                <button type="button" class="popup-close-btn">Close Window</button>
            </div>
        </div>

        <script>
            try {
                // 1. Send message to parent window (Original Function)
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage($jsonData, window.opener.location.origin);
                }
                
                // 2. Auto-close after 30 seconds (Original Function)
                setTimeout(() => { window.close(); }, 30000);

                // 3. Add manual close functionality (New Feature)
                function closeWindow() {
                    window.close();
                }
                
                document.querySelector('.popup-close').addEventListener('click', closeWindow);
                document.querySelector('.popup-close-btn').addEventListener('click', closeWindow);
                
            } catch(e) { 
                // Fallback (Original Function)
                window.close(); 
            }
        </script>
    </body>
    </html>
HTML;
    exit();
}


try {
    if (!isset($_GET['code'])) {
        throw new Exception("Google authorization code not received.");
    }

    $client = new Google_Client();
    $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
    $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
    $redirectUri = trim($_ENV['GOOGLE_REDIRECT_URI_DOCTOR'], '"');
    $client->setRedirectUri($redirectUri);

    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    if (isset($token['error'])) {
        throw new Exception("Google error when getting token: " . ($token['error_description'] ?? 'Unknown error'));
    }
    $client->setAccessToken($token);

    $google_oauth = new Google_Service_Oauth2($client);
    $google_account_info = $google_oauth->userinfo->get();
    
    $email = $google_account_info->email;
    $fullName = $google_account_info->name;
    $pictureUrl = $google_account_info->picture;

    if (empty($email)) {
        throw new Exception("Could not get email from Google account.");
    }

    $stmt = $pdo->prepare("SELECT * FROM users_doctors WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $hasCustomPicture = $user['profile_picture_url'] && strpos($user['profile_picture_url'], 'http') !== 0;

        if (!$hasCustomPicture && $user['profile_picture_url'] !== $pictureUrl) {
            $updateStmt = $pdo->prepare("UPDATE users_doctors SET profile_picture_url = ? WHERE doctor_id = ?");
            $updateStmt->execute([$pictureUrl, $user['doctor_id']]);
        }
    } else {
        $insertStmt = $pdo->prepare(
            "INSERT INTO users_doctors (full_name, email, profile_picture_url, is_active, is_approved) VALUES (?, ?, ?, 1, 0)"
        );
        $insertStmt->execute([$fullName, $email, $pictureUrl]);
    }
    
    $finalUserStmt = $pdo->prepare("SELECT doctor_id, full_name, email, is_active FROM users_doctors WHERE email = ?");
    $finalUserStmt->execute([$email]);
    $dbUser = $finalUserStmt->fetch(PDO::FETCH_ASSOC);

    if (!$dbUser) {
        throw new Exception("Critical failure to get final doctor record.");
    }

    $jwtToken = generateJwtToken($dbUser['doctor_id'], 'doctor', $dbUser['email'], $_ENV['JWT_SECRET_KEY']);

    $userPayload = [
        "id" => (int)$dbUser['doctor_id'],
        "name" => $dbUser['full_name'],
        "email" => $dbUser['email'],
        "user_type" => "doctor",
        "is_active" => (bool)$dbUser['is_active']
    ];

    render_popup_script([
        'success' => true,
        'token' => $jwtToken,
        'user' => $userPayload
    ]);

} catch (Exception $e) {
    render_popup_script([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}