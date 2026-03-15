<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/middleware.php';

cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();
$isAdmin = ($user['role'] ?? '') === 'admin' || !empty($user['is_admin']) || !empty($user['is_env_admin']);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim($input['action'] ?? '');

if ($action === '') {
    sendJson(['success' => false, 'error' => 'Missing action parameter'], 400);
}

$basePath = realpath(__DIR__ . '/../filexplorer');
if (!$basePath) {
    $basePath = '/home/u262319756/domains/guilherme.onnetweb.com/public_html/filexplorer';
    if (!is_dir($basePath)) {
        sendJson(['success' => false, 'error' => 'File system root not found'], 500);
    }
}

$HIDDEN_FILES = ['index.html', 'index.php', '.htaccess', '.env', 'wp-config.php'];
$DANGEROUS_EXTENSIONS = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar', 'cgi', 'pl', 'py', 'sh', 'bash', 'exe', 'bat', 'cmd', 'com', 'vbs', 'wsf', 'asp', 'aspx', 'jsp'];

$MAX_READ_SIZE = 2 * 1024 * 1024;
$MAX_WRITE_SIZE = 1 * 1024 * 1024;
$MAX_PATH_DEPTH = 20;
$MAX_PATH_LENGTH = 512;

function sanitizePath($path) {
    $path = str_replace(["\0", "\r", "\n"], '', $path);
    $path = str_replace(['../', '..\\', '..'], '', $path);
    $path = preg_replace('#[/\\\\]+#', '/', $path);
    $path = trim($path, '/ ');
    $path = preg_replace('#[^a-zA-Z0-9_\-./() \[\]@+,]#', '', $path);
    return $path;
}

function resolveExistingPath($requestedPath, $base) {
    global $MAX_PATH_LENGTH, $MAX_PATH_DEPTH;
    $clean = sanitizePath($requestedPath);
    if (strlen($clean) > $MAX_PATH_LENGTH) return false;
    if (substr_count($clean, '/') > $MAX_PATH_DEPTH) return false;
    if ($clean === '') return $base;
    $full = realpath($base . '/' . $clean);
    if (!$full || strpos($full, $base) !== 0) return false;
    return $full;
}

function resolveNewPath($requestedPath, $base) {
    global $MAX_PATH_LENGTH, $MAX_PATH_DEPTH;
    $clean = sanitizePath($requestedPath);
    if (strlen($clean) > $MAX_PATH_LENGTH) return false;
    if (substr_count($clean, '/') > $MAX_PATH_DEPTH) return false;
    if ($clean === '') return false;

    $full = $base . '/' . $clean;
    $parentDir = dirname($full);
    $realParent = realpath($parentDir);

    if ($realParent && strpos($realParent, $base) === 0) {
        return $realParent . '/' . basename($full);
    }

    $existingFull = realpath($full);
    if ($existingFull && strpos($existingFull, $base) === 0) {
        return $existingFull;
    }

    return false;
}

function requireAdmin($isAdmin) {
    if (!$isAdmin) {
        sendJson(['success' => false, 'error' => 'Permission denied — admin privileges required'], 403);
    }
}

function isHiddenFile($name) {
    global $HIDDEN_FILES;
    if (in_array($name, $HIDDEN_FILES)) return true;
    if (strpos($name, '.') === 0) return false;
    return false;
}

function isDangerousFile($name) {
    global $DANGEROUS_EXTENSIONS;
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return in_array($ext, $DANGEROUS_EXTENSIONS);
}

function rrmdir($dir, $base) {
    if (!is_dir($dir)) return false;
    if (strpos(realpath($dir), $base) !== 0) return false;
    if (realpath($dir) === $base) return false;

    $objects = scandir($dir);
    foreach ($objects as $object) {
        if ($object === '.' || $object === '..') continue;
        $path = $dir . '/' . $object;
        if (is_dir($path)) {
            rrmdir($path, $base);
        } else {
            unlink($path);
        }
    }
    return rmdir($dir);
}

function rcopy($src, $dst, $base, $depth = 0) {
    if ($depth > 10) return false;
    if (strpos(realpath($src), $base) !== 0) return false;

    if (is_dir($src)) {
        if (!is_dir($dst)) @mkdir($dst, 0755, true);
        $dir = opendir($src);
        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') continue;
            rcopy($src . '/' . $file, $dst . '/' . $file, $base, $depth + 1);
        }
        closedir($dir);
        return true;
    } else {
        return copy($src, $dst);
    }
}

switch ($action) {

    case 'ls': {
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath || !is_dir($fullPath)) {
            sendJson(['success' => false, 'error' => 'No such file or directory']);
        }

        $items = [];
        $entries = @scandir($fullPath);
        if ($entries === false) {
            sendJson(['success' => false, 'error' => 'Unable to read directory']);
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            if (in_array($entry, $HIDDEN_FILES)) continue;

            $entryPath = $fullPath . '/' . $entry;
            $cleanPath = sanitizePath($requestedPath);
            $relativePath = $cleanPath !== '' ? $cleanPath . '/' . $entry : $entry;
            $isDir = is_dir($entryPath);

            $size = 0;
            if (!$isDir && is_readable($entryPath)) {
                $size = @filesize($entryPath) ?: 0;
            }

            $items[] = [
                'name'      => $entry,
                'path'      => $relativePath,
                'isDir'     => $isDir,
                'size'      => $size,
                'modified'  => date('Y-m-d H:i:s', @filemtime($entryPath) ?: 0),
                'extension' => $isDir ? '' : strtolower(pathinfo($entry, PATHINFO_EXTENSION))
            ];
        }

        sendJson(['success' => true, 'items' => $items]);
        break;
    }

    case 'readFile': {
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath || !is_file($fullPath)) {
            sendJson(['success' => false, 'error' => 'No such file or directory']);
        }

        if (!is_readable($fullPath)) {
            sendJson(['success' => false, 'error' => 'Permission denied: file not readable'], 403);
        }

        $fileSize = @filesize($fullPath);
        if ($fileSize > $MAX_READ_SIZE) {
            sendJson(['success' => false, 'error' => 'File too large to read (max 2MB)']);
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $binaryExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'webp', 'svg',
                        'mp3', 'wav', 'ogg', 'flac', 'mp4', 'avi', 'mkv', 'mov',
                        'zip', 'rar', 'gz', 'bz2', 'xz', '7z', 'tar',
                        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                        'exe', 'bin', 'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf', 'eot'];
        if (in_array($ext, $binaryExts)) {
            sendJson(['success' => false, 'error' => "Binary file (.{$ext}) — use 'download' command instead"]);
        }

        $content = @file_get_contents($fullPath);
        if ($content === false) {
            sendJson(['success' => false, 'error' => 'Failed to read file']);
        }

        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'ISO-8859-1');
        }

        sendJson(['success' => true, 'content' => $content, 'size' => $fileSize]);
        break;
    }

    case 'stat': {
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath) {
            sendJson(['success' => false, 'error' => 'No such file or directory']);
        }

        $isDir = is_dir($fullPath);
        $isFile = is_file($fullPath);

        sendJson([
            'success'  => true,
            'size'     => $isFile ? (@filesize($fullPath) ?: 0) : 0,
            'isDir'    => $isDir,
            'modified' => date('Y-m-d H:i:s', @filemtime($fullPath) ?: 0),
            'accessed' => date('Y-m-d H:i:s', @fileatime($fullPath) ?: 0),
            'perms'    => substr(sprintf('%o', @fileperms($fullPath) ?: 0), -4),
            'owner'    => function_exists('posix_getpwuid') ? (posix_getpwuid(fileowner($fullPath))['name'] ?? 'unknown') : 'www-data',
            'readable' => is_readable($fullPath),
            'writable' => is_writable($fullPath),
        ]);
        break;
    }

    case 'fileInfo': {
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath) {
            sendJson(['success' => false, 'error' => 'No such file or directory']);
        }

        if (is_dir($fullPath)) {
            $count = count(array_diff(@scandir($fullPath) ?: [], ['.', '..']));
            sendJson(['success' => true, 'type' => "directory ({$count} entries)"]);
        }

        $type = 'data';
        if (function_exists('mime_content_type') && is_file($fullPath)) {
            $mime = @mime_content_type($fullPath);
            $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            $size = @filesize($fullPath) ?: 0;
            $type = "{$mime}; {$ext}; " . ($size > 1048576 ? round($size / 1048576, 1) . 'MB' : round($size / 1024, 1) . 'KB');
        }

        sendJson(['success' => true, 'type' => $type]);
        break;
    }

    // ══════════════════════════════════════════════
    // ADMIN-ONLY WRITE OPERATIONS
    // ══════════════════════════════════════════════

    case 'touch': {
        requireAdmin($isAdmin);
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveNewPath($requestedPath, $basePath);

        if (!$fullPath) {
            sendJson(['success' => false, 'error' => 'Invalid path']);
        }

        if (isDangerousFile(basename($fullPath))) {
            sendJson(['success' => false, 'error' => 'Creating executable/script files is not allowed'], 403);
        }

        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            sendJson(['success' => false, 'error' => 'Parent directory does not exist']);
        }

        if (file_exists($fullPath)) {
            @touch($fullPath);
        } else {
            if (@file_put_contents($fullPath, '') === false) {
                sendJson(['success' => false, 'error' => 'Failed to create file']);
            }
        }
        sendJson(['success' => true]);
        break;
    }

    case 'mkdir': {
        requireAdmin($isAdmin);
        $requestedPath = $input['path'] ?? '';
        $recursive = !empty($input['recursive']);

        $clean = sanitizePath($requestedPath);
        if ($clean === '') {
            sendJson(['success' => false, 'error' => 'Invalid path']);
        }

        $fullPath = $basePath . '/' . $clean;
        $parentDir = dirname($fullPath);
        $realParent = realpath($parentDir);

        if (!$recursive) {
            if (!$realParent || strpos($realParent, $basePath) !== 0 || !is_dir($realParent)) {
                sendJson(['success' => false, 'error' => 'Parent directory does not exist']);
            }
        }

        if (is_dir($fullPath) || (realpath($fullPath) && is_dir(realpath($fullPath)))) {
            sendJson(['success' => false, 'error' => 'Directory already exists']);
        }

        if (@mkdir($fullPath, 0755, $recursive)) {
            sendJson(['success' => true]);
        } else {
            sendJson(['success' => false, 'error' => 'Failed to create directory']);
        }
        break;
    }

    case 'rm': {
        requireAdmin($isAdmin);
        $requestedPath = $input['path'] ?? '';
        $recursive = !empty($input['recursive']);
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath) {
            sendJson(['success' => false, 'error' => 'No such file or directory']);
        }

        if ($fullPath === $basePath) {
            sendJson(['success' => false, 'error' => 'Cannot remove root directory'], 403);
        }

        $parentCheck = dirname($fullPath);
        if (realpath($parentCheck) === realpath($basePath) && is_dir($fullPath) && !$recursive) {
            sendJson(['success' => false, 'error' => 'Is a directory (use -r flag)']);
        }

        if (is_dir($fullPath)) {
            if (!$recursive) {
                sendJson(['success' => false, 'error' => 'Is a directory (use -r flag)']);
            }
            if (rrmdir($fullPath, $basePath)) {
                sendJson(['success' => true]);
            } else {
                sendJson(['success' => false, 'error' => 'Failed to remove directory']);
            }
        } else {
            if (@unlink($fullPath)) {
                sendJson(['success' => true]);
            } else {
                sendJson(['success' => false, 'error' => 'Failed to remove file']);
            }
        }
        break;
    }

    case 'rmdir': {
        requireAdmin($isAdmin);
        $requestedPath = $input['path'] ?? '';
        $fullPath = resolveExistingPath($requestedPath, $basePath);

        if (!$fullPath || !is_dir($fullPath)) {
            sendJson(['success' => false, 'error' => 'Not a directory']);
        }

        if ($fullPath === $basePath) {
            sendJson(['success' => false, 'error' => 'Cannot remove root directory'], 403);
        }

        $contents = array_diff(@scandir($fullPath) ?: [], ['.', '..']);
        if (count($contents) > 0) {
            sendJson(['success' => false, 'error' => 'Directory not empty']);
        }

        if (@rmdir($fullPath)) {
            sendJson(['success' => true]);
        } else {
            sendJson(['success' => false, 'error' => 'Failed to remove directory']);
        }
        break;
    }

    case 'mv': {
        requireAdmin($isAdmin);
        $source = $input['source'] ?? '';
        $destination = $input['destination'] ?? '';

        $srcFull = resolveExistingPath($source, $basePath);
        if (!$srcFull) {
            sendJson(['success' => false, 'error' => "cannot stat '{$source}': No such file or directory"]);
        }

        if ($srcFull === $basePath) {
            sendJson(['success' => false, 'error' => 'Cannot move root directory'], 403);
        }

        $dstFull = resolveNewPath($destination, $basePath);
        if (!$dstFull) {
            $dstFull = resolveExistingPath($destination, $basePath);
        }
        if (!$dstFull) {
            sendJson(['success' => false, 'error' => 'Invalid destination path']);
        }

        if (is_dir($dstFull)) {
            $dstFull = rtrim($dstFull, '/') . '/' . basename($srcFull);
        }

        if (isDangerousFile(basename($dstFull)) && !isDangerousFile(basename($srcFull))) {
            sendJson(['success' => false, 'error' => 'Renaming to executable extension is not allowed'], 403);
        }

        if (@rename($srcFull, $dstFull)) {
            sendJson(['success' => true]);
        } else {
            sendJson(['success' => false, 'error' => 'Failed to move/rename']);
        }
        break;
    }

    case 'cp': {
        requireAdmin($isAdmin);
        $source = $input['source'] ?? '';
        $destination = $input['destination'] ?? '';
        $recursive = !empty($input['recursive']);

        $srcFull = resolveExistingPath($source, $basePath);
        if (!$srcFull) {
            sendJson(['success' => false, 'error' => "cannot stat '{$source}': No such file or directory"]);
        }

        $dstFull = resolveNewPath($destination, $basePath);
        if (!$dstFull) {
            $dstFull = resolveExistingPath($destination, $basePath);
        }
        if (!$dstFull) {
            sendJson(['success' => false, 'error' => 'Invalid destination path']);
        }

        if (is_dir($srcFull)) {
            if (!$recursive) {
                sendJson(['success' => false, 'error' => "omitting directory '{$source}' (use -r flag)"]);
            }
            if (is_dir($dstFull)) {
                $dstFull = rtrim($dstFull, '/') . '/' . basename($srcFull);
            }
            if (rcopy($srcFull, $dstFull, $basePath)) {
                sendJson(['success' => true]);
            } else {
                sendJson(['success' => false, 'error' => 'Failed to copy directory']);
            }
        } else {
            if (is_dir($dstFull)) {
                $dstFull = rtrim($dstFull, '/') . '/' . basename($srcFull);
            }
            if (@copy($srcFull, $dstFull)) {
                sendJson(['success' => true]);
            } else {
                sendJson(['success' => false, 'error' => 'Failed to copy file']);
            }
        }
        break;
    }

    case 'writeFile': {
        requireAdmin($isAdmin);
        $requestedPath = $input['path'] ?? '';
        $content = $input['content'] ?? '';
        $append = !empty($input['append']);

        if (strlen($content) > $MAX_WRITE_SIZE) {
            sendJson(['success' => false, 'error' => 'Content too large (max 1MB)']);
        }

        $fullPath = resolveNewPath($requestedPath, $basePath);
        if (!$fullPath) {
            $fullPath = resolveExistingPath($requestedPath, $basePath);
        }
        if (!$fullPath) {
            sendJson(['success' => false, 'error' => 'Invalid path']);
        }

        if (isDangerousFile(basename($fullPath))) {
            sendJson(['success' => false, 'error' => 'Writing executable/script files is not allowed'], 403);
        }

        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            sendJson(['success' => false, 'error' => 'Parent directory does not exist']);
        }

        $flag = $append ? FILE_APPEND : 0;
        $writeContent = $content;
        if (!str_ends_with($writeContent, "\n")) {
            $writeContent .= "\n";
        }

        if (@file_put_contents($fullPath, $writeContent, $flag) !== false) {
            sendJson(['success' => true]);
        } else {
            sendJson(['success' => false, 'error' => 'Failed to write file']);
        }
        break;
    }

    default:
        sendJson(['success' => false, 'error' => 'Unknown action: ' . htmlspecialchars($action)], 400);
        break;
}