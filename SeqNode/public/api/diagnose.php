<?php
/**
 * SeqNode-OS — API Diagnostic Tool
 * Access: https://seqnode.onnetweb.com/api/diagnose.php
 * DELETE THIS FILE after fixing all issues.
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SeqNode API Diagnostics</title>
<style>
  body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 20px; }
  h1   { color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 8px; }
  h2   { color: #94a3b8; margin-top: 28px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
  .ok  { color: #4ade80; }
  .err { color: #f87171; }
  .wrn { color: #fbbf24; }
  .inf { color: #60a5fa; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  td, th { padding: 5px 10px; border: 1px solid #1e293b; text-align: left; font-size: 13px; }
  th { background: #1e293b; color: #94a3b8; }
  pre { background: #1e293b; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto; }
  .section { background: #1e293b; border-radius: 6px; padding: 12px 16px; margin-top: 12px; }
</style>
</head>
<body>
<h1>&#x1F9EC; SeqNode-OS — API Diagnostic</h1>
<p style="color:#64748b;font-size:12px">Generated: <?= date('Y-m-d H:i:s T') ?> | DELETE this file after use.</p>

<?php

function row(string $label, mixed $value, string $status = 'inf'): void {
    echo "<tr><td style='width:220px;color:#94a3b8'>$label</td><td class='$status'>$value</td></tr>";
}

function check(bool $cond, string $ok, string $fail): string {
    return $cond ? "<span class='ok'>&#x2713; $ok</span>" : "<span class='err'>&#x2717; $fail</span>";
}

// ── 1. PHP & Server ──────────────────────────────────────────────────────────
echo "<h2>1 — PHP &amp; Server</h2><div class='section'><table>";
row('PHP Version',       PHP_VERSION, version_compare(PHP_VERSION, '8.0', '>=') ? 'ok' : 'err');
row('SAPI',              php_sapi_name());
row('Server Software',   $_SERVER['SERVER_SOFTWARE'] ?? 'unknown');
row('Document Root',     $_SERVER['DOCUMENT_ROOT']   ?? 'unknown');
row('Script Path',       __FILE__);
row('REQUEST_URI',       $_SERVER['REQUEST_URI']      ?? 'unknown');
row('HTTP Host',         $_SERVER['HTTP_HOST']        ?? 'unknown');
row('HTTPS',             (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'yes' : 'no');
echo "</table></div>";

// ── 2. Extensions ────────────────────────────────────────────────────────────
echo "<h2>2 — Required PHP Extensions</h2><div class='section'><table>";
$exts = ['pdo', 'pdo_mysql', 'json', 'openssl', 'mbstring', 'curl', 'fileinfo'];
foreach ($exts as $ext) {
    $loaded = extension_loaded($ext);
    row($ext, $loaded ? 'loaded' : 'MISSING', $loaded ? 'ok' : 'err');
}
echo "</table></div>";

// ── 3. File Structure ────────────────────────────────────────────────────────
echo "<h2>3 — File Structure</h2><div class='section'><table>";
$dir   = __DIR__;
$files = [
    '.env', '.htaccess', 'composer.json', 'index.php',
    'Env.php', 'Database.php', 'Response.php', 'JWT.php',
    'Validator.php', 'Auth.php', 'Mailer.php',
    'AuthController.php', 'UserController.php', 'AdminController.php',
    'schema.sql', 'vendor/autoload.php',
];
foreach ($files as $f) {
    $path   = $dir . '/' . $f;
    $exists = file_exists($path);
    $size   = $exists ? filesize($path) . ' bytes' : '—';
    row($f, $exists ? "exists ($size)" : 'MISSING', $exists ? 'ok' : 'err');
}
echo "</table></div>";

// ── 4. .env Loading ──────────────────────────────────────────────────────────
echo "<h2>4 — .env File</h2><div class='section'><table>";
$envPath = $dir . '/.env';
if (!file_exists($envPath)) {
    echo "<tr><td colspan='2' class='err'>&#x2717; .env file NOT FOUND at $envPath</td></tr>";
} else {
    // Parse manually (safe read)
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envKeys = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$k] = explode('=', $line, 2);
            $envKeys[] = trim($k);
        }
    }
    $required = ['APP_ENV','APP_URL','DB_HOST','DB_NAME','DB_USER','DB_PASS',
                 'JWT_SECRET','MAIL_HOST','MAIL_USERNAME'];
    foreach ($required as $k) {
        $found = in_array($k, $envKeys, true);
        // Show value only for non-sensitive keys
        $sensitive = in_array($k, ['DB_PASS','JWT_SECRET','MAIL_PASSWORD','APP_KEY'], true);
        $display   = $found ? ($sensitive ? '***hidden***' : '[set]') : 'MISSING';
        row($k, $display, $found ? 'ok' : 'err');
    }
    row('.env line count', count($lines) . ' lines');
}
echo "</table></div>";

// ── 5. Database Connection ───────────────────────────────────────────────────
echo "<h2>5 — Database Connection</h2><div class='section'><table>";
try {
    // Load env manually for this test
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $_ENV[trim($k)] = trim($v, " \t\"'");
            }
        }
    }

    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $name = $_ENV['DB_NAME'] ?? '';
    $user = $_ENV['DB_USER'] ?? '';
    $pass = $_ENV['DB_PASS'] ?? '';

    row('DB_HOST', $host);
    row('DB_PORT', $port);
    row('DB_NAME', $name ?: '<empty>', $name ? 'ok' : 'err');
    row('DB_USER', $user ?: '<empty>', $user ? 'ok' : 'err');
    row('DB_PASS', $pass ? '***set***' : '<empty>', $pass ? 'ok' : 'err');

    if ($name && $user) {
        $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        row('Connection', 'SUCCESS', 'ok');
        row('MySQL Version', $pdo->query('SELECT VERSION()')->fetchColumn(), 'ok');

        // Check tables
        $tables = ['users','refresh_tokens','email_verifications','password_resets','login_attempts'];
        $existing = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $t) {
            $exists = in_array($t, $existing, true);
            row("Table: $t", $exists ? 'exists' : 'MISSING — run schema.sql', $exists ? 'ok' : 'err');
        }

        // Count users if table exists
        if (in_array('users', $existing, true)) {
            $cnt = $pdo->query("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")->fetchColumn();
            row('Total users', $cnt);
        }
    } else {
        row('Connection', 'SKIPPED — DB_NAME or DB_USER missing in .env', 'err');
    }
} catch (PDOException $e) {
    row('Connection', 'FAILED: ' . $e->getMessage(), 'err');
}
echo "</table></div>";

// ── 6. mod_rewrite / URL Routing ─────────────────────────────────────────────
echo "<h2>6 — URL Rewriting</h2><div class='section'><table>";
$apacheModules = function_exists('apache_get_modules') ? apache_get_modules() : [];
$rewriteLoaded = in_array('mod_rewrite', $apacheModules, true);

if (!empty($apacheModules)) {
    row('mod_rewrite', $rewriteLoaded ? 'enabled' : 'NOT loaded', $rewriteLoaded ? 'ok' : 'err');
} else {
    row('mod_rewrite', 'Cannot detect (apache_get_modules not available — normal on some setups)', 'wrn');
}

$htaccess = $dir . '/.htaccess';
$htContent = file_exists($htaccess) ? file_get_contents($htaccess) : '';
row('.htaccess exists',         file_exists($htaccess) ? 'yes' : 'MISSING', file_exists($htaccess) ? 'ok' : 'err');
row('RewriteEngine On',         str_contains($htContent, 'RewriteEngine On') ? 'found' : 'NOT found',
    str_contains($htContent, 'RewriteEngine On') ? 'ok' : 'err');
row('RewriteBase /api/',        str_contains($htContent, 'RewriteBase /api/') ? 'found' : 'NOT found',
    str_contains($htContent, 'RewriteBase /api/') ? 'ok' : 'wrn');
row('RewriteRule → index.php',  str_contains($htContent, 'index.php') ? 'found' : 'NOT found',
    str_contains($htContent, 'index.php') ? 'ok' : 'err');

// Test if index.php is reachable as a direct include
row('index.php readable',       is_readable($dir . '/index.php') ? 'yes' : 'NO', is_readable($dir . '/index.php') ? 'ok' : 'err');

// Show current request routing info
row('Current REQUEST_URI',      $_SERVER['REQUEST_URI'] ?? 'unknown');
row('SCRIPT_NAME',              $_SERVER['SCRIPT_NAME'] ?? 'unknown');
row('PATH_INFO',                $_SERVER['PATH_INFO']   ?? '(none)');
echo "</table></div>";

// ── 7. CORS & Headers ────────────────────────────────────────────────────────
echo "<h2>7 — Incoming Request Headers</h2><div class='section'><table>";
$relevantHeaders = ['HTTP_ORIGIN','HTTP_AUTHORIZATION','HTTP_CONTENT_TYPE',
                    'HTTP_HOST','HTTP_USER_AGENT','REQUEST_METHOD','SERVER_PROTOCOL'];
foreach ($relevantHeaders as $h) {
    if (isset($_SERVER[$h])) row($h, htmlspecialchars($_SERVER[$h]));
}
echo "</table></div>";

// ── 8. Composer / PHPMailer ──────────────────────────────────────────────────
echo "<h2>8 — Composer &amp; PHPMailer</h2><div class='section'><table>";
$autoload   = $dir . '/vendor/autoload.php';
$composerLock = $dir . '/composer.lock';
row('vendor/autoload.php', file_exists($autoload) ? 'exists' : 'MISSING — run: composer install', file_exists($autoload) ? 'ok' : 'err');
row('composer.lock',       file_exists($composerLock) ? 'exists' : 'not found', file_exists($composerLock) ? 'ok' : 'wrn');

if (file_exists($autoload)) {
    require_once $autoload;
    $hasMailer = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
    row('PHPMailer class', $hasMailer ? 'loaded' : 'NOT found after autoload', $hasMailer ? 'ok' : 'err');
}
echo "</table></div>";

// ── 9. Write Permissions ─────────────────────────────────────────────────────
echo "<h2>9 — Permissions</h2><div class='section'><table>";
row('api/ directory readable', is_readable($dir)   ? 'yes' : 'no', is_readable($dir) ? 'ok' : 'err');
row('api/ directory writable', is_writable($dir)   ? 'yes' : 'no (ok for prod)');
row('.env readable',           is_readable($envPath) ? 'yes' : 'NO', is_readable($envPath) ? 'ok' : 'err');
echo "</table></div>";

// ── 10. Quick Route Simulation ───────────────────────────────────────────────
echo "<h2>10 — Route Simulation</h2><div class='section'>";
echo "<p style='color:#64748b;font-size:12px'>Simulates what index.php would receive for a real API call.</p>";
$testUri = '/auth/login';
$simUri  = preg_replace('#^/api#', '', '/api' . $testUri);
$simUri  = rtrim($simUri, '/') ?: '/';
echo "<table>";
row('Input URI', '/api' . $testUri);
row('After strip /api', $simUri);
row('Expected match', '$uri === \'/auth/login\'');
row('Would match?', ($simUri === '/auth/login') ? 'YES' : 'NO — routing broken!',
    ($simUri === '/auth/login') ? 'ok' : 'err');
echo "</table>";

// Test actual URL structure
echo "<p style='margin-top:10px;font-size:13px;color:#94a3b8'>Test these URLs in your browser (expect JSON, not 404):</p><ul style='font-size:13px;color:#60a5fa'>";
$base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
      . '://' . ($_SERVER['HTTP_HOST'] ?? 'seqnode.onnetweb.com') . '/api';
echo "<li><a href='$base/health' style='color:#60a5fa' target='_blank'>$base/health</a> &nbsp; ← should return JSON {success:true}</li>";
echo "<li><a href='$base/auth/login' style='color:#60a5fa' target='_blank'>$base/auth/login</a> &nbsp; ← GET should return 404 route (POST required)</li>";
echo "</ul>";
echo "</div>";
?>

<p style="margin-top:30px;color:#ef4444;font-weight:bold;font-size:13px">
  &#x26A0; Security reminder: delete this file once diagnostics are complete.<br>
  <code>public_html/api/diagnose.php</code>
</p>
</body>
</html>
