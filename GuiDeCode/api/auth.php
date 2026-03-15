<?php
require_once __DIR__ . '/config.php';
@include_once __DIR__ . '/../vendor/autoload.php';

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}

function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $base64Header  = base64UrlEncode($header);
    $base64Payload = base64UrlEncode(json_encode($payload));
    $signature     = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Sig     = base64UrlEncode($signature);
    return "$base64Header.$base64Payload.$base64Sig";
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$base64Header, $base64Payload, $base64Signature] = $parts;
    $signature         = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $expectedSignature = base64UrlEncode($signature);
    if (!hash_equals($expectedSignature, $base64Signature)) return null;
    $payload = json_decode(base64UrlDecode($base64Payload), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

function getAuthUser() {
    $headers    = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $customToken = $_SERVER['HTTP_X_WB_TOKEN'] ?? '';
    $urlToken = $_GET['token'] ?? '';
    
    if (!empty($customToken)) {
        return verifyJWT($customToken);
    }
    if (!empty($urlToken)) {
        return verifyJWT($urlToken);
    }
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return verifyJWT($matches[1]);
    }
    return null;
}

if (!function_exists('requireAuth')) {
    function requireAuth($requiredRole = null) {
        $user = getAuthUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(["error" => "Authentication required"]);
            exit();
        }
        if ($requiredRole && ($user['role'] ?? '') !== $requiredRole) {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient permissions"]);
            exit();
        }
        return $user;
    }
}

function requireSubscription() {
    $user = requireAuth();
    if ($user['role'] === 'admin') return $user;
    if (!empty($user['is_env_admin'])) return $user;
    
    $conn = getDBConnection();
    if (!$conn) {
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed"]);
        exit();
    }
    $stmt = $conn->prepare("SELECT subscription_active, subscription_type, subscription_expires FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();
    if (!$userData || !$userData['subscription_active'] ||
        ($userData['subscription_expires'] && strtotime($userData['subscription_expires']) < time())) {
        http_response_code(403);
        echo json_encode(["error" => "Active subscription required", "code" => "SUBSCRIPTION_REQUIRED"]);
        exit();
    }
    return $user;
}

function checkEnvAdmin($email, $password) {
    $envEmail = env('WB_ADMIN_EMAIL', '');
    $envPass  = env('WB_ADMIN_PASS', '');
    if (!$envEmail || !$envPass) return null;
    if ($email === $envEmail && $password === $envPass) {
        $token = generateJWT([
            'id'                  => 0,
            'email'               => $envEmail,
            'role'                => 'admin',
            'subscription_active' => true,
            'subscription_type'   => 'complete',
            'is_env_admin'        => true
        ]);
        return [
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'                      => 0,
                'email'                   => $envEmail,
                'full_name'               => 'System Administrator',
                'role'                    => 'admin',
                'is_admin'                => true,
                'subscription_active'     => true,
                'subscription_status'     => 'active',
                'subscription_type'       => 'complete',
                'subscription_expires_at' => null,
                'is_env_admin'            => true
            ]
        ];
    }
    return null;
}

function authCors() {
    $allowedOrigins = [
        env('VITE_SITE_URL', 'https://guilherme.onnetweb.com'),
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . $allowedOrigins[0]);
    }
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Wb-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');
}

if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    authCors();
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];

    switch ($action) {
        case 'register':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $email    = trim($body['email'] ?? '');
            $password = $body['password'] ?? '';
            $name     = trim($body['full_name'] ?? '');
            
            if (!$email || !$password || !$name) { http_response_code(400); echo json_encode(['error' => 'All fields required']); exit(); }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Invalid email']); exit(); }
            if (strlen($password) < 6) { http_response_code(400); echo json_encode(['error' => 'Password min 6 chars']); exit(); }
            
            try {
                $conn  = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }
                
                $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
                $check->execute([$email]);
                if ($check->fetch()) { http_response_code(409); echo json_encode(['error' => 'Email already registered']); exit(); }
                
                $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
                
                $stmt = $conn->prepare("INSERT INTO users (email, password, full_name, is_admin, subscription_active, subscription_type, subscription_expires, created_at) VALUES (?, ?, ?, 0, 0, 'free', NULL, NOW())");
                $stmt->execute([$email, $hash, $name]);
                
                $userId = $conn->lastInsertId();
                $token  = generateJWT(['id' => $userId, 'email' => $email, 'role' => 'user', 'subscription_active' => false, 'subscription_type' => 'free']);
                
                echo json_encode([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'                  => $userId,
                        'email'               => $email,
                        'full_name'           => $name,
                        'role'                => 'user',
                        'is_admin'            => false,
                        'subscription_active' => false,
                        'subscription_status' => 'free',
                        'subscription_type'   => 'free'
                    ]
                ]);
            } catch (Exception $e) { 
                http_response_code(500); 
                echo json_encode(['error' => 'DB error: ' . $e->getMessage()]); 
            }
            break;

        case 'login':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $email    = trim($body['email'] ?? '');
            $password = $body['password'] ?? '';
            
            if (!$email || !$password) { http_response_code(400); echo json_encode(['error' => 'Email and password required']); exit(); }

            $envResult = checkEnvAdmin($email, $password);
            if ($envResult) {
                echo json_encode($envResult);
                exit();
            }

            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                $stmt = $conn->prepare("SELECT id, email, full_name, password, is_admin, subscription_active, subscription_type, subscription_expires FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user || !password_verify($password, $user['password'])) {
                    http_response_code(401); echo json_encode(['error' => 'Invalid credentials']); exit();
                }

                if (password_needs_rehash($user['password'], PASSWORD_BCRYPT, ['cost' => 12])) {
                    $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
                    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                    $updateStmt->execute([$newHash, $user['id']]);
                }

                $subActive = $user['subscription_active'] &&
                             (!$user['subscription_expires'] || strtotime($user['subscription_expires']) > time());
                
                $role  = $user['is_admin'] ? 'admin' : 'user';
                $subType = $user['subscription_type'] ?? 'free';
                $token = generateJWT(['id' => $user['id'], 'email' => $user['email'], 'role' => $role, 'subscription_active' => $subActive, 'subscription_type' => $subType]);
                
                echo json_encode([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'                      => $user['id'],
                        'email'                   => $user['email'],
                        'full_name'               => $user['full_name'],
                        'role'                    => $role,
                        'is_admin'                => (bool)$user['is_admin'],
                        'subscription_active'     => $subActive,
                        'subscription_status'     => $user['subscription_active'] ? 'active' : 'free',
                        'subscription_type'       => $subType,
                        'subscription_expires_at' => $user['subscription_expires']
                    ]
                ]);
            } catch (Exception $e) { 
                http_response_code(500); 
                echo json_encode(['error' => 'DB error: ' . $e->getMessage()]); 
            }
            break;

        case 'getProfile':
        case 'profile':
            if ($method !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $payload = requireAuth();

            if (!empty($payload['is_env_admin'])) {
                echo json_encode([
                    'success' => true,
                    'user'    => [
                        'id'                      => 0,
                        'email'                   => $payload['email'],
                        'full_name'               => 'System Administrator',
                        'role'                    => 'admin',
                        'is_admin'                => true,
                        'subscription_active'     => true,
                        'subscription_status'     => 'active',
                        'subscription_type'       => 'complete',
                        'subscription_expires_at' => null,
                        'is_env_admin'            => true,
                        'created_at'              => date('Y-m-d H:i:s')
                    ]
                ]);
                exit();
            }

            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                $stmt = $conn->prepare("SELECT id, email, full_name, is_admin, subscription_active, subscription_type, subscription_expires, created_at FROM users WHERE id = ?");
                $stmt->execute([$payload['id']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$user) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit(); }
                
                $subActive = $user['subscription_active'] &&
                             (!$user['subscription_expires'] || strtotime($user['subscription_expires']) > time());
                echo json_encode([
                    'success' => true,
                    'user'    => [
                        'id'                      => $user['id'],
                        'email'                   => $user['email'],
                        'full_name'               => $user['full_name'],
                        'role'                    => $user['is_admin'] ? 'admin' : 'user',
                        'is_admin'                => (bool)$user['is_admin'],
                        'subscription_active'     => $subActive,
                        'subscription_status'     => $user['subscription_active'] ? 'active' : 'free',
                        'subscription_type'       => $user['subscription_type'] ?? 'free',
                        'subscription_expires_at' => $user['subscription_expires'],
                        'created_at'              => $user['created_at']
                    ]
                ]);
            } catch (Exception $e) { http_response_code(500); echo json_encode(['error' => 'DB error: ' . $e->getMessage()]); }
            break;

        case 'updateProfile':
        case 'update_profile':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $payload  = requireAuth();
            if (!empty($payload['is_env_admin'])) {
                echo json_encode(['success' => true, 'message' => 'Env admin profile cannot be updated']);
                exit();
            }
            $name     = trim($body['full_name'] ?? '');
            $password = $body['password'] ?? '';
            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                if ($name) {
                    $conn->prepare("UPDATE users SET full_name = ? WHERE id = ?")->execute([$name, $payload['id']]);
                }
                if ($password) {
                    if (strlen($password) < 6) { http_response_code(400); echo json_encode(['error' => 'Password min 6 chars']); exit(); }
                    $conn->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]), $payload['id']]);
                }
                echo json_encode(['success' => true, 'message' => 'Profile updated']);
            } catch (Exception $e) { http_response_code(500); echo json_encode(['error' => 'DB error: ' . $e->getMessage()]); }
            break;

        case 'checkSubscription':
        case 'check_subscription':
            if ($method !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $payload = requireAuth();
            if (!empty($payload['is_env_admin'])) {
                echo json_encode(['success' => true, 'active' => true, 'status' => 'active', 'type' => 'complete']);
                exit();
            }
            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                $stmt = $conn->prepare("SELECT subscription_active, subscription_type, subscription_expires FROM users WHERE id = ?");
                $stmt->execute([$payload['id']]);
                $user   = $stmt->fetch(PDO::FETCH_ASSOC);
                $active = $user &&
                          $user['subscription_active'] &&
                          (!$user['subscription_expires'] || strtotime($user['subscription_expires']) > time());
                echo json_encode(['success' => true, 'active' => $active, 'status' => ($user['subscription_active'] ?? 0) ? 'active' : 'free', 'type' => $user['subscription_type'] ?? 'free']);
            } catch (Exception $e) { http_response_code(500); echo json_encode(['error' => 'DB error: ' . $e->getMessage()]); }
            break;

        case 'createCheckout':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $payload = requireAuth();
            $plan = $body['plan'] ?? 'basic';
            $priceId = $plan === 'complete' ? env('STRIPE_PRICE_COMPLETE', '') : env('STRIPE_PRICE_BASIC', '');
            if (!$priceId || strpos($priceId, 'placeholder') !== false) {
                echo json_encode(['success' => false, 'error' => 'Stripe not yet configured. Contact the administrator.']);
                exit();
            }
            $stripeSecret = env('STRIPE_SECRET_KEY', '');
            if (!$stripeSecret || strpos($stripeSecret, 'placeholder') !== false) {
                echo json_encode(['success' => false, 'error' => 'Stripe not yet configured. Contact the administrator.']);
                exit();
            }
            try {
                $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_USERPWD => $stripeSecret . ':',
                    CURLOPT_POSTFIELDS => http_build_query([
                        'payment_method_types[]' => 'card',
                        'line_items[0][price]' => $priceId,
                        'line_items[0][quantity]' => 1,
                        'mode' => 'subscription',
                        'success_url' => env('VITE_SITE_URL') . '/workbench/login?session_id={CHECKOUT_SESSION_ID}&status=success',
                        'cancel_url' => env('VITE_SITE_URL') . '/workbench/login?status=cancelled',
                        'client_reference_id' => $payload['id'] ?? 0,
                        'metadata[plan]' => $plan,
                        'metadata[user_id]' => $payload['id'] ?? 0,
                    ])
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                $session = json_decode($response, true);
                if ($httpCode >= 200 && $httpCode < 300 && isset($session['url'])) {
                    echo json_encode(['success' => true, 'url' => $session['url'], 'session_id' => $session['id']]);
                } else {
                    echo json_encode(['success' => false, 'error' => $session['error']['message'] ?? 'Stripe session creation failed']);
                }
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Stripe error: ' . $e->getMessage()]);
            }
            break;

        case 'cancelSubscription':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            $payload = requireAuth();
            $reason = trim($body['reason'] ?? 'User requested cancellation');

            try {
                $conn = getDBConnection();
                $stmt = $conn->prepare("SELECT id, email, full_name FROM users WHERE id = ?");
                $stmt->execute([$payload['id']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) { 
                    echo json_encode(['success' => false, 'error' => 'User not found']); 
                    exit(); 
                }

                $stripeSecret = env('STRIPE_SECRET_KEY', '');
                if ($stripeSecret && class_exists('\Stripe\Stripe')) {
                    \Stripe\Stripe::setApiKey($stripeSecret);
                    try {
                        $customers = \Stripe\Customer::all(['email' => $user['email'], 'limit' => 1]);
                        if (count($customers->data) > 0) {
                            $customerId = $customers->data[0]->id;
                            $subscriptions = \Stripe\Subscription::all(['customer' => $customerId, 'status' => 'active']);
                            foreach ($subscriptions->data as $sub) {
                                $sub->cancel();
                            }
                        }
                    } catch (Exception $se) {
                        error_log("Stripe API Cancel Error: " . $se->getMessage());
                    }
                }

                $conn->prepare("UPDATE users SET subscription_active = 0, subscription_expires = NULL, updated_at = NOW() WHERE id = ?")->execute([$user['id']]);

                $to = $user['email'];
                $subject = "Subscription Cancelled - Guilherme WorkBench";
                $message = "Hello " . $user['full_name'] . ",\n\nWe confirm that your subscription has been successfully cancelled.\n\nThank you for having been part of our platform. We hope to see you again in the future!\n\nReason recorded: " . $reason . "\n\nBest regards,\nGuideLines Team";
                $headers = "From: noreply@onnetweb.com\r\n";
                mail($to, $subject, $message, $headers);

                $adminEmail = env('WB_ADMIN_EMAIL', 'admin@onnetweb.com');
                $adminSubject = "User Cancelled Subscription";
                $adminMessage = "The user " . $user['full_name'] . " (" . $user['email'] . ") has cancelled their subscription.\nReason: " . $reason;
                mail($adminEmail, $adminSubject, $adminMessage, $headers);

                echo json_encode(['success' => true, 'message' => 'Subscription cancelled successfully. A confirmation email has been sent.']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Cancellation failed: ' . $e->getMessage()]);
            }
            break;

        case 'stripeWebhook':
            $sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
            $webhookSecret = env('STRIPE_WEBHOOK_SECRET', '');
            $rawBody = file_get_contents('php://input');
            echo json_encode(['success' => true, 'message' => 'Webhook received']);
            break;

        case 'forgotPassword':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            
            $email = trim($body['email'] ?? '');
            if (!$email) { http_response_code(400); echo json_encode(['error' => 'Email required']); exit(); }

            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                $stmt = $conn->prepare("SELECT id, full_name FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    $token = bin2hex(random_bytes(32));
                    $expires = date('Y-m-d H:i:s', time() + 3600);

                    $stmt = $conn->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?");
                    $stmt->execute([$token, $expires, $user['id']]);

                    $resetLink = env('VITE_SITE_URL', 'https://guilherme.onnetweb.com') . "/reset-password?token=" . $token;

                    $to = $email;
                    $subject = "Password Reset Request - Guilherme WorkBench";
                    $message = "Hello " . $user['full_name'] . ",\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n" . $resetLink . "\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.";
                    $headers = "From: noreply@onnetweb.com\r\n";

                    mail($to, $subject, $message, $headers);
                }
                echo json_encode(['success' => true, 'message' => 'If this email exists, a reset link has been sent.']);
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(['error' => 'DB error: ' . $e->getMessage()]);
            }
            break;

        case 'resetPassword':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }
            
            $token = trim($body['token'] ?? '');
            $newPassword = trim($body['password'] ?? '');

            if (!$token || !$newPassword) { http_response_code(400); echo json_encode(['error' => 'Missing data']); exit(); }

            try {
                $conn = getDBConnection();
                if (!$conn) { http_response_code(500); echo json_encode(['error' => 'Database connection failed']); exit(); }

                $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()");
                $stmt->execute([$token]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
                    $stmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
                    if ($stmt->execute([$hashedPassword, $user['id']])) {
                        echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
                    } else {
                        http_response_code(500); echo json_encode(['error' => 'Database error']);
                    }
                } else {
                    http_response_code(400); echo json_encode(['error' => 'Invalid or expired token.']);
                }
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(['error' => 'DB error: ' . $e->getMessage()]);
            }
            break;

        case 'logout':
            echo json_encode(['success' => true, 'message' => 'Logged out']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action: ' . $action]);
    }
}
?>