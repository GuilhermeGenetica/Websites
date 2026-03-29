<?php
// /api/config.php
// Production-ready configuration file. Includes fixes for .env parsing and robust error handling.
// ** FIX: Updated get_env_var() to strip quotes, comments, and whitespace from any source (hPanel or .env) **

// --- Error Reporting & Diagnostics ---
// In a production environment, errors should be logged, not displayed.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error.log'); // Log to the project root
error_reporting(E_ALL);

// --- Environment Variable Loading Function ---
// This function will be used to safely load and clean variables.
function load_env_variables() {
    try {
        $envPath = __DIR__ . '/.env';
        if (!file_exists($envPath)) {
            throw new Exception("FATAL: .env file not found at expected path: {$envPath}.");
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) {
                continue;
            }

            // Stop at the first comment character on a line
            if (strpos($line, '#') !== false) {
                $line = substr($line, 0, strpos($line, '#'));
            }
            
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // FIX: Strip surrounding quotes (single or double) from the value.
            if (preg_match('/^"(.*)"$/', $value, $matches) || preg_match("/^'(.*)'$/", $value, $matches)) {
                $value = $matches[1];
            }

            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        log_error($e->getMessage(), __FILE__, __LINE__);
        echo json_encode(['error' => 'Server configuration error.']);
        exit();
    }
}

// Execute the function to load environment variables
load_env_variables();

// --- Autoloader ---
// Loads all Composer packages like Google API Client and JWT.
require_once __DIR__ . '/../vendor/autoload.php';

// --- CORS Headers ---
$allowed_origin = get_env_var('APP_URL');
if (isset($_SERVER['HTTP_ORIGIN'])) {
     if (in_array($_SERVER['HTTP_ORIGIN'], ['http://localhost:3000', $allowed_origin], true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    }
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

// --- Helper Functions ---

/**
 * Gets an environment variable, trims whitespace, and strips comments/quotes.
 * This makes it resilient to values injected by server panels (like hPanel).
 */
function get_env_var($name, $default = null) {
    $value = getenv($name);
    
    if ($value === false) {
        return $default;
    }
    
    // 1. Remove inline comments (if any)
    if (strpos($value, '#') !== false) {
        $value = substr($value, 0, strpos($value, '#'));
    }
    
    // 2. Trim whitespace from start and end
    $value = trim($value);

    // 3. Strip surrounding quotes (single or double)
    if (preg_match('/^"(.*)"$/', $value, $matches) || preg_match("/^'(.*)'$/", $value, $matches)) {
        $value = $matches[1];
    }
    
    return $value;
}

function json_response($data, $status_code = 200) {
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($data);
    exit();
}

function log_error($message, $file, $line, $context = null) {
    $log_message = sprintf(
        "[%s] in %s on line %d: %s\nContext: %s\n",
        date('Y-m-d H:i:s'),
        basename($file),
        $line,
        $message,
        $context ? json_encode($context) : 'N/A'
    );
    error_log($log_message, 3, __DIR__ . '/../error.log');
}

// --- Exception and Shutdown Handlers ---
function handle_exception(Throwable $e) {
    log_error($e->getMessage(), $e->getFile(), $e->getLine());
    if (!headers_sent()) {
        json_response(['error' => 'An internal server error has occurred.'], 500);
    }
}

function handle_shutdown() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        log_error($error['message'], $error['file'], $error['line'], ['type' => 'FATAL']);
        if (!headers_sent()) {
            json_response(['error' => 'A fatal server error occurred.'], 500);
        }
    }
}

set_exception_handler('handle_exception');
register_shutdown_function('handle_shutdown');

// --- Database Connection ---
$pdo = null;
try {
    $db_host = get_env_var('DB_HOST');
    $db_name = get_env_var('DB_NAME');
    $db_user = get_env_var('DB_USER');
    $db_pass = get_env_var('DB_PASS');
    if (!$db_host || !$db_name || !$db_user) {
        throw new Exception("Database configuration is incomplete.");
    }

    $dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (Exception $e) {
    log_error($e->getMessage(), __FILE__, __LINE__);
    json_response(['error' => 'Could not connect to the database service.'], 503);
}

// --- Define Constants ---
define('JWT_SECRET', get_env_var('JWT_SECRET', 'change_this_in_your_env_file'));
?>
