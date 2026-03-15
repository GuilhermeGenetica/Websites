<?php
header("Content-Type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>";
echo "<title>Diagnóstico Sticky Notes v2</title>";
echo "<style>
body { font-family: 'Segoe UI', monospace; background: #1a1a2e; color: #e0e0e0; padding: 20px; max-width: 1000px; margin: 0 auto; }
h1 { color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
h2 { color: #60a5fa; margin-top: 30px; }
h3 { color: #f59e0b; margin-top: 20px; }
.ok { color: #22c55e; font-weight: bold; }
.fail { color: #ef4444; font-weight: bold; }
.warn { color: #f59e0b; font-weight: bold; }
.info { color: #60a5fa; }
pre { background: #0d1117; padding: 12px; border-radius: 6px; overflow-x: auto; border: 1px solid #333; font-size: 0.85rem; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; }
th, td { border: 1px solid #444; padding: 8px 12px; text-align: left; font-size: 0.82rem; }
th { background: #2d2d44; color: #d4af37; }
tr:nth-child(even) { background: rgba(255,255,255,0.03); }
.section { background: rgba(255,255,255,0.03); border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0; }
.test-form { background: #0d1117; padding: 16px; border-radius: 8px; margin: 10px 0; }
.test-form label { display: block; margin: 8px 0 4px; color: #d4af37; font-size: 0.85rem; }
.test-form input, .test-form select, .test-form textarea { width: 100%; padding: 8px; background: #1a1a2e; color: #e0e0e0; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; box-sizing: border-box; }
.test-form button { background: #d4af37; color: #000; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 8px; }
.test-form button:hover { background: #e5c04b; }
.response-box { background: #0a0a15; border: 1px solid #555; padding: 12px; border-radius: 6px; margin-top: 10px; max-height: 300px; overflow-y: auto; }
</style></head><body>";

echo "<h1>🔍 Diagnóstico Completo — Sticky Notes v2</h1>";
echo "<p class='info'>Data/Hora: " . date('Y-m-d H:i:s') . " | PHP: " . phpversion() . "</p>";

$configPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../api/config.php',
    dirname(__DIR__) . '/api/config.php',
];

$configLoaded = false;
$pdo = null;

foreach ($configPaths as $p) {
    if (file_exists($p)) {
        echo "<p class='ok'>✅ config.php encontrado em: $p</p>";
        try {
            require_once $p;
            $configLoaded = true;
        } catch (Exception $ex) {
            echo "<p class='fail'>❌ Erro ao carregar config.php: " . $ex->getMessage() . "</p>";
        }
        break;
    }
}

if (!$configLoaded) {
    echo "<p class='fail'>❌ config.php NÃO encontrado nos caminhos tentados:</p><pre>";
    foreach ($configPaths as $p) echo "$p\n";
    echo "</pre>";

    echo "<h2>Tentativa de conexão manual via .env</h2>";
    $envPaths = [__DIR__ . '/.env', __DIR__ . '/../.env', dirname(__DIR__) . '/.env'];
    $envData = [];
    foreach ($envPaths as $ep) {
        if (file_exists($ep)) {
            echo "<p class='ok'>✅ .env encontrado em: $ep</p>";
            $lines = file($ep, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) $envData[trim($parts[0])] = trim($parts[1], " \t\n\r\0\x0B\"'");
            }
            break;
        }
    }

    if (!empty($envData)) {
        $host = $envData['DB_HOST'] ?? 'localhost';
        $name = $envData['DB_NAME'] ?? '';
        $user = $envData['DB_USER'] ?? '';
        $pass = $envData['DB_PASS'] ?? '';
        echo "<pre>DB_HOST=$host\nDB_NAME=$name\nDB_USER=$user\nDB_PASS=" . str_repeat('*', strlen($pass)) . "</pre>";
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            echo "<p class='ok'>✅ Conexão ao banco estabelecida manualmente via .env</p>";
        } catch (PDOException $e) {
            echo "<p class='fail'>❌ Falha na conexão: " . $e->getMessage() . "</p>";
        }
    }
}

if (!$pdo && isset($GLOBALS['pdo'])) $pdo = $GLOBALS['pdo'];

if (!$pdo) {
    foreach (get_defined_vars() as $vn => $vv) {
        if ($vv instanceof PDO) { $pdo = $vv; break; }
    }
}

if (!$pdo) {
    echo "<p class='fail'>❌ Nenhuma conexão PDO disponível. O diagnóstico não pode continuar.</p>";
    echo "</body></html>";
    exit;
}

echo "<hr>";

echo "<div class='section'>";
echo "<h2>1. Verificação da Tabela sticky_notes</h2>";

try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<h3>Tabelas no banco:</h3><pre>" . implode("\n", $tables) . "</pre>";

    if (!in_array('sticky_notes', $tables)) {
        echo "<p class='fail'>❌ Tabela 'sticky_notes' NÃO EXISTE!</p>";
        echo "<p class='warn'>Execute o SQL de criação:</p>";
        echo "<pre>
DROP TABLE IF EXISTS sticky_notes;

CREATE TABLE sticky_notes (
  id           INT(11)     NOT NULL AUTO_INCREMENT,
  author_id    INT(11)     NOT NULL,
  owner_id     INT(11)     NOT NULL,
  content      TEXT        DEFAULT NULL,
  color        VARCHAR(20) DEFAULT '#fef08a',
  x            INT(11)     DEFAULT 0,
  y            INT(11)     DEFAULT 0,
  width        INT(11)     DEFAULT 300,
  height       INT(11)     DEFAULT 300,
  is_collapsed TINYINT(1)  DEFAULT 0,
  is_hidden    TINYINT(1)  DEFAULT 0,
  created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_owner (owner_id),
  KEY idx_author (author_id),
  CONSTRAINT fk_sticky_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sticky_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</pre>";
    } else {
        echo "<p class='ok'>✅ Tabela 'sticky_notes' existe</p>";

        $cols = $pdo->query("DESCRIBE sticky_notes")->fetchAll();
        echo "<h3>Estrutura da tabela:</h3>";
        echo "<table><tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
        $colNames = array_column($cols, 'Field');
        foreach ($cols as $c) {
            echo "<tr><td>{$c['Field']}</td><td>{$c['Type']}</td><td>{$c['Null']}</td><td>{$c['Key']}</td><td>{$c['Default']}</td><td>{$c['Extra']}</td></tr>";
        }
        echo "</table>";

        $requiredCols = ['id', 'author_id', 'owner_id', 'content', 'color', 'x', 'y', 'width', 'height', 'is_collapsed', 'is_hidden', 'created_at', 'updated_at'];
        $missing = array_diff($requiredCols, $colNames);
        if (empty($missing)) {
            echo "<p class='ok'>✅ Todas as colunas obrigatórias presentes</p>";
        } else {
            echo "<p class='fail'>❌ Colunas em falta: " . implode(', ', $missing) . "</p>";
        }

        $obsoleteCols = ['user_id', 'type', 'text'];
        $found = array_intersect($obsoleteCols, $colNames);
        if (!empty($found)) {
            echo "<p class='warn'>⚠️ Colunas obsoletas encontradas (tabela antiga?): " . implode(', ', $found) . "</p>";
            echo "<p class='warn'>A tabela precisa ser recriada com o novo schema (author_id / owner_id).</p>";
        }
    }
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Erro SQL: " . $e->getMessage() . "</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>2. Verificação da Tabela users</h2>";
try {
    $usersData = $pdo->query("SELECT id, email, full_name, role, is_admin, subscription_type FROM users ORDER BY id ASC")->fetchAll();
    echo "<p class='info'>Total de utilizadores: " . count($usersData) . "</p>";
    echo "<table><tr><th>ID</th><th>Email</th><th>Nome</th><th>Role</th><th>is_admin</th><th>Subscription</th><th>Status</th></tr>";
    $hasAdmin = false;
    foreach ($usersData as $u) {
        $isAdm = ($u['role'] === 'admin' || $u['is_admin']);
        if ($isAdm) $hasAdmin = true;
        $status = $isAdm ? "<span class='ok'>ADMIN</span>" : "<span class='info'>user</span>";
        echo "<tr><td>{$u['id']}</td><td>{$u['email']}</td><td>{$u['full_name']}</td><td>{$u['role']}</td><td>{$u['is_admin']}</td><td>{$u['subscription_type']}</td><td>$status</td></tr>";
    }
    echo "</table>";

    if (!$hasAdmin) {
        echo "<p class='fail'>❌ NENHUM utilizador com role=admin e/ou is_admin=1!</p>";
        echo "<p class='warn'>Execute: <code>UPDATE users SET role = 'admin', is_admin = 1 WHERE email = 'SEU_EMAIL_AQUI';</code></p>";
    } else {
        echo "<p class='ok'>✅ Pelo menos um admin encontrado</p>";
    }
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Erro: " . $e->getMessage() . "</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>3. Dados Actuais na sticky_notes</h2>";
try {
    if (in_array('sticky_notes', $tables)) {
        $allNotes = $pdo->query("
            SELECT sn.*, 
                   ua.full_name AS author_name, ua.email AS author_email,
                   uo.full_name AS owner_name, uo.email AS owner_email
            FROM sticky_notes sn
            LEFT JOIN users ua ON sn.author_id = ua.id
            LEFT JOIN users uo ON sn.owner_id = uo.id
            ORDER BY sn.id ASC
        ")->fetchAll();

        echo "<p class='info'>Total de notas: " . count($allNotes) . "</p>";

        if (count($allNotes) > 0) {
            echo "<table><tr><th>ID</th><th>Author</th><th>Owner</th><th>Content (50ch)</th><th>Color</th><th>Pos</th><th>Size</th><th>Col</th><th>Hid</th><th>Created</th></tr>";
            foreach ($allNotes as $n) {
                $contentPreview = htmlspecialchars(mb_substr($n['content'] ?? '', 0, 50));
                $authorInfo = ($n['author_name'] ?? '?') . " (#{$n['author_id']})";
                $ownerInfo = ($n['owner_name'] ?? '?') . " (#{$n['owner_id']})";
                echo "<tr>
                    <td>{$n['id']}</td>
                    <td>{$authorInfo}</td>
                    <td>{$ownerInfo}</td>
                    <td>{$contentPreview}</td>
                    <td><span style='display:inline-block;width:14px;height:14px;background:{$n['color']};border:1px solid #666;border-radius:3px;vertical-align:middle;'></span> {$n['color']}</td>
                    <td>{$n['x']},{$n['y']}</td>
                    <td>{$n['width']}×{$n['height']}</td>
                    <td>{$n['is_collapsed']}</td>
                    <td>{$n['is_hidden']}</td>
                    <td>{$n['created_at']}</td>
                </tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='warn'>⚠️ Tabela vazia — nenhuma nota criada ainda (esperado se o sistema é novo).</p>";
        }
    }
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Erro: " . $e->getMessage() . "</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>4. Teste de Endpoints da API</h2>";

$apiBasePaths = [
    '/api/workbench.php',
    '/workbench.php',
];
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

echo "<h3>4a. Verificação de ficheiros</h3>";
$wbPaths = [
    __DIR__ . '/workbench.php',
    __DIR__ . '/../api/workbench.php',
    dirname(__DIR__) . '/api/workbench.php',
];
$wbFound = false;
foreach ($wbPaths as $wp) {
    if (file_exists($wp)) {
        echo "<p class='ok'>✅ workbench.php encontrado em: $wp</p>";
        $wbFound = true;

        $wbContent = file_get_contents($wp);

        $checks = [
            'getNotes'         => "case 'getNotes':",
            'createNote'       => "case 'createNote':",
            'saveNote'         => "case 'saveNote':",
            'deleteNote'       => "case 'deleteNote':",
            'adminGetUsers'    => "case 'adminGetUsers':",
            'adminGetUserNotes'=> "case 'adminGetUserNotes':",
        ];

        echo "<h3>Endpoints encontrados no workbench.php:</h3>";
        echo "<table><tr><th>Endpoint</th><th>Status</th></tr>";
        foreach ($checks as $name => $search) {
            $found = strpos($wbContent, $search) !== false;
            $status = $found ? "<span class='ok'>✅ Presente</span>" : "<span class='fail'>❌ NÃO encontrado</span>";
            echo "<tr><td>$name</td><td>$status</td></tr>";
        }
        echo "</table>";

        $oldChecks = [
            'adminBroadcastGlobal' => "case 'adminBroadcastGlobal':",
            'adminUpdateShared'    => "case 'adminUpdateShared':",
            'adminGetSharedNote'   => "case 'adminGetSharedNote':",
        ];
        $oldFound = [];
        foreach ($oldChecks as $n => $s) {
            if (strpos($wbContent, $s) !== false) $oldFound[] = $n;
        }
        if (!empty($oldFound)) {
            echo "<p class='warn'>⚠️ Endpoints antigos (v1) ainda presentes: " . implode(', ', $oldFound) . "</p>";
            echo "<p class='info'>Estes não fazem mal, mas podem ser removidos.</p>";
        }

        if (strpos($wbContent, 'author_id') !== false) {
            echo "<p class='ok'>✅ workbench.php referencia 'author_id' (schema v2)</p>";
        } else {
            echo "<p class='fail'>❌ workbench.php NÃO referencia 'author_id' — pode estar a usar o schema antigo!</p>";
        }

        break;
    }
}
if (!$wbFound) {
    echo "<p class='fail'>❌ workbench.php não encontrado!</p>";
}

echo "<h3>4b. Teste de autenticação (JWT)</h3>";
echo "<p class='info'>Para testar os endpoints da API, precisa de um token JWT válido.</p>";

$jwtSecret = null;
if (defined('JWT_SECRET')) {
    $jwtSecret = JWT_SECRET;
    echo "<p class='ok'>✅ JWT_SECRET definido (via config.php)</p>";
} elseif (!empty($envData['JWT_SECRET'])) {
    $jwtSecret = $envData['JWT_SECRET'];
    echo "<p class='ok'>✅ JWT_SECRET definido (via .env)</p>";
} else {
    echo "<p class='warn'>⚠️ JWT_SECRET não encontrado — testes de endpoint requerem token manual.</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>5. Teste Manual de Endpoints</h2>";
echo "<p class='info'>Cole aqui o seu token JWT (wb-token do localStorage do browser) para testar endpoints diretamente.</p>";

echo "<div class='test-form'>
<label>Token JWT (wb-token):</label>
<input type='text' id='jwt-token' placeholder='Cole o token aqui...' />

<label>Base URL da API:</label>
<input type='text' id='api-base' value='{$protocol}://{$host}/api/workbench.php' />

<div style='display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;'>
  <button onclick='testEndpoint(\"getNotes\", \"GET\")'>GET getNotes</button>
  <button onclick='testEndpoint(\"adminGetUsers\", \"GET\")'>GET adminGetUsers</button>
  <button onclick='testCreateNote()'>POST createNote (self)</button>
  <button onclick='testCreateNoteAll()'>POST createNote (all)</button>
  <button onclick='testDeleteLastNote()'>DELETE última nota</button>
</div>

<label>Resposta:</label>
<div class='response-box' id='response-output'><em>Aguardando teste...</em></div>
</div>";

echo "<script>
let lastNotes = [];

async function testEndpoint(action, method, body) {
  const token = document.getElementById('jwt-token').value.trim();
  const base = document.getElementById('api-base').value.trim();
  const out = document.getElementById('response-output');
  
  if (!token) { out.innerHTML = '<span style=\"color:#ef4444\">Token obrigatório!</span>'; return; }
  
  const url = base + '?action=' + action;
  const opts = {
    method: method || 'GET',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  
  out.innerHTML = '<em>A chamar ' + method + ' ' + action + '...</em>';
  
  try {
    const t0 = performance.now();
    const res = await fetch(url, opts);
    const t1 = performance.now();
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch(e) { parsed = null; }
    
    const statusColor = res.ok ? '#22c55e' : '#ef4444';
    let html = '<div style=\"margin-bottom:8px\">';
    html += '<strong style=\"color:' + statusColor + '\">HTTP ' + res.status + '</strong>';
    html += ' <span style=\"color:#999\">(' + Math.round(t1-t0) + 'ms)</span>';
    html += '</div>';
    
    if (parsed) {
      if (action === 'getNotes' && parsed.notes) {
        lastNotes = parsed.notes;
        html += '<div style=\"color:#60a5fa;margin-bottom:4px\">' + parsed.notes.length + ' notas encontradas</div>';
      }
      if (action === 'adminGetUsers' && parsed.users) {
        html += '<div style=\"color:#60a5fa;margin-bottom:4px\">' + parsed.users.length + ' utilizadores</div>';
      }
      html += '<pre style=\"white-space:pre-wrap;word-break:break-all;color:#e0e0e0\">' + JSON.stringify(parsed, null, 2) + '</pre>';
    } else {
      html += '<pre style=\"color:#f59e0b\">' + text.substring(0, 2000) + '</pre>';
    }
    
    out.innerHTML = html;
  } catch(err) {
    out.innerHTML = '<span style=\"color:#ef4444\">Erro: ' + err.message + '</span>';
  }
}

function testCreateNote() {
  testEndpoint('createNote', 'POST', {
    content: 'Nota de teste criada pelo diagnóstico — ' + new Date().toLocaleString(),
    color: '#bbf7d0',
    target_type: 'self',
    target_user_ids: []
  });
}

function testCreateNoteAll() {
  testEndpoint('createNote', 'POST', {
    content: 'Nota BROADCAST de teste — ' + new Date().toLocaleString(),
    color: '#bfdbfe',
    target_type: 'all',
    target_user_ids: []
  });
}

async function testDeleteLastNote() {
  const out = document.getElementById('response-output');
  if (lastNotes.length === 0) {
    out.innerHTML = '<span style=\"color:#f59e0b\">Execute getNotes primeiro para obter IDs.</span>';
    return;
  }
  const lastNote = lastNotes[lastNotes.length - 1];
  out.innerHTML = '<em>A apagar nota ID=' + lastNote.id + '...</em>';
  await testEndpoint('deleteNote', 'POST', { id: lastNote.id });
}
</script>";
echo "</div>";

echo "<div class='section'>";
echo "<h2>6. Verificação do Frontend (StickerNotes.jsx)</h2>";
$jsxPaths = [
    __DIR__ . '/../src/workbench/apps/StickerNotes.jsx',
    dirname(__DIR__) . '/src/workbench/apps/StickerNotes.jsx',
];
$jsxFound = false;
foreach ($jsxPaths as $jp) {
    if (file_exists($jp)) {
        echo "<p class='ok'>✅ StickerNotes.jsx encontrado em: $jp</p>";
        $jsxContent = file_get_contents($jp);
        $jsxFound = true;

        $jsxChecks = [
            ['createNote', 'Função createNote', "createNote"],
            ['deleteNote', 'Função deleteNote', "deleteNote"],
            ['adminGetUsers', 'Import adminGetUsers', "adminGetUsers"],
            ['adminGetUserNotes', 'Import adminGetUserNotes', "adminGetUserNotes"],
            ['StickyNoteWidget', 'Export StickyNoteWidget', "StickyNoteWidget"],
            ['author_id', 'Referência a author_id', "author_id"],
            ['owner_id / isAuthor', 'Lógica isAuthor', "isAuthor"],
            ['target_type', 'Campo target_type no create', "target_type"],
            ['CHAR_LIMIT', 'Limite de caracteres', "CHAR_LIMIT"],
            ['handleResizeStart', 'Resize manual', "handleResizeStart"],
        ];

        echo "<table><tr><th>Funcionalidade</th><th>Status</th></tr>";
        foreach ($jsxChecks as $chk) {
            $present = strpos($jsxContent, $chk[2]) !== false;
            $st = $present ? "<span class='ok'>✅ Presente</span>" : "<span class='fail'>❌ NÃO encontrado</span>";
            echo "<tr><td>{$chk[1]}</td><td>$st</td></tr>";
        }
        echo "</table>";

        if (strpos($jsxContent, 'adminBroadcastGlobal') !== false) {
            echo "<p class='warn'>⚠️ Referência a adminBroadcastGlobal (v1 antigo) ainda presente no JSX</p>";
        }

        break;
    }
}
if (!$jsxFound) {
    echo "<p class='warn'>⚠️ StickerNotes.jsx não encontrado nos caminhos verificados (normal se este diagnóstico está no servidor de produção).</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>7. Verificação do WorkbenchContext.jsx</h2>";
$ctxPaths = [
    __DIR__ . '/../src/contexts/WorkbenchContext.jsx',
    dirname(__DIR__) . '/src/contexts/WorkbenchContext.jsx',
];
foreach ($ctxPaths as $cp) {
    if (file_exists($cp)) {
        echo "<p class='ok'>✅ WorkbenchContext.jsx encontrado em: $cp</p>";
        $ctxContent = file_get_contents($cp);

        $ctxChecks = [
            ['createNote', 'Função createNote no contexto', 'const createNote'],
            ['deleteNote', 'Função deleteNote no contexto', 'const deleteNote'],
            ['fetchNotes', 'Função fetchNotes', 'const fetchNotes'],
            ['updateNoteState', 'Função updateNoteState', 'const updateNoteState'],
            ['Provider exports createNote', 'createNote no Provider value', 'createNote, deleteNote'],
        ];

        echo "<table><tr><th>Verificação</th><th>Status</th></tr>";
        foreach ($ctxChecks as $chk) {
            $present = strpos($ctxContent, $chk[2]) !== false;
            $st = $present ? "<span class='ok'>✅ OK</span>" : "<span class='fail'>❌ Faltando: {$chk[2]}</span>";
            echo "<tr><td>{$chk[1]}</td><td>$st</td></tr>";
        }
        echo "</table>";
        break;
    }
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>8. Verificação do api.js (workbenchApi)</h2>";
$apiJsPaths = [
    __DIR__ . '/../src/services/api.js',
    dirname(__DIR__) . '/src/services/api.js',
];
foreach ($apiJsPaths as $ap) {
    if (file_exists($ap)) {
        echo "<p class='ok'>✅ api.js encontrado em: $ap</p>";
        $apiContent = file_get_contents($ap);

        $apiChecks = [
            ['createNote', "action=createNote"],
            ['deleteNote', "action=deleteNote"],
            ['adminGetUserNotes', "action=adminGetUserNotes"],
            ['getNotes', "action=getNotes"],
            ['saveNote', "action=saveNote"],
            ['adminGetUsers', "action=adminGetUsers"],
        ];

        echo "<table><tr><th>Endpoint no api.js</th><th>Status</th></tr>";
        foreach ($apiChecks as $chk) {
            $present = strpos($apiContent, $chk[1]) !== false;
            $st = $present ? "<span class='ok'>✅ OK</span>" : "<span class='fail'>❌ NÃO encontrado</span>";
            echo "<tr><td>{$chk[0]}</td><td>$st</td></tr>";
        }
        echo "</table>";
        break;
    }
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>9. Teste Directo de INSERT/SELECT/DELETE</h2>";
try {
    if (in_array('sticky_notes', $tables) && !empty($usersData) && in_array('author_id', $colNames ?? [])) {
        $testUserId = $usersData[0]['id'];
        echo "<p class='info'>A usar user ID={$testUserId} ({$usersData[0]['email']}) para teste...</p>";

        $pdo->prepare("INSERT INTO sticky_notes (author_id, owner_id, content, color) VALUES (?, ?, ?, ?)")
            ->execute([$testUserId, $testUserId, 'TESTE DIAGNOSTICO ' . date('H:i:s'), '#fecaca']);
        $insertId = $pdo->lastInsertId();
        echo "<p class='ok'>✅ INSERT OK — ID=$insertId</p>";

        $stmt = $pdo->prepare("SELECT * FROM sticky_notes WHERE id = ?");
        $stmt->execute([$insertId]);
        $row = $stmt->fetch();
        if ($row) {
            echo "<p class='ok'>✅ SELECT OK — content='{$row['content']}', author_id={$row['author_id']}, owner_id={$row['owner_id']}</p>";
        } else {
            echo "<p class='fail'>❌ SELECT falhou — registo não encontrado</p>";
        }

        $pdo->prepare("DELETE FROM sticky_notes WHERE id = ?")->execute([$insertId]);
        echo "<p class='ok'>✅ DELETE OK — nota de teste removida</p>";
    } elseif (in_array('sticky_notes', $tables) && !in_array('author_id', $colNames ?? [])) {
        echo "<p class='fail'>❌ A tabela sticky_notes existe mas NÃO tem a coluna 'author_id' — schema antigo!</p>";
        echo "<p class='warn'>É necessário DROP e recriar a tabela com o novo schema.</p>";
    } else {
        echo "<p class='warn'>⚠️ Não foi possível executar o teste (tabela ou utilizadores indisponíveis).</p>";
    }
} catch (PDOException $e) {
    echo "<p class='fail'>❌ Erro no teste: " . $e->getMessage() . "</p>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>📋 Resumo e Acções Recomendadas</h2>";
echo "<ol style='line-height:2; font-size:0.9rem;'>";
echo "<li>Se a tabela sticky_notes tem colunas <code>user_id</code> ou <code>type</code> → <strong>DROP TABLE e recriar</strong></li>";
echo "<li>Se nenhum user tem <code>role='admin'</code> → <strong>UPDATE users SET role='admin', is_admin=1</strong></li>";
echo "<li>Se workbench.php não tem <code>case 'createNote'</code> → <strong>Atualizar o ficheiro</strong></li>";
echo "<li>Se api.js não tem <code>action=createNote</code> → <strong>Atualizar o ficheiro</strong></li>";
echo "<li>Se WorkbenchContext.jsx não tem <code>const createNote</code> → <strong>Atualizar o ficheiro</strong></li>";
echo "<li>Após alterações no frontend → <strong>npm run build</strong> e deploy</li>";
echo "</ol>";
echo "</div>";

echo "<p style='text-align:center; color:#666; margin-top:30px; font-size:0.75rem;'>Diagnóstico Sticky Notes v2 · " . date('Y-m-d H:i:s') . "</p>";
echo "</body></html>";
?>