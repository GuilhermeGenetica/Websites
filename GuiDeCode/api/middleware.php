<?php
require_once __DIR__ . '/config.php';

// FUNÇÕES BASE64 URL-SAFE (Iguais às do auth.php)
if (!function_exists('base64UrlEncode')) {
    function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}

if (!function_exists('base64UrlDecode')) {
    function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}

function handleCors() {
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

    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Wb-Token");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=UTF-8");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function cors() {
    handleCors();
}

function generateJwt($payload) {
    $secret = env('JWT_SECRET', 'gw_jwt_secret_key_2024_s3cur3_r4nd0m');
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + (86400 * 7);
    $payloadEncoded = base64UrlEncode(json_encode($payload));
    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$payloadEncoded", $secret, true));
    return "$header.$payloadEncoded.$signature";
}

function verifyJwt($token) {
    $secret = env('JWT_SECRET', 'gw_jwt_secret_key_2024_s3cur3_r4nd0m');
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;
    
    // Agora valida usando o algoritmo URL-Safe idêntico ao auth.php
    $expectedSig = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));

    if (!hash_equals($expectedSig, $signature)) return null;

    $data = json_decode(base64UrlDecode($payload), true);
    if (!$data) return null;
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

function requireAuth() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $customToken = $_SERVER['HTTP_X_WB_TOKEN'] ?? '';
    $urlToken = $_GET['token'] ?? '';

    // 1. Tenta o nosso cabeçalho customizado seguro
    if (!empty($customToken)) {
        $decoded = verifyJwt($customToken);
        if ($decoded && (isset($decoded['user_id']) || isset($decoded['id']))) {
            return $decoded;
        }
    }

    // 2. Tenta obter o token via URL (necessário para downloads diretos)
    if (!empty($urlToken)) {
        $decoded = verifyJwt($urlToken);
        if ($decoded && (isset($decoded['user_id']) || isset($decoded['id']))) {
            return $decoded;
        }
    }

    // 3. Fallback original
    if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        $decoded = verifyJwt($matches[1]);
        if ($decoded && (isset($decoded['user_id']) || isset($decoded['id']))) {
            return $decoded;
        }
    }
    
    jsonError('Unauthorized', 401);
}

function optionalAuth() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $customToken = $_SERVER['HTTP_X_WB_TOKEN'] ?? '';
    $urlToken = $_GET['token'] ?? '';

    if (!empty($customToken)) {
        return verifyJwt($customToken);
    }
    if (!empty($urlToken)) {
        return verifyJwt($urlToken);
    }
    if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        return verifyJwt($matches[1]);
    }
    return null;
}

function rateLimit($key, $maxRequests = 60, $windowSeconds = 60) {
    $file = sys_get_temp_dir() . '/rate_' . md5($key) . '.json';
    $now = time();
    $data = [];

    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
    }

    $data = array_filter($data, function($timestamp) use ($now, $windowSeconds) {
        return $timestamp > ($now - $windowSeconds);
    });

    if (count($data) >= $maxRequests) {
        jsonError('Too many requests', 429);
    }

    $data[] = $now;
    file_put_contents($file, json_encode($data));
}