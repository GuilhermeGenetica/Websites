<?php
require_once 'config.php';
require_once 'middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$pdo = getDbConnection();

switch ($action) {

    case 'listFiles':
        $user = requireAuth();
        $basePath = realpath(__DIR__ . '/../filexplorer')
        ?: realpath(env('FILEXPLORER_PATH', ''))
        ?: null;

        if (!is_dir($basePath)) {
            mkdir($basePath, 0755, true);
            $basePath = realpath($basePath);
        }

        $requestedPath = $_GET['path'] ?? '';
        $requestedPath = trim(str_replace(['../', '..\\'], '', $requestedPath), '/');
        
        $fullPath = realpath($basePath . ($requestedPath ? '/' . $requestedPath : ''));

        if (!$fullPath || strpos($fullPath, $basePath) !== 0) {
            sendJson(['success' => false, 'error' => 'Acesso negado fora do diretório permitido.'], 403);
            exit;
        }

        if (!is_dir($fullPath)) {
            sendJson(['success' => false, 'error' => 'Diretório não encontrado.'], 404);
            exit;
        }

        $items = [];
        $entries = scandir($fullPath);
        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..' || strpos($entry, '.') === 0 || strpos($entry, '_') === 0) continue;
            
            $entryPath = $fullPath . '/' . $entry;
            $relativePath = $requestedPath ? $requestedPath . '/' . $entry : $entry;
            $isDir = is_dir($entryPath);
            
            $items[] = [
                'name' => $entry,
                'path' => $relativePath,
                'isDir' => $isDir,
                'size' => $isDir ? 0 : filesize($entryPath),
                'modified' => date('Y-m-d H:i:s', filemtime($entryPath)),
                'extension' => $isDir ? '' : strtolower(pathinfo($entry, PATHINFO_EXTENSION))
            ];
        }

        sendJson(['success' => true, 'items' => $items, 'currentPath' => $requestedPath]);
        break;

    case 'downloadFile':
        $user = requireAuth();
        $basePath = realpath(__DIR__ . '/../filexplorer');
        if (!$basePath) {
            sendJson(['success' => false, 'error' => 'Pasta /filexplorer/ não encontrada.'], 500);
        }

        $requestedPath = $_GET['path'] ?? '';
        $requestedPath = trim(str_replace(['../', '..\\'], '', $requestedPath), '/');
        $fullPath = realpath($basePath . '/' . $requestedPath);

        if (!$fullPath || strpos($fullPath, $basePath) !== 0 || !is_file($fullPath)) {
            sendJson(['success' => false, 'error' => 'Arquivo nao encontrado.'], 404);
        }

        $mime = mime_content_type($fullPath);
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;

    case 'previewFile':
        $user = requireAuth();
        $basePath = realpath(__DIR__ . '/../filexplorer');
        if (!$basePath) {
            sendJson(['success' => false, 'error' => 'Pasta /filexplorer/ não encontrada.'], 500);
        }

        $requestedPath = $_GET['path'] ?? '';
        $requestedPath = trim(str_replace(['../', '..\\'], '', $requestedPath), '/');
        $fullPath = realpath($basePath . '/' . $requestedPath);

        if (!$fullPath || strpos($fullPath, $basePath) !== 0 || !is_file($fullPath)) {
            sendJson(['success' => false, 'error' => 'Arquivo nao encontrado.'], 404);
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $textExts = ['txt','md','json','xml','csv','html','css','js','php','py','sh','log','sql','yml','yaml','ini','conf','env'];

        if (in_array($ext, $textExts)) {
            $content = file_get_contents($fullPath);
            sendJson(['success' => true, 'type' => 'text', 'content' => $content, 'filename' => basename($fullPath)]);
        }

        $imageExts = ['jpg','jpeg','png','gif','bmp','svg','webp','ico'];
        if (in_array($ext, $imageExts)) {
            $mime = mime_content_type($fullPath);
            $base64 = base64_encode(file_get_contents($fullPath));
            sendJson(['success' => true, 'type' => 'image', 'content' => 'data:' . $mime . ';base64,' . $base64, 'filename' => basename($fullPath)]);
        }

        $pdfExts = ['pdf'];
        if (in_array($ext, $pdfExts)) {
            sendJson(['success' => true, 'type' => 'pdf', 'url' => '/filexplorer/' . $requestedPath, 'filename' => basename($fullPath)]);
        }

        sendJson(['success' => true, 'type' => 'unsupported', 'filename' => basename($fullPath), 'extension' => $ext]);
        break;

    case 'dbConnect':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';

        if (empty($host) || empty($dbUser)) {
            sendJson(['success' => false, 'error' => 'Host e usuario sao obrigatorios.'], 400);
        }

        try {
            $dsn = 'mysql:host=' . $host;
            if (!empty($database)) {
                $dsn .= ';dbname=' . $database;
            }
            $testConn = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $testConn = null;
            sendJson(['success' => true, 'message' => 'Conectado com sucesso.']);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => 'Erro ao conectar: ' . $e->getMessage()], 401);
        }
        break;

    case 'dbListDatabases':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';

        try {
            $conn = new PDO('mysql:host=' . $host, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $stmt = $conn->query('SHOW DATABASES');
            $dbs = [];
            $exclude = ['information_schema','mysql','performance_schema','sys'];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                if (!in_array($row[0], $exclude)) {
                    $dbs[] = $row[0];
                }
            }
            sendJson(['success' => true, 'databases' => $dbs]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbListTables':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';

        if (empty($database)) {
            sendJson(['success' => false, 'error' => 'Database obrigatorio.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $stmt = $conn->query('SHOW TABLES');
            $tables = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            sendJson(['success' => true, 'tables' => $tables]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbGetTableContent':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $limit = (int)($input['limit'] ?? 100);
        $offset = (int)($input['offset'] ?? 0);
        $search = $input['search'] ?? '';

        if (empty($database) || empty($table)) {
            sendJson(['success' => false, 'error' => 'Database e tabela obrigatorios.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $countSql = "SELECT COUNT(*) as total FROM `{$table}`";
            $dataSql = "SELECT * FROM `{$table}`";

            if (!empty($search)) {
                $descStmt = $conn->query("DESCRIBE `{$table}`");
                $columns = $descStmt->fetchAll();
                $searchClauses = [];
                foreach ($columns as $col) {
                    if (strpos($col['Type'], 'char') !== false || strpos($col['Type'], 'text') !== false) {
                        $searchClauses[] = "`{$col['Field']}` LIKE :search";
                    }
                }
                if (!empty($searchClauses)) {
                    $where = ' WHERE (' . implode(' OR ', $searchClauses) . ')';
                    $countSql .= $where;
                    $dataSql .= $where;
                }
            }

            $dataSql .= " LIMIT {$limit} OFFSET {$offset}";

            if (!empty($search) && !empty($searchClauses)) {
                $countStmt = $conn->prepare($countSql);
                $countStmt->execute([':search' => '%' . $search . '%']);
                $dataStmt = $conn->prepare($dataSql);
                $dataStmt->execute([':search' => '%' . $search . '%']);
            } else {
                $countStmt = $conn->query($countSql);
                $dataStmt = $conn->query($dataSql);
            }

            $total = $countStmt->fetch()['total'];
            $rows = $dataStmt->fetchAll();

            $descStmt2 = $conn->query("DESCRIBE `{$table}`");
            $columnsInfo = $descStmt2->fetchAll();

            $primaryKey = null;
            foreach ($columnsInfo as $ci) {
                if ($ci['Key'] === 'PRI') {
                    $primaryKey = $ci['Field'];
                    break;
                }
            }

            sendJson([
                'success' => true,
                'rows' => $rows,
                'total' => (int)$total,
                'columns' => $columnsInfo,
                'primaryKey' => $primaryKey
            ]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbSaveChanges':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $changes = $input['changes'] ?? [];

        if (empty($database) || empty($table) || empty($changes)) {
            sendJson(['success' => false, 'error' => 'Dados invalidos.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $conn->beginTransaction();

            foreach ($changes as $change) {
                $type = $change['type'] ?? '';

                if ($type === 'update') {
                    $pkCol = preg_replace('/[^a-zA-Z0-9_]/', '', $change['primaryKeyColumn'] ?? '');
                    $pkVal = $change['primaryKeyValue'] ?? null;
                    $data = $change['updatedData'] ?? [];
                    $sets = [];
                    $vals = [];
                    foreach ($data as $col => $val) {
                        $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $col);
                        if ($safeCol !== $pkCol) {
                            $sets[] = "`{$safeCol}` = ?";
                            $vals[] = $val;
                        }
                    }
                    if (!empty($sets)) {
                        $vals[] = $pkVal;
                        $sql = "UPDATE `{$table}` SET " . implode(', ', $sets) . " WHERE `{$pkCol}` = ?";
                        $stmt = $conn->prepare($sql);
                        $stmt->execute($vals);
                    }
                }

                if ($type === 'insert') {
                    $data = $change['data'] ?? [];
                    $cols = [];
                    $placeholders = [];
                    $vals = [];
                    foreach ($data as $col => $val) {
                        $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $col);
                        $cols[] = "`{$safeCol}`";
                        $placeholders[] = '?';
                        $vals[] = $val;
                    }
                    if (!empty($cols)) {
                        $sql = "INSERT INTO `{$table}` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
                        $stmt = $conn->prepare($sql);
                        $stmt->execute($vals);
                    }
                }

                if ($type === 'delete') {
                    $pkCol = preg_replace('/[^a-zA-Z0-9_]/', '', $change['primaryKeyColumn'] ?? '');
                    $pkVal = $change['primaryKeyValue'] ?? null;
                    if ($pkCol && $pkVal !== null) {
                        $sql = "DELETE FROM `{$table}` WHERE `{$pkCol}` = ?";
                        $stmt = $conn->prepare($sql);
                        $stmt->execute([$pkVal]);
                    }
                }
            }

            $conn->commit();
            sendJson(['success' => true, 'message' => 'Alteracoes salvas com sucesso.']);
        } catch (PDOException $e) {
            if (isset($conn)) $conn->rollBack();
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbCreateDatabase':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $dbName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['dbName'] ?? '');

        if (empty($dbName)) {
            sendJson(['success' => false, 'error' => 'Nome do banco obrigatorio.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("CREATE DATABASE `{$dbName}`");
            sendJson(['success' => true, 'message' => "Banco '{$dbName}' criado."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbDropDatabase':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $dbName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['dbName'] ?? '');

        if (empty($dbName)) {
            sendJson(['success' => false, 'error' => 'Nome do banco obrigatorio.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("DROP DATABASE `{$dbName}`");
            sendJson(['success' => true, 'message' => "Banco '{$dbName}' removido."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbDropTable':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("DROP TABLE `{$table}`");
            sendJson(['success' => true, 'message' => "Tabela '{$table}' removida."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbExecuteSQL':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $sql = $input['sql'] ?? '';

        if (empty($sql)) {
            sendJson(['success' => false, 'error' => 'SQL obrigatorio.'], 400);
        }

        try {
            $dsn = 'mysql:host=' . $host;
            if (!empty($database)) $dsn .= ';dbname=' . $database;
            $conn = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $stmt = $conn->query($sql);
            if ($stmt->columnCount() > 0) {
                $rows = $stmt->fetchAll();
                sendJson(['success' => true, 'rows' => $rows, 'rowCount' => count($rows)]);
            } else {
                sendJson(['success' => true, 'message' => 'Executado. Linhas afetadas: ' . $stmt->rowCount(), 'rowCount' => $stmt->rowCount()]);
            }
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

case 'graphoLoad':
        $user = requireAuth();
        $userId = $user['id'];
        $userRole = $user['role'] ?? 'user';
        $userSub = $user['subscription_type'] ?? 'free';
        $mapId = $_GET['mapId'] ?? $input['mapId'] ?? null;

        if ($mapId) {
            $stmt = $pdo->prepare("SELECT gm.*, u.full_name AS owner_name FROM grapho_maps gm LEFT JOIN users u ON gm.user_id = u.id WHERE gm.id = ?");
            $stmt->execute([$mapId]);
            $map = $stmt->fetch();
            if (!$map) {
                sendJson(['success' => false, 'error' => 'Mapa nao encontrado.'], 404);
                break;
            }
            $isOwner = ((int)$map['user_id'] === (int)$userId);
            $isAdminUser = ($userRole === 'admin' || !empty($user['is_admin']) || !empty($user['is_env_admin']));
            if (!$isOwner && !$isAdminUser && !in_array($userSub, ['basic', 'complete'])) {
                sendJson(['success' => false, 'error' => 'Subscription required to view maps.'], 403);
                break;
            }
            $map['data'] = json_decode($map['data'], true);
            $map['is_owner'] = $isOwner;
            $map['can_edit'] = $isOwner && ($userSub === 'complete' || $isAdminUser);
            sendJson(['success' => true, 'map' => $map]);
        } else {
            $stmt = $pdo->prepare("SELECT id, name, updated_at, user_id FROM grapho_maps WHERE user_id = ? ORDER BY updated_at DESC");
            $stmt->execute([$userId]);
            $maps = $stmt->fetchAll();
            sendJson(['success' => true, 'maps' => $maps]);
        }
        break;

    case 'graphoSave':
        $user = requireAuth();
        $userId = $user['id'];
        $userRole = $user['role'] ?? 'user';
        $userSub = $user['subscription_type'] ?? 'free';
        $isAdminUser = ($userRole === 'admin' || !empty($user['is_admin']) || !empty($user['is_env_admin']));

        if (!$isAdminUser && $userSub !== 'complete') {
            sendJson(['success' => false, 'error' => 'Complete subscription required to save maps.'], 403);
            break;
        }

        $mapId = $input['mapId'] ?? null;
        $name = $input['name'] ?? 'Untitled Map';
        $data = json_encode($input['data'] ?? ['nodes' => [], 'links' => [], 'scenes' => [], 'meta' => []]);

        if ($mapId) {
            $checkStmt = $pdo->prepare("SELECT user_id FROM grapho_maps WHERE id = ?");
            $checkStmt->execute([$mapId]);
            $existing = $checkStmt->fetch();
            if (!$existing) {
                sendJson(['success' => false, 'error' => 'Mapa nao encontrado.'], 404);
                break;
            }
            if ((int)$existing['user_id'] !== (int)$userId && !$isAdminUser) {
                sendJson(['success' => false, 'error' => 'Sem permissao para editar este mapa.'], 403);
                break;
            }
            $stmt = $pdo->prepare("UPDATE grapho_maps SET name = ?, data = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $data, $mapId]);
            sendJson(['success' => true, 'mapId' => $mapId, 'message' => 'Mapa atualizado.']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO grapho_maps (user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
            $stmt->execute([$userId, $name, $data]);
            $newId = $pdo->lastInsertId();
            sendJson(['success' => true, 'mapId' => $newId, 'message' => 'Mapa criado.']);
        }
        break;

    case 'graphoDelete':
        $user = requireAuth();
        $userId = $user['id'];
        $userRole = $user['role'] ?? 'user';
        $isAdminUser = ($userRole === 'admin' || !empty($user['is_admin']) || !empty($user['is_env_admin']));
        $mapId = $input['mapId'] ?? null;

        if (!$mapId) {
            sendJson(['success' => false, 'error' => 'mapId obrigatorio.'], 400);
            break;
        }

        if ($isAdminUser) {
            $stmt = $pdo->prepare("DELETE FROM grapho_maps WHERE id = ?");
            $stmt->execute([$mapId]);
        } else {
            $stmt = $pdo->prepare("DELETE FROM grapho_maps WHERE id = ? AND user_id = ?");
            $stmt->execute([$mapId, $userId]);
        }
        sendJson(['success' => true, 'message' => 'Mapa removido.']);
        break;

/* =======================================================
       SISTEMA DE STICKY NOTES v2 — Criação Manual
       ======================================================= */
    case 'getNotes':
        $user = requireAuth();
        $userId = $user['id'];
        $stmt = $pdo->prepare("
            SELECT sn.*, u.full_name AS author_name
            FROM sticky_notes sn
            LEFT JOIN users u ON sn.author_id = u.id
            WHERE sn.owner_id = ?
            ORDER BY sn.created_at ASC
        ");
        $stmt->execute([$userId]);
        $notes = $stmt->fetchAll();
        sendJson(['success' => true, 'notes' => $notes]);
        break;

    case 'createNote':
        $user = requireAuth();
        $userId = $user['id'];
        $isAdmin = ($user['role'] === 'admin' || !empty($user['is_admin']));

        $content    = mb_substr($input['content'] ?? '', 0, 1000);
        $color      = $input['color'] ?? '#fef08a';
        $targetType = $input['target_type'] ?? 'self';
        $targetIds  = $input['target_user_ids'] ?? [];

        if (!$isAdmin) $targetType = 'self';

        $maxNotes = $isAdmin ? 50 : 15;
        $stmtCount = $pdo->prepare("SELECT COUNT(*) as cnt FROM sticky_notes WHERE owner_id = ?");
        $stmtCount->execute([$userId]);
        $currentCount = (int)$stmtCount->fetch()['cnt'];
        if ($currentCount >= $maxNotes) {
            sendJson(['success' => false, 'error' => "Limite de $maxNotes notas atingido."]);
            break;
        }

        $owners = [$userId];

        if ($targetType === 'all' && $isAdmin) {
            $stmtAll = $pdo->query("SELECT id FROM users");
            $allIds = array_column($stmtAll->fetchAll(), 'id');
            $owners = array_unique(array_merge($owners, $allIds));
        } elseif ($targetType === 'users' && $isAdmin) {
            $safeIds = array_map('intval', $targetIds);
            $owners = array_unique(array_merge($owners, $safeIds));
        }

        $count = 0;
        foreach ($owners as $oid) {
            $pdo->prepare("INSERT INTO sticky_notes (author_id, owner_id, content, color, x, y, width, height, is_collapsed, is_hidden) VALUES (?, ?, ?, ?, 0, 0, 300, 300, 0, 0)")
                ->execute([$userId, (int)$oid, $content, $color]);
            $count++;
        }

        sendJson(['success' => true, 'created_count' => $count]);
        break;

    case 'saveNote':
        $user = requireAuth();
        $userId = $user['id'];
        $noteId = $input['id'] ?? null;

        if (!$noteId) { sendJson(['success' => false, 'error' => 'Note ID obrigatorio.']); break; }

        $stmt = $pdo->prepare("SELECT * FROM sticky_notes WHERE id = ? AND owner_id = ?");
        $stmt->execute([$noteId, $userId]);
        $note = $stmt->fetch();
        if (!$note) { sendJson(['success' => false, 'error' => 'Nota nao encontrada.']); break; }

        $x   = $input['x']      ?? $note['x'];
        $y   = $input['y']      ?? $note['y'];
        $w   = $input['width']  ?? $note['width'];
        $h   = $input['height'] ?? $note['height'];
        $col = isset($input['is_collapsed']) ? (int)$input['is_collapsed'] : (int)$note['is_collapsed'];
        $hid = isset($input['is_hidden'])    ? (int)$input['is_hidden']    : (int)$note['is_hidden'];
        $clr = $input['color'] ?? $note['color'];

        $content = $note['content'];
        if (isset($input['content']) && (int)$note['author_id'] === $userId) {
            $content = mb_substr($input['content'], 0, 1000);
        }

        $pdo->prepare("UPDATE sticky_notes SET x=?, y=?, width=?, height=?, is_collapsed=?, is_hidden=?, content=?, color=? WHERE id=?")
            ->execute([$x, $y, $w, $h, $col, $hid, $content, $clr, $noteId]);

        sendJson(['success' => true]);
        break;

    case 'deleteNote':
        $user = requireAuth();
        $userId = $user['id'];
        $noteId = $input['id'] ?? null;
        if (!$noteId) { sendJson(['success' => false, 'error' => 'Note ID obrigatorio.']); break; }

        $stmt = $pdo->prepare("DELETE FROM sticky_notes WHERE id = ? AND owner_id = ?");
        $stmt->execute([$noteId, $userId]);

        sendJson(['success' => true]);
        break;

    case 'adminGetUsers':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) { sendJson(['success' => false, 'error' => 'Denied'], 403); break; }
        $stmt = $pdo->query("SELECT id, full_name, email, role, is_admin, subscription_type FROM users ORDER BY full_name ASC");
        $rows = $stmt->fetchAll();
        sendJson(['success' => true, 'users' => $rows]);
        break;

    case 'adminGetUserNotes':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) { sendJson(['success' => false, 'error' => 'Denied'], 403); break; }
        $targetId = $_GET['userId'] ?? null;
        if (!$targetId) { sendJson(['success' => false, 'error' => 'userId required']); break; }
        $stmt = $pdo->prepare("
            SELECT sn.*, u.full_name AS author_name
            FROM sticky_notes sn
            LEFT JOIN users u ON sn.author_id = u.id
            WHERE sn.author_id = ? AND sn.owner_id = ?
            ORDER BY sn.created_at DESC
        ");
        $stmt->execute([$targetId, $targetId]);
        $notes = $stmt->fetchAll();
        sendJson(['success' => true, 'notes' => $notes]);
        break;

    /* =======================================================
       CONSULTATION SLOTS & SCRIPTS 
       ======================================================= */
    case 'getConsultationSlots':
        $user = requireAuth();
        $month = $_GET['month'] ?? date('Y-m');
        $stmt = $pdo->prepare("SELECT * FROM consultation_slots WHERE date_slot LIKE ? ORDER BY date_slot ASC, time_slot ASC");
        $stmt->execute([$month . '%']);
        $slots = $stmt->fetchAll();
        sendJson(['success' => true, 'slots' => $slots]);
        break;

    case 'bookConsultation':
        $user = requireAuth();
        $userId = $user['id'];
        $slotId = $input['slotId'] ?? null;
        $type = $input['type'] ?? 'basic';
        $patientName = $input['patientName'] ?? '';
        $patientEmail = $input['patientEmail'] ?? '';
        $reason = $input['reason'] ?? '';

        if (!$slotId) {
            sendJson(['success' => false, 'error' => 'slotId obrigatorio.'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM consultation_slots WHERE id = ? AND is_booked = 0");
        $stmt->execute([$slotId]);
        $slot = $stmt->fetch();
        if (!$slot) {
            sendJson(['success' => false, 'error' => 'Horario indisponivel.'], 409);
        }

        $priceId = '';
        if ($type === 'clinical') $priceId = env('STRIPE_PRICE_CLINICAL_CONSULTATION', '');
        if ($type === 'counseling') $priceId = env('STRIPE_PRICE_GENETIC_COUNSELING', '');
        if ($type === 'laboratory') $priceId = env('STRIPE_PRICE_LABORATORY_ANALYSIS', '');

        if (empty($priceId)) {
            sendJson(['success' => false, 'error' => 'Price ID nao configurado.']);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/checkout/sessions");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_USERPWD, env('STRIPE_SECRET_KEY', '') . ":");
        $postFields = http_build_query([
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price' => $priceId,
                    'quantity' => 1,
                ]
            ],
            'mode' => 'payment',
            'success_url' => env('VITE_SITE_URL', 'https://guilherme.onnetweb.com') . '/workbench',
            'cancel_url' => env('VITE_SITE_URL', 'https://guilherme.onnetweb.com') . '/workbench',
            'metadata' => ['slot_id' => $slotId, 'user_id' => $userId]
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, preg_replace('/%5B[0-9]+%5D/simU', '%5B%5D', $postFields));
        
        $response = json_decode(curl_exec($ch), true);
        unset($ch);

        if (isset($response['error'])) {
            sendJson(['success' => false, 'error' => $response['error']['message']]);
        }

        $sessionId = $response['id'] ?? null;
        $checkoutUrl = $response['url'] ?? null;
        
        if (!$sessionId || !$checkoutUrl) {
            sendJson(['success' => false, 'error' => 'Failed to retrieve session from Stripe']);
        }

        try {
            $pdo->beginTransaction();
            
            // Atualiza o Slot
            $stmt1 = $pdo->prepare("UPDATE consultation_slots SET is_booked = 1, consultation_type = ?, payment_status = 'pending', stripe_session_id = ? WHERE id = ?");
            $stmt1->execute([$type, $sessionId, $slotId]);
            
            // Grava os dados do Paciente na tabela Correta (consultations)
            $stmt2 = $pdo->prepare("INSERT INTO consultations (slot_id, user_id, patient_name, patient_email, reason, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt2->execute([$slotId, $userId, $patientName, $patientEmail, $reason]);
            
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            sendJson(['success' => false, 'error' => 'Database Error: ' . $e->getMessage()], 500);
        }

        sendJson(['success' => true, 'checkoutUrl' => $checkoutUrl]);
        break;

    case 'getMyConsultations':
        $user = requireAuth();
        $userId = $user['id'];
        // Fazendo JOIN com consultations para retornar os dados certos
        $stmt = $pdo->prepare("
            SELECT cs.*, c.patient_name, c.patient_email, c.reason 
            FROM consultation_slots cs 
            JOIN consultations c ON cs.id = c.slot_id 
            WHERE c.user_id = ? 
            ORDER BY cs.date_slot DESC, cs.time_slot DESC
        ");
        $stmt->execute([$userId]);
        $consultations = $stmt->fetchAll();
        sendJson(['success' => true, 'consultations' => $consultations]);
        break;

    case 'cancelConsultation':
        $user = requireAuth();
        $userId = $user['id'];
        $slotId = $input['slotId'] ?? null;
        $reason = $input['reason'] ?? '';

        // Valida se o utilizador é realmente o dono deste agendamento
        $stmt = $pdo->prepare("
            SELECT cs.* FROM consultation_slots cs 
            JOIN consultations c ON cs.id = c.slot_id 
            WHERE cs.id = ? AND c.user_id = ?
        ");
        $stmt->execute([$slotId, $userId]);
        $slot = $stmt->fetch();

        if (!$slot) {
            sendJson(['success' => false, 'error' => 'Consultation not found or unauthorized.']);
            break;
        }

        $pdo->prepare("UPDATE consultation_slots SET payment_status = 'cancelled', cancel_reason = ?, cancelled_at = NOW(), cancelled_by = 'client' WHERE id = ?")->execute([$reason, $slotId]);
        sendJson(['success' => true, 'message' => 'Consultation cancelled.']);
        break;

// -- funções para o ScriptViewer --

    case 'listScripts':
        $user = requireAuth();
        $basePath = realpath(__DIR__ . '/../filexplorer/_Scripts');
        if (!$basePath || !is_dir($basePath)) {
            sendJson(['success' => true, 'scripts' => []]);
        }
        
        $scripts = [];
        // Iterador recursivo para ler pastas e subpastas
        $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($basePath));
        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            
            $fullPath = $file->getPathname();
            // Caminho relativo para manter a estrutura de pastas no Frontend
            $relPath = str_replace($basePath . DIRECTORY_SEPARATOR, '', $fullPath);
            $relPath = str_replace('\\', '/', $relPath); // Normaliza barras para Web
            
            $scripts[] = [
                'name' => $file->getFilename(),
                'path' => $relPath,
                'size' => $file->getSize(),
                'modified' => date('Y-m-d H:i:s', $file->getMTime()),
                'extension' => strtolower($file->getExtension())
            ];
        }
        sendJson(['success' => true, 'scripts' => $scripts]);
        break;

    case 'getScriptContent':
        $user = requireAuth();
        $filename = $_GET['filename'] ?? '';
        
        // Sanitiza para evitar directory traversal maligno, mas permite pastas (ex: folder/file.txt)
        $filename = str_replace(['../', '..\\'], '', $filename); 
        $basePath = realpath(__DIR__ . '/../filexplorer/_Scripts');
        $fullPath = realpath($basePath . '/' . $filename);

        if (!$fullPath || strpos($fullPath, $basePath) !== 0 || !is_file($fullPath)) {
            sendJson(['success' => false, 'error' => 'Script/Ficheiro nao encontrado.']);
        }

        $rawContent = file_get_contents($fullPath);
        
        sendJson([
            'success' => true, 
            'contentBase64' => base64_encode($rawContent), // Envia em Base64 para garantir a integridade binária no Hex Viewer
            'content' => mb_convert_encoding($rawContent, 'UTF-8', 'UTF-8'), // Fallback de texto
            'filename' => basename($fullPath),
            'path' => $filename,
            'size' => filesize($fullPath)
        ]);
        break;


    case 'getUserPrefs':
        $user = requireAuth();
        $userId = $user['id'];
        $stmt = $pdo->prepare("SELECT prefs FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        $prefs = $row ? json_decode($row['prefs'], true) : [];
        sendJson(['success' => true, 'prefs' => $prefs]);
        break;

    case 'saveUserPrefs':
        $user = requireAuth();
        $userId = $user['id'];
        $prefs = json_encode($input['prefs'] ?? []);

        $stmt = $pdo->prepare("SELECT id FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);

        if ($stmt->fetch()) {
            $stmt = $pdo->prepare("UPDATE user_preferences SET prefs = ?, updated_at = NOW() WHERE user_id = ?");
            $stmt->execute([$prefs, $userId]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO user_preferences (user_id, prefs, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
            $stmt->execute([$userId, $prefs]);
        }

        sendJson(['success' => true, 'message' => 'Preferencias salvas.']);
        break;

    // ---- databank functions ----

    case 'dbCreateTable':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $tableName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['tableName'] ?? '');

        if (empty($database) || empty($tableName)) {
            sendJson(['success' => false, 'error' => 'Database e nome da tabela obrigatorios.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("CREATE TABLE `{$tableName}` ( id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) DEFAULT '' )");
            $conn->exec("INSERT INTO `{$tableName}` (nome) VALUES ('')");
            sendJson(['success' => true, 'message' => "Tabela '{$tableName}' criada com sucesso."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbAddColumn':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $columnName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['columnName'] ?? '');
        $columnType = $input['columnType'] ?? 'VARCHAR(255)';

        if (empty($database) || empty($table) || empty($columnName)) {
            sendJson(['success' => false, 'error' => 'Database, tabela e nome da coluna obrigatorios.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $safeType = preg_replace('/[^a-zA-Z0-9_(),\s]/', '', $columnType);
            $conn->exec("ALTER TABLE `{$table}` ADD `{$columnName}` {$safeType}");
            sendJson(['success' => true, 'message' => "Coluna '{$columnName}' adicionada."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbDropColumn':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $columnName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['columnName'] ?? '');

        if (empty($database) || empty($table) || empty($columnName)) {
            sendJson(['success' => false, 'error' => 'Database, tabela e nome da coluna obrigatorios.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("ALTER TABLE `{$table}` DROP COLUMN `{$columnName}`");
            sendJson(['success' => true, 'message' => "Coluna '{$columnName}' removida."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbRenameColumn':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $oldColumnName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['oldColumnName'] ?? '');
        $newColumnName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['newColumnName'] ?? '');
        $columnType = $input['columnType'] ?? 'VARCHAR(255)';

        if (empty($database) || empty($table) || empty($oldColumnName) || empty($newColumnName)) {
            sendJson(['success' => false, 'error' => 'Dados obrigatorios para renomear coluna.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $safeType = preg_replace('/[^a-zA-Z0-9_(),\s]/', '', $columnType);
            $conn->exec("ALTER TABLE `{$table}` CHANGE `{$oldColumnName}` `{$newColumnName}` {$safeType}");
            sendJson(['success' => true, 'message' => "Coluna renomeada de '{$oldColumnName}' para '{$newColumnName}'."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbRenameTable':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $oldTableName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['oldTableName'] ?? '');
        $newTableName = preg_replace('/[^a-zA-Z0-9_]/', '', $input['newTableName'] ?? '');

        if (empty($database) || empty($oldTableName) || empty($newTableName)) {
            sendJson(['success' => false, 'error' => 'Dados obrigatorios para renomear tabela.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->exec("RENAME TABLE `{$oldTableName}` TO `{$newTableName}`");
            sendJson(['success' => true, 'message' => "Tabela renomeada de '{$oldTableName}' para '{$newTableName}'."]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbDeleteRecords':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
        $primaryKeyColumn = preg_replace('/[^a-zA-Z0-9_]/', '', $input['primaryKeyColumn'] ?? '');
        $ids = $input['ids'] ?? [];

        if (empty($database) || empty($table) || empty($primaryKeyColumn) || empty($ids)) {
            sendJson(['success' => false, 'error' => 'Dados invalidos para remover registros.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $conn->beginTransaction();
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $sql = "DELETE FROM `{$table}` WHERE `{$primaryKeyColumn}` IN ({$placeholders})";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array_values($ids));
            $affected = $stmt->rowCount();
            $conn->commit();
            sendJson(['success' => true, 'message' => "{$affected} registro(s) removido(s)."]);
        } catch (PDOException $e) {
            if (isset($conn)) $conn->rollBack();
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'dbGetPrimaryKey':
        $user = requireAuth();
        $host = $input['host'] ?? '';
        $dbUser = $input['user'] ?? '';
        $dbPass = $input['password'] ?? '';
        $database = $input['database'] ?? '';
        $table = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');

        if (empty($database) || empty($table)) {
            sendJson(['success' => false, 'error' => 'Database e tabela obrigatorios.'], 400);
        }

        try {
            $conn = new PDO('mysql:host=' . $host . ';dbname=' . $database, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
            $descStmt = $conn->query("DESCRIBE `{$table}`");
            $columnsInfo = $descStmt->fetchAll();
            $primaryKey = null;
            foreach ($columnsInfo as $ci) {
                if ($ci['Key'] === 'PRI') {
                    $primaryKey = $ci['Field'];
                    break;
                }
            }
            sendJson(['success' => true, 'primaryKey' => $primaryKey, 'columns' => $columnsInfo]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

case 'adminCreateSlot':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) sendJson(['success' => false, 'error' => 'Denied'], 403);
        $date = $input['date'] ?? '';
        $time = $input['time'] ?? '';
        if (empty($date) || empty($time)) sendJson(['success' => false, 'error' => 'Data e hora obrigatorias']);
        $pdo->prepare("INSERT INTO consultation_slots (date_slot, time_slot, is_booked, payment_status) VALUES (?, ?, 0, 'pending')")->execute([$date, $time]);
        sendJson(['success' => true]);
        break;

    case 'adminDeleteSlot':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) sendJson(['success' => false, 'error' => 'Denied'], 403);
        $slotId = $input['slotId'] ?? null;
        if (!$slotId) sendJson(['success' => false, 'error' => 'ID obrigatorio']);
        $pdo->prepare("DELETE FROM consultation_slots WHERE id = ?")->execute([$slotId]);
        sendJson(['success' => true]);
        break;

    case 'verifyPayment':
        $user = requireAuth();
        $slotId = $input['slotId'] ?? null;
        if ($slotId) {
            $stmt = $pdo->prepare("SELECT stripe_session_id, payment_status FROM consultation_slots WHERE id = ?");
            $stmt->execute([$slotId]);
            $slot = $stmt->fetch();
            
            if ($slot && $slot['stripe_session_id'] && $slot['payment_status'] !== 'paid') {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/checkout/sessions/" . $slot['stripe_session_id']);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_USERPWD, env('STRIPE_SECRET_KEY', '') . ":");
                $response = json_decode(curl_exec($ch), true);
               unset($ch);
                
                if (isset($response['payment_status']) && $response['payment_status'] === 'paid') {
                    $pdo->prepare("UPDATE consultation_slots SET payment_status = 'paid' WHERE id = ?")->execute([$slotId]);
                    sendJson(['success' => true, 'status' => 'paid']);
                }
            }
        }
        sendJson(['success' => true, 'status' => 'pending']);
        break;

case 'adminBulkCreateSlots':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) { sendJson(['success' => false, 'error' => 'Denied'], 403); break; }

        $dates = $input['dates'] ?? [];
        $startTime = $input['startTime'] ?? '08:00';
        $endTime = $input['endTime'] ?? '17:00';
        $duration = (int)($input['duration'] ?? 30);
        $breakStart = $input['breakStart'] ?? null;
        $breakEnd = $input['breakEnd'] ?? null;
        $allowedTypes = $input['allowedTypes'] ?? ['clinical','counseling','laboratory'];

        if (empty($dates) || $duration < 5) {
            sendJson(['success' => false, 'error' => 'Invalid parameters.'], 400);
            break;
        }

        $allowedTypesStr = implode(',', $allowedTypes);
        $created = 0;

        $startMin = intval(substr($startTime, 0, 2)) * 60 + intval(substr($startTime, 3, 2));
        $endMin = intval(substr($endTime, 0, 2)) * 60 + intval(substr($endTime, 3, 2));
        $bStartMin = $breakStart ? (intval(substr($breakStart, 0, 2)) * 60 + intval(substr($breakStart, 3, 2))) : null;
        $bEndMin = $breakEnd ? (intval(substr($breakEnd, 0, 2)) * 60 + intval(substr($breakEnd, 3, 2))) : null;

        $timeSlots = [];
        $current = $startMin;
        while ($current + $duration <= $endMin) {
            if ($bStartMin !== null && $bEndMin !== null) {
                if ($current >= $bStartMin && $current < $bEndMin) {
                    $current = $bEndMin;
                    continue;
                }
                if ($current < $bStartMin && $current + $duration > $bStartMin) {
                    $current = $bEndMin;
                    continue;
                }
            }
            $h = str_pad(intdiv($current, 60), 2, '0', STR_PAD_LEFT);
            $m = str_pad($current % 60, 2, '0', STR_PAD_LEFT);
            $timeSlots[] = $h . ':' . $m;
            $current += $duration;
        }

        $stmtCheck = $pdo->prepare("SELECT id FROM consultation_slots WHERE date_slot = ? AND time_slot = ?");
        $stmtInsert = $pdo->prepare("INSERT INTO consultation_slots (date_slot, time_slot, is_booked, payment_status, allowed_types, slot_duration) VALUES (?, ?, 0, 'pending', ?, ?)");

        foreach ($dates as $date) {
            $safeDate = preg_replace('/[^0-9\-]/', '', $date);
            foreach ($timeSlots as $ts) {
                $stmtCheck->execute([$safeDate, $ts]);
                if (!$stmtCheck->fetch()) {
                    $stmtInsert->execute([$safeDate, $ts, $allowedTypesStr, $duration]);
                    $created++;
                }
            }
        }

        sendJson(['success' => true, 'created' => $created]);
        break;

    case 'adminGetAllBookings':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) { sendJson(['success' => false, 'error' => 'Denied'], 403); break; }
        $month = $_GET['month'] ?? date('Y-m');
        
        // Faz JOIN com consultations para buscar patient_name e email para o admin
        $stmt = $pdo->prepare("
            SELECT cs.*, c.patient_name, c.patient_email, c.reason 
            FROM consultation_slots cs 
            LEFT JOIN consultations c ON cs.id = c.slot_id 
            WHERE cs.date_slot LIKE ? AND cs.is_booked = 1 
            ORDER BY cs.date_slot ASC, cs.time_slot ASC
        ");
        $stmt->execute([$month . '%']);
        $bookings = $stmt->fetchAll();
        sendJson(['success' => true, 'bookings' => $bookings]);
        break;

    case 'adminCancelBooking':
        $user = requireAuth();
        if ($user['role'] !== 'admin' && empty($user['is_admin'])) { sendJson(['success' => false, 'error' => 'Denied'], 403); break; }
        $slotId = $input['slotId'] ?? null;
        $reason = $input['reason'] ?? '';
        if (!$slotId) { sendJson(['success' => false, 'error' => 'ID required']); break; }
        $pdo->prepare("UPDATE consultation_slots SET payment_status = 'cancelled', cancel_reason = ?, cancelled_at = NOW(), cancelled_by = 'admin' WHERE id = ?")->execute([$reason, $slotId]);
        sendJson(['success' => true, 'message' => 'Booking cancelled by admin.']);
        break;

    default:
        sendJson(['success' => false, 'error' => 'Acao desconhecida: ' . $action], 400);
        break;
}
