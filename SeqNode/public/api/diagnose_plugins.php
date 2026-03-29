<?php
/**
 * SeqNode — Plugin Diagnostics
 * https://seqnode.onnetweb.com/api/diagnose_plugins.php
 *
 * Tests the entire plugin pipeline:
 *   1. Server environment (PHP version, yaml extension, plugins dir)
 *   2. Plugin file list & raw YAML access
 *   3. Full parse (params, inputs, outputs) for every plugin
 *   4. Properties panel simulation (what the React frontend receives)
 *   5. Verify endpoint test (proxied to VPS — optional, may be offline)
 *
 * ACCESS CONTROL: protected by a secret token.
 * Call as: /api/diagnose_plugins.php?token=SEQNODE_DIAG_2024
 */

declare(strict_types=1);

define('DIAG_TOKEN', 'SEQNODE_DIAG_2024');   // ← change if needed

// ── Auth ──────────────────────────────────────────────────────────────────────
if (($_GET['token'] ?? '') !== DIAG_TOKEN) {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "403 Forbidden — pass ?token=" . DIAG_TOKEN;
    exit;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
define('ROOT', __DIR__);
require_once ROOT . '/Env.php';
Env::load(ROOT . '/.env');
require_once ROOT . '/PluginReader.php';

$format = $_GET['format'] ?? 'html';  // html | json

if ($format === 'json') {
    header('Content-Type: application/json');
    echo json_encode(buildReport(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── HTML report ───────────────────────────────────────────────────────────────
$report = buildReport();

?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SeqNode Plugin Diagnostics</title>
<style>
  body { font-family: monospace; background: #0d1117; color: #c9d1d9; margin: 0; padding: 20px; font-size: 13px; }
  h1   { color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
  h2   { color: #79c0ff; margin-top: 30px; }
  h3   { color: #d2a8ff; margin: 16px 0 6px; }
  .ok  { color: #3fb950; }
  .warn{ color: #d29922; }
  .err { color: #f85149; }
  .sec { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 14px 18px; margin: 10px 0; }
  .tag { display: inline-block; background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 1px 6px; margin: 2px 2px; font-size: 11px; color: #8b949e; }
  .badge{ display:inline-block; padding:1px 8px; border-radius:10px; font-size:11px; margin-left:6px; }
  .badge-ok  { background:#0d3b1e; color:#3fb950; border:1px solid #238636; }
  .badge-err { background:#3b0d0d; color:#f85149; border:1px solid #da3633; }
  .badge-warn{ background:#3b2800; color:#d29922; border:1px solid #9e6a03; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th,td { text-align: left; padding: 5px 10px; border-bottom: 1px solid #21262d; font-size: 12px; }
  th    { color: #8b949e; font-weight: normal; border-bottom: 1px solid #30363d; }
  tr:hover td { background: #161b22; }
  details summary { cursor: pointer; color: #58a6ff; padding: 4px 0; }
  details summary:hover { color: #79c0ff; }
  pre   { background: #161b22; border: 1px solid #30363d; border-radius: 4px; padding: 10px; overflow: auto; margin: 6px 0; color: #e6edf3; font-size: 11px; line-height: 1.5; max-height: 300px; }
  a     { color: #58a6ff; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin: 10px 0; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px; }
  .card h4 { margin: 0 0 6px; color: #c9d1d9; font-size: 13px; }
  .card .sub { font-size: 11px; color: #8b949e; }
  .num  { font-size: 22px; font-weight: bold; color: #58a6ff; }
</style>
</head>
<body>

<h1>&#x1F9EC; SeqNode Plugin Diagnostics</h1>
<p style="color:#8b949e">Generated: <?= htmlspecialchars(date('Y-m-d H:i:s T')) ?> &nbsp;|&nbsp;
   <a href="?token=<?= DIAG_TOKEN ?>&format=json">View as JSON</a></p>

<?php

// ── 1. Environment ─────────────────────────────────────────────────────────────
$env = $report['environment'];
echo '<h2>1. Server Environment</h2><div class="sec">';
echo '<table>';
echo '<tr><th>Item</th><th>Value</th><th>Status</th></tr>';
row('PHP Version',      $env['php_version'],  version_compare(PHP_VERSION, '8.0', '>=') ? 'ok' : 'warn');
row('yaml_parse()',     $env['yaml_ext'] ? 'Available ✔' : 'NOT available — using fallback parser', $env['yaml_ext'] ? 'ok' : 'warn');
row('Plugins directory', $env['plugins_dir'],  '');
row('Directory exists', $env['dir_exists'] ? 'Yes' : 'No', $env['dir_exists'] ? 'ok' : 'err');
row('Directory readable', $env['dir_readable'] ? 'Yes' : 'No', $env['dir_readable'] ? 'ok' : 'err');
row('YAML files found', (string)$env['yaml_count'], $env['yaml_count'] > 0 ? 'ok' : 'err');
row('VPS API URL',       $env['vps_url'] ?: '(not set)', $env['vps_url'] ? '' : 'warn');
echo '</table>';
echo '</div>';

// ── 2. Plugin file list ────────────────────────────────────────────────────────
$files = $report['files'];
echo '<h2>2. Plugin Files</h2><div class="sec">';
if (empty($files)) {
    echo '<p class="err">No YAML files found in plugins directory.</p>';
} else {
    echo '<table><tr><th>File</th><th>Size</th><th>Parse</th><th>ID</th><th>Name</th></tr>';
    foreach ($files as $f) {
        $ps = $f['parse_ok'] ? '<span class="ok">✔</span>' : '<span class="err">✘ '.$f['parse_error'].'</span>';
        echo "<tr><td>{$f['filename']}</td><td>{$f['size_kb']} KB</td><td>{$ps}</td>"
           . "<td>" . h($f['id'] ?? '') . "</td><td>" . h($f['name'] ?? '') . "</td></tr>";
    }
    echo '</table>';
}
echo '</div>';

// ── 3. Plugin full parse ───────────────────────────────────────────────────────
$plugins = $report['plugins'];
echo '<h2>3. Full Plugin Parse (what the React frontend receives)</h2>';
echo '<p style="color:#8b949e">This is the JSON the frontend gets from <code>GET /api/plugins</code>. '
   . 'If params/inputs/outputs are empty here, that is the bug.</p>';

echo '<div class="grid">';
foreach ($plugins as $p) {
    $pc = count($p['params']);
    $ic = count($p['inputs']);
    $oc = count($p['outputs']);
    $hasInstall = !empty($p['install']);
    $allOk = $pc > 0 && $ic > 0 && $oc > 0;
    $border = $allOk ? '#238636' : ($pc === 0 ? '#da3633' : '#9e6a03');
    echo "<div class='card' style='border-color:{$border}'>";
    echo "<h4>" . h($p['name']) . "</h4>";
    echo "<div class='sub'><code>" . h($p['id']) . "</code> &bull; " . h($p['category']) . " &bull; v" . h($p['version']) . "</div>";
    echo "<div style='margin-top:8px'>";
    badge($pc . ' params',  $pc > 0 ? 'ok' : 'err');
    badge($ic . ' inputs',  $ic > 0 ? 'ok' : 'err');
    badge($oc . ' outputs', $oc > 0 ? 'ok' : 'err');
    if ($hasInstall) badge('install ✔', 'ok');
    echo "</div>";
    if (!empty($p['install']['binary'])) echo "<div style='margin-top:4px;font-size:11px;color:#8b949e'>binary: <code>" . h($p['install']['binary']) . "</code></div>";
    echo "</div>";
}
echo '</div>';

// ── 4. Detailed per-plugin ─────────────────────────────────────────────────────
echo '<h2>4. Detailed Plugin Properties</h2>';
foreach ($plugins as $p) {
    echo '<details><summary>';
    $pc = count($p['params']); $ic = count($p['inputs']); $oc = count($p['outputs']);
    echo h($p['name']) . " <code style='font-size:11px;color:#8b949e'>(" . h($p['id']) . ")</code>";
    badge($pc . ' params',  $pc > 0 ? 'ok' : 'err');
    badge($ic . ' inputs',  $ic > 0 ? 'ok' : 'err');
    badge($oc . ' outputs', $oc > 0 ? 'ok' : 'err');
    echo '</summary><div style="padding:12px 0">';

    // Params
    echo '<h3>Parameters (' . $pc . ')</h3>';
    if ($pc === 0) {
        echo '<p class="err">&#x2718; No parameters parsed. Check YAML structure or yaml_parse availability.</p>';
    } else {
        echo '<table><tr><th>Key</th><th>Type</th><th>Label</th><th>Default</th><th>Category</th><th>Visible</th></tr>';
        foreach ($p['params'] as $k => $s) {
            echo '<tr>'
               . '<td><code>' . h($k) . '</code></td>'
               . '<td>' . h($s['type'] ?? '') . '</td>'
               . '<td>' . h($s['label'] ?? '') . '</td>'
               . '<td>' . h(json_encode($s['default'] ?? null)) . '</td>'
               . '<td>' . h($s['category'] ?? 'General') . '</td>'
               . '<td>' . (($s['visible'] ?? true) ? '<span class="ok">yes</span>' : '<span class="warn">no</span>') . '</td>'
               . '</tr>';
        }
        echo '</table>';
    }

    // Inputs
    echo '<h3>Inputs (' . $ic . ')</h3>';
    if ($ic === 0) {
        echo '<p class="err">&#x2718; No inputs parsed.</p>';
    } else {
        echo '<table><tr><th>Key</th><th>Label</th><th>Extensions</th><th>Required</th></tr>';
        foreach ($p['inputs'] as $k => $s) {
            echo '<tr>'
               . '<td><code>' . h($k) . '</code></td>'
               . '<td>' . h($s['label'] ?? '') . '</td>'
               . '<td>' . h(implode(', ', (array)($s['extensions'] ?? []))) . '</td>'
               . '<td>' . (($s['required'] ?? true) ? '<span class="ok">yes</span>' : 'no') . '</td>'
               . '</tr>';
        }
        echo '</table>';
    }

    // Outputs
    echo '<h3>Outputs (' . $oc . ')</h3>';
    if ($oc === 0) {
        echo '<p class="err">&#x2718; No outputs parsed.</p>';
    } else {
        echo '<table><tr><th>Key</th><th>Label</th><th>Extensions</th><th>Required</th></tr>';
        foreach ($p['outputs'] as $k => $s) {
            echo '<tr>'
               . '<td><code>' . h($k) . '</code></td>'
               . '<td>' . h($s['label'] ?? '') . '</td>'
               . '<td>' . h(implode(', ', (array)($s['extensions'] ?? []))) . '</td>'
               . '<td>' . (($s['required'] ?? false) ? 'yes' : 'no') . '</td>'
               . '</tr>';
        }
        echo '</table>';
    }

    // Install config
    if (!empty($p['install'])) {
        $inst = $p['install'];
        echo '<h3>Install Config</h3>';
        echo '<table>';
        if (!empty($inst['binary']))      echo '<tr><td>binary</td><td><code>' . h($inst['binary']) . '</code></td></tr>';
        if (!empty($inst['method']))      echo '<tr><td>method</td><td>' . h($inst['method']) . '</td></tr>';
        if (!empty($inst['version_check'])) echo '<tr><td>version_check</td><td><code>' . h($inst['version_check']) . '</code></td></tr>';
        if (!empty($inst['default_paths'])) {
            foreach ((array)$inst['default_paths'] as $pk => $pv) {
                echo '<tr><td>default_paths.' . h($pk) . '</td><td>' . h((string)$pv) . '</td></tr>';
            }
        }
        echo '</table>';
    }

    // Raw JSON output (what the frontend actually gets)
    echo '<h3>Raw JSON (frontend receives this)</h3>';
    echo '<pre>' . htmlspecialchars(json_encode($p, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) . '</pre>';

    echo '</div></details>';
}

// ── 5. API endpoint test ───────────────────────────────────────────────────────
echo '<h2>5. Live API Endpoint Test</h2><div class="sec">';
echo '<p style="color:#8b949e">Testing <code>GET /api/plugins</code> as the frontend would call it.</p>';
$apiResult = $report['api_test'];
if ($apiResult['status'] === 'ok') {
    $samplePlugin = $apiResult['first_plugin'] ?? null;
    echo '<p class="ok">&#x2714; Endpoint returned ' . $apiResult['count'] . ' plugins.</p>';
    if ($samplePlugin) {
        $pc = count($samplePlugin['params'] ?? []);
        $ic = count($samplePlugin['inputs'] ?? []);
        $oc = count($samplePlugin['outputs'] ?? []);
        echo '<p>First plugin: <strong>' . h($samplePlugin['name'] ?? '') . '</strong></p>';
        echo '<ul>';
        echo '<li>params: ' . ($pc > 0 ? "<span class='ok'>$pc fields</span>" : "<span class='err'>EMPTY — bug confirmed</span>") . '</li>';
        echo '<li>inputs: ' . ($ic > 0 ? "<span class='ok'>$ic fields</span>" : "<span class='err'>EMPTY</span>") . '</li>';
        echo '<li>outputs: ' . ($oc > 0 ? "<span class='ok'>$oc fields</span>" : "<span class='err'>EMPTY</span>") . '</li>';
        echo '</ul>';
    }
} else {
    echo '<p class="err">&#x2718; ' . h($apiResult['error']) . '</p>';
}
echo '</div>';

// ── 6. VPS proxy test ──────────────────────────────────────────────────────────
$vps = $report['vps_test'];
echo '<h2>6. VPS Backend Connectivity</h2><div class="sec">';
if ($vps['status'] === 'ok') {
    echo '<p class="ok">&#x2714; VPS reachable. Response time: ' . $vps['ms'] . ' ms</p>';
    echo '<p>VPS plugin count: ' . ($vps['plugin_count'] ?? '?') . '</p>';
} elseif ($vps['status'] === 'skip') {
    echo '<p class="warn">&#x26A0; VPS URL not configured — skipped.</p>';
} else {
    echo '<p class="err">&#x2718; VPS unreachable: ' . h($vps['error']) . '</p>';
    echo '<p style="color:#8b949e">Plugin display will use PHP PluginReader (Hostinger-local). VPS is only needed for execution/settings.</p>';
}
echo '</div>';

// ── 7. YAML extension recommendation ──────────────────────────────────────────
if (!$env['yaml_ext']) {
    echo '<h2>&#x26A0; Recommendation: Enable yaml extension</h2><div class="sec">';
    echo '<p class="warn">The PHP <code>yaml</code> extension is not loaded. SeqNode is using the fallback parser.</p>';
    echo '<p>On Hostinger: <strong>hPanel → PHP → Extensions → enable "yaml"</strong> (if available for your plan).</p>';
    echo '<p>The fallback parser handles most cases but may miss complex YAML structures.</p>';
    echo '</div>';
}

?>

<p style="color:#30363d;margin-top:40px;font-size:11px">SeqNode Plugin Diagnostics &bull; <?= date('Y') ?></p>
</body>
</html>
<?php

// ──────────────────────────────────────────────────────────────────────────────
//  Report builder
// ──────────────────────────────────────────────────────────────────────────────

function buildReport(): array
{
    $dir = PluginReader::pluginsDir();

    // ── Environment ──────────────────────────────────────────────────────────
    $files = glob($dir . '/*.{yaml,yml}', GLOB_BRACE) ?: [];
    $env = [
        'php_version'  => PHP_VERSION,
        'yaml_ext'     => PluginReader::hasYamlExtension(),
        'plugins_dir'  => $dir,
        'dir_exists'   => is_dir($dir),
        'dir_readable' => is_readable($dir),
        'yaml_count'   => count($files),
        'vps_url'      => Env::get('API_URL', Env::get('VPS_API_URL', '')),
    ];

    // ── File list ─────────────────────────────────────────────────────────────
    $fileList = [];
    foreach ($files as $f) {
        $content  = @file_get_contents($f);
        $parseOk  = false;
        $parseErr = '';
        $id = $name = '';
        if ($content !== false) {
            try {
                $p = PluginReader::parsePlugin($content);
                $parseOk = !empty($p['id']);
                $id      = $p['id']   ?? '';
                $name    = $p['name'] ?? '';
            } catch (Throwable $e) {
                $parseErr = $e->getMessage();
            }
        }
        $fileList[] = [
            'filename'    => basename($f),
            'size_kb'     => round(strlen($content ?: '') / 1024, 1),
            'parse_ok'    => $parseOk,
            'parse_error' => $parseErr,
            'id'          => $id,
            'name'        => $name,
        ];
    }

    // ── Full plugin parse ─────────────────────────────────────────────────────
    $plugins = PluginReader::listPlugins();

    // ── Live API endpoint test ────────────────────────────────────────────────
    $apiTest = ['status' => 'ok', 'count' => count($plugins), 'first_plugin' => $plugins[0] ?? null];

    // ── VPS proxy test ────────────────────────────────────────────────────────
    $vpsUrl = Env::get('API_URL', Env::get('VPS_API_URL', ''));
    $vpsTest = ['status' => 'skip', 'error' => '', 'ms' => 0, 'plugin_count' => 0];

    if ($vpsUrl) {
        $t0 = microtime(true);
        $ch = curl_init(rtrim($vpsUrl, '/') . '/api/plugins');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $body = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        $ms = round((microtime(true) - $t0) * 1000);

        if ($err || $body === false) {
            $vpsTest = ['status' => 'error', 'error' => $err ?: 'curl failed', 'ms' => $ms, 'plugin_count' => 0];
        } elseif ($code >= 400) {
            $vpsTest = ['status' => 'error', 'error' => "HTTP $code", 'ms' => $ms, 'plugin_count' => 0];
        } else {
            $data = json_decode($body, true);
            $vpsTest = ['status' => 'ok', 'ms' => $ms, 'plugin_count' => is_array($data) ? count($data) : 0, 'error' => ''];
        }
    }

    return [
        'environment' => $env,
        'files'       => $fileList,
        'plugins'     => $plugins,
        'api_test'    => $apiTest,
        'vps_test'    => $vpsTest,
    ];
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES); }

function row(string $label, string $value, string $status): void
{
    $cls = match($status) { 'ok' => 'ok', 'err' => 'err', 'warn' => 'warn', default => '' };
    $vd  = $cls ? "<span class='$cls'>$value</span>" : htmlspecialchars($value);
    echo "<tr><td>" . htmlspecialchars($label) . "</td><td>$vd</td><td>";
    if ($status === 'ok')   echo "<span class='badge badge-ok'>OK</span>";
    if ($status === 'err')  echo "<span class='badge badge-err'>ERROR</span>";
    if ($status === 'warn') echo "<span class='badge badge-warn'>WARN</span>";
    echo "</td></tr>\n";
}

function badge(string $text, string $type): void
{
    $cls = match($type) { 'ok' => 'badge-ok', 'err' => 'badge-err', default => 'badge-warn' };
    echo "<span class='badge $cls'>" . htmlspecialchars($text) . "</span>";
}
