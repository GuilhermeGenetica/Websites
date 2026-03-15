<?php
/**
 * FileExplorer Public API — Sem autenticação
 * Localização: /api/list.php
 * Lê ficheiros de: /filexplorer/
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$action = $_GET['action'] ?? '';

// Caminho para a pasta de ficheiros (relativo à localização deste script)
$basePath = realpath(__DIR__ . '/../filexplorer');

if (!$basePath) {
    // Fallback absoluto para Hostinger
    $basePath = '/home/u262319756/domains/guilherme.onnetweb.com/public_html/filexplorer';
    if (!is_dir($basePath)) {
        echo json_encode(['success' => false, 'error' => 'Pasta /filexplorer/ não encontrada.']);
        exit;
    }
}

// Ficheiros internos do sistema antigo que não devem aparecer
$HIDDEN_FILES = ['index.html', 'index.php'];

function sanitizePath($path, $base) {
    $path = trim(str_replace(['../', '..\\', '..'], '', $path), '/');
    $full = realpath($base . ($path ? '/' . $path : ''));
    if (!$full || strpos($full, $base) !== 0) return false;
    return $full;
}

switch ($action) {

    case 'listFiles':
        $requestedPath = $_GET['path'] ?? '';
        $cleanPath = trim(str_replace(['../', '..\\', '..'], '', $requestedPath), '/');
        $fullPath  = sanitizePath($requestedPath, $basePath);

        if (!$fullPath) {
            echo json_encode(['success' => false, 'error' => 'Acesso negado.']);
            exit;
        }
        if (!is_dir($fullPath)) {
            echo json_encode(['success' => false, 'error' => 'Diretório não encontrado.']);
            exit;
        }

        $items   = [];
        $entries = scandir($fullPath);

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            if (strpos($entry, '.') === 0) continue;
            if (strpos($entry, '_') === 0) continue;
            if (in_array($entry, $HIDDEN_FILES)) continue;

            $entryPath    = $fullPath . '/' . $entry;
            $relativePath = $cleanPath ? $cleanPath . '/' . $entry : $entry;
            $isDir        = is_dir($entryPath);

            $items[] = [
                'name'      => $entry,
                'path'      => $relativePath,
                'isDir'     => $isDir,
                'size'      => $isDir ? 0 : filesize($entryPath),
                'modified'  => date('Y-m-d H:i:s', filemtime($entryPath)),
                'extension' => $isDir ? '' : strtolower(pathinfo($entry, PATHINFO_EXTENSION))
            ];
        }

        echo json_encode(['success' => true, 'items' => $items, 'currentPath' => $cleanPath]);
        break;

    case 'previewFile':
        $requestedPath = $_GET['path'] ?? '';
        $fullPath = sanitizePath($requestedPath, $basePath);

        if (!$fullPath || !is_file($fullPath)) {
            echo json_encode(['success' => false, 'error' => 'Arquivo não encontrado.']);
            exit;
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $textExts  = ['txt','md','json','xml','csv','html','css','js','php','py','sh','log','sql','yml','yaml','ini','conf'];
        $imageExts = ['jpg','jpeg','png','gif','bmp','svg','webp','ico'];

        if (in_array($ext, $textExts)) {
            $content = file_get_contents($fullPath);
            echo json_encode(['success' => true, 'type' => 'text', 'content' => $content, 'filename' => basename($fullPath)]);
        } elseif (in_array($ext, $imageExts)) {
            $mime   = mime_content_type($fullPath);
            $base64 = base64_encode(file_get_contents($fullPath));
            echo json_encode(['success' => true, 'type' => 'image', 'content' => "data:$mime;base64,$base64", 'filename' => basename($fullPath)]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Preview não disponível.']);
        }
        break;

    case 'downloadFile':
        $requestedPath = $_GET['path'] ?? '';
        $fullPath = sanitizePath($requestedPath, $basePath);

        if (!$fullPath || !is_file($fullPath)) {
            header('HTTP/1.1 404 Not Found');
            echo json_encode(['success' => false, 'error' => 'Arquivo não encontrado.']);
            exit;
        }

        header('Content-Type: ' . mime_content_type($fullPath));
        header('Content-Disposition: attachment; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;

    default:
        echo json_encode(['success' => false, 'error' => 'Ação inválida: ' . $action]);
}