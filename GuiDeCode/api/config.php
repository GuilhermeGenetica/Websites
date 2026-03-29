<?php
$envFile = dirname(__DIR__) . '/.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim(trim($value), "\"'");
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

if (!function_exists('env')) {
    function env($key, $default = null) {
        if (array_key_exists($key, $_ENV)) return $_ENV[$key];
        if (array_key_exists($key, $_SERVER)) return $_SERVER[$key];
        $val = getenv($key);
        return $val !== false ? $val : $default;
    }
}

define('JWT_SECRET', env('JWT_SECRET', 'change_this_in_your_env_file'));
define('JWT_EXPIRY', 86400 * 7);
define('UPLOAD_DIR', dirname(__DIR__) . '/' . env('UPLOAD_DIR', 'uploads') . '/');
define('FILEXPLORER_DIR', dirname(__DIR__) . '/' . env('FILEXPLORER_DIR', 'filexplorer'));

if (!function_exists('getDbConnection')) {
    function getDbConnection() {
        static $pdo = null;
        if ($pdo === null) {
            $host = env('DB_HOST', 'localhost');
            $dbname = env('DB_NAME');
            $user = env('DB_USER');
            $pass = env('DB_PASS');
            if (!$dbname || !$user) {
                return null;
            }
            try {
                $pdo = new PDO(
                    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                    $user,
                    $pass,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $e) {
                if (function_exists('jsonError')) {
                    jsonError('Database connection failed: ' . $e->getMessage(), 500);
                }
                return null;
            }
        }
        return $pdo;
    }
}

if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        return getDbConnection();
    }
}

if (!function_exists('getDbGeneticsConnection')) {
    function getDbGeneticsConnection() {
        static $pdo2 = null;
        if ($pdo2 === null) {
            $host = env('DB_GENETICS_HOST', 'localhost');
            $dbname = env('DB_GENETICS_NAME');
            $user = env('DB_GENETICS_USER');
            $pass = env('DB_GENETICS_PASS');
            if (!$dbname || !$user) {
                return null;
            }
            try {
                $pdo2 = new PDO(
                    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                    $user,
                    $pass,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $e) {
                if (function_exists('jsonError')) {
                    jsonError('Genetics database connection failed', 500);
                }
                return null;
            }
        }
        return $pdo2;
    }
}

if (!function_exists('getDB2Connection')) {
    function getDB2Connection() {
        return getDbGeneticsConnection();
    }
}

$conn = null;
try {
    $conn = getDbConnection();
} catch (Exception $e) {
    $conn = null;
}

if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!function_exists('sendJson')) {
    function sendJson($data, $statusCode = 200) {
        jsonResponse($data, $statusCode);
    }
}

if (!function_exists('jsonSuccess')) {
    function jsonSuccess($message, $data = []) {
        jsonResponse(array_merge(['success' => true, 'message' => $message], $data));
    }
}

if (!function_exists('jsonError')) {
    function jsonError($message, $statusCode = 400) {
        jsonResponse(['success' => false, 'error' => $message], $statusCode);
    }
}

if (!function_exists('sanitize')) {
    function sanitize($value) {
        if (is_string($value)) {
            return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        }
        return $value;
    }
}
?>