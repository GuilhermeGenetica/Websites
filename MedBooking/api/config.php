<?php

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

// Initial error reporting (to catch errors in this file itself)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$autoload_path = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload_path)) {
    http_response_code(500);
    die(json_encode([
        "success" => false, 
        "message" => "FATAL ERROR: autoload.php not found at the expected path: " . realpath(dirname($autoload_path))
    ]));
}

require_once $autoload_path;

use Dotenv\Dotenv;

try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (\Exception $e) {
    error_log("Error loading .env: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Server configuration error: Could not load .env file. Details: " . $e->getMessage()]));
}

// --- Debugging System (Improvement) ---
// This will read the APP_DEBUG variable from your .env file.
// If APP_DEBUG=true, errors will be displayed (for development).
// If APP_DEBUG=false or not set, errors will be hidden and logged (for production).
$isDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';

if ($isDebug) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/debug.log'); // Errors will be saved here
}
// --- End Debugging System ---

$dbHost = $_ENV['DB_HOST'] ?? '';
$dbName = $_ENV['DB_NAME'] ?? '';
$dbUser = $_ENV['DB_USER'] ?? '';
$dbPass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Error connecting to the database: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Database connection error. Details: " . $e->getMessage()]));
}

$_ENV['APP_URL'] = $_ENV['APP_URL'] ?? null;

$_ENV['STRIPE_SECRET_KEY'] = $_ENV['STRIPE_SECRET_KEY'] ?? null;
$_ENV['STRIPE_PUBLIC_KEY'] = $_ENV['STRIPE_PUBLIC_KEY'] ?? null;
$_ENV['STRIPE_CONSULTATION_PRODUCT_ID'] = $_ENV['STRIPE_CONSULTATION_PRODUCT_ID'] ?? null;
$_ENV['STRIPE_CONSULTATION_PRICE_ID'] = $_ENV['STRIPE_CONSULTATION_PRICE_ID'] ?? null;
$_ENV['STRIPE_WEBHOOK_SECRET'] = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? null;

$_ENV['MAIL_HOST'] = $_ENV['MAIL_HOST'] ?? null;
$_ENV['MAIL_PORT'] = $_ENV['MAIL_PORT'] ?? null;
$_ENV['MAIL_USERNAME'] = $_ENV['MAIL_USERNAME'] ?? null;
$_ENV['MAIL_PASSWORD'] = $_ENV['MAIL_PASSWORD'] ?? null;
$_ENV['MAIL_FROM_NAME'] = $_ENV['MAIL_FROM_NAME'] ?? null;
?>