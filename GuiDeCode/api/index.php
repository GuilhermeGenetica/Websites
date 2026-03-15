<?php
require_once __DIR__ . '/middleware.php';

handleCors();

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = dirname($scriptName);
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

$segments = explode('/', $path);
$module = $segments[0] ?? '';

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

switch ($module) {
    case 'auth.php':
    case 'auth':
        rateLimit("auth_$clientIp", 30, 60);
        require_once __DIR__ . '/auth.php';
        break;

    case 'blog.php':
    case 'blog':
        rateLimit("blog_$clientIp", 60, 60);
        require_once __DIR__ . '/blog.php';
        break;

    case 'workbench.php':
    case 'workbench':
        rateLimit("wb_$clientIp", 120, 60);
        require_once __DIR__ . '/workbench.php';
        break;

    case 'contact.php':
    case 'contact':
        rateLimit("contact_$clientIp", 10, 60);
        require_once __DIR__ . '/contact.php';
        break;

    default:
        jsonResponse([
            'service' => 'Guilherme WorkBench API',
            'version' => '2.0.0',
            'status' => 'running',
            'endpoints' => ['auth', 'blog', 'workbench', 'contact'],
        ]);
        break;
}