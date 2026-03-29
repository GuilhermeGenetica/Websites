<?php

function setCorsHeaders() {
    $allowedOrigins = [
        'https://medbooking.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: " . $origin);
        header("Access-Control-Allow-Credentials: true");
    } else {
        if ($origin) {
            error_log("CORS: Disallowed origin: " . $origin);
        }
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

function sendJsonResponse($data, $httpStatusCode = 200) {
    http_response_code($httpStatusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

function getBearerToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return $matches[1];
    }
    return null;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateJwtToken($userId, $userType, $email, $secretKey) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'user_type' => $userType,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60)
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    // CORREÇÃO APLICADA AQUI:
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secretKey, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function decodeJwtToken($jwt, $secretKey) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        error_log("JWT Error: Invalid token structure.");
        return false;
    }

    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

    $signature = str_replace(['-', '_'], ['+', '/'], $base64UrlSignature);
    $signature = base64_decode($signature);
    
    if ($signature === false) {
        error_log("JWT Error: Failed to decode signature.");
        return false;
    }

    $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secretKey, true);

    if (!hash_equals($expectedSignature, $signature)) {
        error_log("JWT Error: Signature verification failed.");
        return false;
    }

    $payload = str_replace(['-', '_'], ['+', '/'], $base64UrlPayload);
    $payload = base64_decode($payload);
    
    if ($payload === false) {
        error_log("JWT Error: Failed to decode payload.");
        return false;
    }
    
    $decodedPayload = json_decode($payload, true);
    
    if ($decodedPayload === null) {
        error_log("JWT Error: Failed to parse payload JSON.");
        return false;
    }

    if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
        error_log("JWT Error: Token has expired.");
        return false;
    }

    return $decodedPayload;
}