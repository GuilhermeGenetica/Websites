<?php

declare(strict_types=1);

define('ROOT',  __DIR__);
define('START', microtime(true));

// Load environment
require_once ROOT . '/Env.php';
Env::load(ROOT . '/.env');

// Load all classes (flat structure)
foreach ([
    ROOT . '/Database.php',
    ROOT . '/Response.php',
    ROOT . '/JWT.php',
    ROOT . '/Validator.php',
    ROOT . '/Auth.php',
    ROOT . '/AuthController.php',
    ROOT . '/UserController.php',
    ROOT . '/AdminController.php',
    ROOT . '/PluginReader.php',
    ROOT . '/VpsProxy.php',
    ROOT . '/UserSettingsController.php',
] as $file) {
    require_once $file;
}

// PHPMailer via Composer
if (file_exists(ROOT . '/vendor/autoload.php')) {
    require_once ROOT . '/vendor/autoload.php';
}

require_once ROOT . '/Mailer.php';

// ── CORS ──────────────────────────────────────────────────────────────────────
$allowedOrigins = array_map('trim', explode(',', Env::get('CORS_ALLOWED_ORIGINS', '*')));
$origin         = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array('*', $allowedOrigins, true) || in_array($origin, $allowedOrigins, true)) {
    $o = in_array('*', $allowedOrigins, true) ? '*' : $origin;
    header("Access-Control-Allow-Origin: $o");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Router ────────────────────────────────────────────────────────────────────
$method   = $_SERVER['REQUEST_METHOD'];
$uri      = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri      = preg_replace('#^/api#', '', $uri);
$uri      = rtrim($uri, '/') ?: '/';
$segments = explode('/', trim($uri, '/'));

try {
    match (true) {

        // Auth
        $method === 'POST' && $uri === '/auth/register'
            => AuthController::register(),

//      $method === 'POST' && $uri === '/auth/login'
//          => AuthController::login(),
        $method === 'POST' && ($uri === '/auth/login' || $uri === '/auth.php')
            => AuthController::login(),

        $method === 'POST' && $uri === '/auth/logout'
            => AuthController::logout(),

        $method === 'POST' && $uri === '/auth/refresh'
            => AuthController::refresh(),

        $method === 'GET' && str_starts_with($uri, '/auth/verify-email')
            => AuthController::verifyEmail(),

        $method === 'POST' && $uri === '/auth/forgot-password'
            => AuthController::forgotPassword(),

        $method === 'POST' && $uri === '/auth/reset-password'
            => AuthController::resetPassword(),

        $method === 'POST' && $uri === '/auth/resend-verification'
            => AuthController::resendVerification(),

        // ── User preferences (stored in Hostinger MySQL, VPS-independent) ────────
        $method === 'GET'  && $uri === '/user/preferences'
            => UserSettingsController::getPreferences(),

        $method === 'POST' && $uri === '/user/preferences'
            => UserSettingsController::savePreferences(),

        // ── Agent token management ────────────────────────────────────────────────
        $method === 'GET'    && $uri === '/user/agent-token'
            => UserSettingsController::getAgentToken(),

        $method === 'POST'   && $uri === '/user/agent-token/regenerate'
            => UserSettingsController::regenerateAgentToken(),

        $method === 'DELETE' && $uri === '/user/agent-token'
            => UserSettingsController::revokeAgentToken(),

        // Called by the Oracle VPS to validate incoming agent tokens (no user JWT needed)
        $method === 'POST'   && $uri === '/user/agent-token/verify'
            => UserSettingsController::verifyAgentToken(),

        // User (requires authentication)
        $method === 'GET'    && $uri === '/user/profile'
            => UserController::profile(),

        $method === 'PUT'    && $uri === '/user/profile'
            => UserController::updateProfile(),

        $method === 'PUT'    && $uri === '/user/change-password'
            => UserController::changePassword(),

        $method === 'DELETE' && $uri === '/user/account'
            => UserController::deleteAccount(),

        // Admin
        $method === 'GET' && $uri === '/admin/users'
            => AdminController::listUsers(),

        $method === 'GET' && $uri === '/admin/stats'
            => AdminController::stats(),

        // /admin/users/{id}
        $method === 'GET' && count($segments) === 3
            && $segments[0] === 'admin' && $segments[1] === 'users' && is_numeric($segments[2])
            => AdminController::getUser((int)$segments[2]),

        $method === 'PUT' && count($segments) === 3
            && $segments[0] === 'admin' && $segments[1] === 'users' && is_numeric($segments[2])
            => AdminController::updateUser((int)$segments[2]),

        $method === 'DELETE' && count($segments) === 3
            && $segments[0] === 'admin' && $segments[1] === 'users' && is_numeric($segments[2])
            => AdminController::deleteUser((int)$segments[2]),

        // /admin/users/{id}/toggle-active
        $method === 'PUT' && count($segments) === 4
            && $segments[0] === 'admin' && $segments[1] === 'users'
            && is_numeric($segments[2]) && $segments[3] === 'toggle-active'
            => AdminController::toggleActive((int)$segments[2]),

        // /admin/users/{id}/toggle-admin
        $method === 'PUT' && count($segments) === 4
            && $segments[0] === 'admin' && $segments[1] === 'users'
            && is_numeric($segments[2]) && $segments[3] === 'toggle-admin'
            => AdminController::toggleAdmin((int)$segments[2]),

        // Health check
        $method === 'GET' && $uri === '/health'
            => Response::success([
                'status' => 'ok',
                'time'   => round((microtime(true) - START) * 1000) . 'ms',
            ]),

        // ── Plugin routes served locally from Hostinger filesystem ──────────────
        // NOTE: These endpoints return raw JSON (no success/data wrapper) to match
        //       the FastAPI response format expected by the React frontend.

        // GET /api/plugins — list all plugins with optional ?category= and ?search=
        $method === 'GET' && ($uri === '/plugins' || str_starts_with($uri, '/plugins?'))
            => (function () {
                Auth::require();
                $cat    = $_GET['category'] ?? null;
                $search = $_GET['search']   ?? null;
                $list   = PluginReader::listPlugins($cat ?: null, $search ?: null);
                http_response_code(200);
                echo json_encode($list, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            })(),

        // GET /api/plugins/categories
        $method === 'GET' && $uri === '/plugins/categories'
            => (function () {
                Auth::require();
                http_response_code(200);
                echo json_encode(PluginReader::listCategories(), JSON_UNESCAPED_UNICODE);
                exit;
            })(),

        // GET /api/plugins/snippets — return empty object (snippets live on VPS)
        $method === 'GET' && $uri === '/plugins/snippets'
            => (function () {
                Auth::require();
                http_response_code(200);
                echo '{}';
                exit;
            })(),

        // GET /api/plugins/snippets/types
        $method === 'GET' && $uri === '/plugins/snippets/types'
            => (function () {
                Auth::require();
                http_response_code(200);
                echo json_encode(['script', 'conda', 'container', 'rscript', 'python']);
                exit;
            })(),

        // GET /api/plugins/template/yaml
        $method === 'GET' && $uri === '/plugins/template/yaml'
            => (function () {
                Auth::require();
                http_response_code(200);
                echo json_encode(['template' => PluginReader::getTemplate(), 'offline' => false]);
                exit;
            })(),

        // GET /api/plugins/raw/{id}
        $method === 'GET' && count($segments) === 3
            && $segments[0] === 'plugins' && $segments[1] === 'raw'
            => (function () use ($segments) {
                Auth::require();
                $id   = urldecode($segments[2]);
                $data = PluginReader::getRaw($id);
                if ($data === null) {
                    Response::notFound("Plugin '$id' not found.");
                }
                http_response_code(200);
                echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            })(),

        // POST /api/plugins/raw — save plugin YAML (admin only)
        $method === 'POST' && $uri === '/plugins/raw'
            => (function () {
                Auth::requireAdmin();
                $body     = json_decode(file_get_contents('php://input'), true) ?? [];
                $filename = $body['filename'] ?? '';
                $content  = $body['content']  ?? '';
                if (empty($filename) || empty($content)) {
                    Response::error('filename and content are required.', 400);
                }
                $ok = PluginReader::saveRaw($filename, $content);
                if (!$ok) {
                    Response::error('Failed to write plugin file. Check permissions.', 500);
                }
                http_response_code(200);
                echo json_encode(['saved' => true, 'filename' => $filename, 'offline' => false]);
                exit;
            })(),

        // DELETE /api/plugins/{id} — delete plugin YAML (admin only)
        $method === 'DELETE' && count($segments) === 2 && $segments[0] === 'plugins'
            => (function () use ($segments) {
                Auth::requireAdmin();
                $id = urldecode($segments[1]);
                $ok = PluginReader::deleteRaw($id);
                http_response_code(200);
                echo json_encode(['deleted' => $ok]);
                exit;
            })(),

        // GET /api/plugins/{id} — single plugin metadata
        $method === 'GET' && count($segments) === 2 && $segments[0] === 'plugins'
            && $segments[1] !== 'categories' && $segments[1] !== 'snippets'
            && $segments[1] !== 'template'   && $segments[1] !== 'raw'
            => (function () use ($segments) {
                Auth::require();
                $id      = urldecode($segments[1]);
                foreach (PluginReader::listPlugins() as $p) {
                    if ($p['id'] === $id) {
                        http_response_code(200);
                        echo json_encode($p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        exit;
                    }
                }
                Response::notFound("Plugin '$id' not found.");
            })(),

        // POST /api/plugins/reload — re-scans local plugin files
        $method === 'POST' && $uri === '/plugins/reload'
            => (function () {
                Auth::require();
                $count = count(PluginReader::listPlugins());
                http_response_code(200);
                echo json_encode(['reloaded' => true, 'count' => $count]);
                exit;
            })(),

        // ── Agent-optional routes → soft-fail so browser never shows red 503 ──────
        // These endpoints require an agent to be connected on the VPS.  When
        // no agent is present the VPS returns 503; we convert that to 200 with
        // {"ok":false,"reason":"agent_unavailable"} so the Network tab stays clean.
        str_starts_with($uri, '/plugins/user/')
            => (function () {
                Auth::require();
                VpsProxy::forwardSoft();
            })(),

        // ── All other engine routes → proxy to VPS ───────────────────────────────
        // Requires authentication to prevent unauthenticated VPS access.
        !str_starts_with($uri, '/auth') && !str_starts_with($uri, '/user')
            && !str_starts_with($uri, '/admin') && $uri !== '/health'
            => (function () {
                Auth::require();     // must be logged in
                VpsProxy::forward(); // streams VPS response and exits
            })(),

        default => Response::notFound("Route not found: $method $uri"),
    };
} catch (Throwable $e) {
    error_log('Unhandled exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $debug = Env::get('APP_ENV') === 'development';
    Response::error(
        $debug ? $e->getMessage() : 'Internal server error.',
        500,
        $debug ? ['trace' => $e->getTraceAsString()] : null
    );
}