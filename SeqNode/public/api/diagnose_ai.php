<?php
/**
 * SeqNode-OS — AI Builder & Agent Diagnostic
 * Access: https://seqnode.onnetweb.com/api/diagnose_ai.php
 * DELETE THIS FILE after diagnosis is complete.
 *
 * Tests:
 *  1. VPS connectivity
 *  2. Connected agents
 *  3. Dep Analysis via agent (samtools)
 *  4. Direct LLM API connectivity (any provider)
 *  5. AI Workflow Builder via VPS
 *  6. AI test-connection endpoint
 */

header('Content-Type: text/html; charset=utf-8');
set_time_limit(90);

$VPS_URL = "https://api.seqnode.onnetweb.com";

// Accept values from POST form only (not GET — credentials stay out of URLs)
$php_token   = trim($_POST['php_token']   ?? '');
$provider    = trim($_POST['provider']    ?? 'anthropic');
$api_key     = trim($_POST['api_key']     ?? '');
$api_base    = trim($_POST['api_base']    ?? '');
$model       = trim($_POST['model']       ?? '');
$test_prompt = trim($_POST['prompt']      ?? 'Create a simple exome sequencing pipeline using BWA-MEM and GATK. Return only a minimal 2-step workflow JSON.');

// ── Provider presets ─────────────────────────────────────────────────────────
$PROVIDERS = [
    'anthropic' => [
        'label'       => 'Anthropic (Claude)',
        'endpoint'    => 'https://api.anthropic.com/v1/messages',
        'models'      => ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'],
        'key_hint'    => 'sk-ant-api03-…',
    ],
    'openai' => [
        'label'       => 'OpenAI (GPT)',
        'endpoint'    => 'https://api.openai.com/v1/chat/completions',
        'models'      => ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        'key_hint'    => 'sk-…',
    ],
    'gemini' => [
        'label'       => 'Google Gemini',
        'endpoint'    => 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        'models'      => ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        'key_hint'    => 'AIza…',
    ],
    'grok' => [
        'label'       => 'xAI Grok',
        'endpoint'    => 'https://api.x.ai/v1/chat/completions',
        'models'      => ['grok-3', 'grok-3-mini', 'grok-2'],
        'key_hint'    => 'xai-…',
    ],
    'ollama' => [
        'label'       => 'Ollama (local)',
        'endpoint'    => 'http://localhost:11434/v1/chat/completions',
        'models'      => ['llama3.3', 'mistral', 'deepseek-r1', 'qwen2.5'],
        'key_hint'    => '(no key needed)',
    ],
    'custom' => [
        'label'       => 'Custom / OpenAI-compatible',
        'endpoint'    => '',
        'models'      => [],
        'key_hint'    => '(optional)',
    ],
];

$providerCfg = $PROVIDERS[$provider] ?? $PROVIDERS['anthropic'];
$defaultModel = $model ?: ($providerCfg['models'][0] ?? '');

// ── Helpers ──────────────────────────────────────────────────────────────────

function curl_json(string $url, string $method, array $headers, ?array $body = null, int $timeout = 30): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => array_map(fn($k, $v) => "$k: $v", array_keys($headers), $headers),
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw    = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);
    $decoded = $raw ? json_decode($raw, true) : null;
    return ['status' => $status, 'body' => $decoded, 'raw' => $raw, 'curl_err' => $err];
}

function badge(bool $ok, string $yes = 'OK', string $no = 'FAIL'): string {
    return $ok
        ? "<span style='color:#4ade80;font-weight:bold'>&#x2705; $yes</span>"
        : "<span style='color:#f87171;font-weight:bold'>&#x274C; $no</span>";
}

function code_block(string $text): string {
    return "<pre style='background:#1e293b;padding:10px;border-radius:4px;font-size:11px;max-height:300px;overflow:auto;white-space:pre-wrap'>"
         . htmlspecialchars(mb_substr($text, 0, 4000)) . (strlen($text) > 4000 ? "\n[...truncated]" : "")
         . "</pre>";
}

/**
 * Test any LLM provider with a minimal "say OK" request.
 * Returns ['ok' => bool, 'text' => string, 'model' => string, 'error' => string, 'status' => int]
 */
function test_llm_direct(string $provider, string $api_key, string $model, string $api_base): array {
    global $PROVIDERS;
    $cfg = $PROVIDERS[$provider] ?? null;
    if (!$cfg) return ['ok' => false, 'error' => "Unknown provider: $provider", 'status' => 0];

    $endpoint = $api_base ?: $cfg['endpoint'];
    if (!$endpoint) return ['ok' => false, 'error' => 'No API endpoint configured.', 'status' => 0];

    if ($provider === 'anthropic') {
        $endpoint = str_replace('{model}', $model, $endpoint);
        $r = curl_json($endpoint, 'POST', [
            'x-api-key'         => $api_key,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ], [
            'model'      => $model ?: 'claude-haiku-4-5-20251001',
            'max_tokens' => 16,
            'system'     => 'Reply only with "OK".',
            'messages'   => [['role' => 'user', 'content' => 'Say OK']],
        ], 20);
        $ok   = $r['status'] === 200;
        $text = $r['body']['content'][0]['text'] ?? '';
        $err  = $r['body']['error']['message'] ?? '';
        return ['ok' => $ok, 'text' => $text, 'model' => $r['body']['model'] ?? $model, 'error' => $err, 'status' => $r['status']];

    } elseif ($provider === 'gemini') {
        $m   = $model ?: 'gemini-2.0-flash';
        $url = str_replace('{model}', $m, $endpoint) . "?key=$api_key";
        $r = curl_json($url, 'POST', ['content-type' => 'application/json'], [
            'contents' => [['parts' => [['text' => 'Say OK']]]],
            'generationConfig' => ['maxOutputTokens' => 8],
        ], 20);
        $ok   = $r['status'] === 200;
        $text = $r['body']['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $err  = $r['body']['error']['message'] ?? '';
        return ['ok' => $ok, 'text' => $text, 'model' => $m, 'error' => $err, 'status' => $r['status']];

    } else {
        // OpenAI-compatible: openai, grok, ollama, custom
        $hdrs = ['content-type' => 'application/json'];
        if ($api_key && $api_key !== '(no key needed)') $hdrs['Authorization'] = "Bearer $api_key";
        $r = curl_json($endpoint, 'POST', $hdrs, [
            'model'       => $model ?: ($PROVIDERS[$provider]['models'][0] ?? 'gpt-4o'),
            'max_tokens'  => 8,
            'messages'    => [
                ['role' => 'system', 'content' => 'Reply only with "OK".'],
                ['role' => 'user',   'content' => 'Say OK'],
            ],
        ], 20);
        $ok   = $r['status'] === 200;
        $text = $r['body']['choices'][0]['message']['content'] ?? '';
        $err  = $r['body']['error']['message'] ?? '';
        $mdl  = $r['body']['model'] ?? $model;
        return ['ok' => $ok, 'text' => $text, 'model' => $mdl, 'error' => $err, 'status' => $r['status']];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SeqNode — AI & Agent Diagnostic</title>
<style>
  body  { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 20px; max-width: 960px; margin: 0 auto; }
  h1    { color: #7c6ff7; border-bottom: 1px solid #334155; padding-bottom: 8px; }
  h2    { color: #94a3b8; margin-top: 28px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
  .card { background: #1e293b; border-radius: 8px; padding: 16px; margin-top: 10px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .form-full  { grid-column: 1 / -1; }
  label { display: block; color: #94a3b8; font-size: 12px; margin-bottom: 4px; margin-top: 8px; }
  input, select, textarea {
    width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155;
    color: #e2e8f0; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px;
  }
  select option { background: #1e293b; }
  textarea { resize: vertical; }
  button { background: #7c6ff7; color: #fff; border: none; padding: 10px 24px; border-radius: 6px;
            cursor: pointer; font-size: 13px; font-weight: 700; margin-top: 12px; }
  button:hover { background: #6c5fe7; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 5px 10px; border: 1px solid #334155; font-size: 12px; vertical-align: top; }
  th { background: #0f172a; color: #94a3b8; white-space: nowrap; }
  .note { color: #64748b; font-size: 11px; margin-top: 4px; }
  .hint { color: #64748b; font-size: 11px; }
  .provider-tag { display: inline-block; background: #334155; border-radius: 3px; padding: 1px 6px; font-size: 11px; }
</style>
<script>
function onProviderChange() {
    const p = document.getElementById('sel-provider').value;
    const presets = <?= json_encode(array_map(fn($v) => [
        'models'   => $v['models'],
        'endpoint' => $v['endpoint'],
        'key_hint' => $v['key_hint'],
    ], $PROVIDERS)) ?>;

    const cfg   = presets[p] || {};
    const sel   = document.getElementById('sel-model');
    const base  = document.getElementById('inp-base');
    const keyi  = document.getElementById('inp-key');

    // Populate model dropdown
    sel.innerHTML = '';
    (cfg.models || []).forEach(m => {
        const o = document.createElement('option'); o.value = o.textContent = m; sel.appendChild(o);
    });
    if (!(cfg.models || []).length) {
        const o = document.createElement('option'); o.value = ''; o.textContent = '(enter below)'; sel.appendChild(o);
    }

    // Set base URL hint
    base.placeholder = cfg.endpoint || 'https://…';

    // Key hint
    if (keyi) keyi.placeholder = cfg.key_hint || '';

    // For Ollama, pre-fill base URL if empty
    if (p === 'ollama' && !base.value) base.value = 'http://localhost:11434/v1/chat/completions';
    else if (p !== 'ollama' && base.value === 'http://localhost:11434/v1/chat/completions') base.value = '';
}
</script>
</head>
<body>
<h1>&#x1F9EC; SeqNode — AI Builder &amp; Agent Diagnostic</h1>
<p class="note">&#x26A0; Security: delete this file after use. Credentials submitted via POST are not logged or stored.</p>

<div class="card">
  <form method="POST">
    <div class="form-grid">
      <div>
        <label>PHP Auth Token <span class="hint">(F12 → Application → Local Storage → seqnode_token)</span></label>
        <input type="password" name="php_token" value="<?= htmlspecialchars($php_token) ?>" placeholder="eyJ0eXAiOi…" />
      </div>
      <div>
        <label>LLM Provider</label>
        <select id="sel-provider" name="provider" onchange="onProviderChange()">
          <?php foreach ($PROVIDERS as $key => $val): ?>
            <option value="<?= $key ?>" <?= $provider === $key ? 'selected' : '' ?>><?= htmlspecialchars($val['label']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label>API Key <span class="hint">(leave blank to use key stored in VPS settings)</span></label>
        <input id="inp-key" type="password" name="api_key" value="<?= htmlspecialchars($api_key) ?>" placeholder="<?= htmlspecialchars($providerCfg['key_hint']) ?>" />
      </div>
      <div>
        <label>Model</label>
        <select id="sel-model" name="model">
          <?php foreach ($providerCfg['models'] as $m): ?>
            <option value="<?= htmlspecialchars($m) ?>" <?= $defaultModel === $m ? 'selected' : '' ?>><?= htmlspecialchars($m) ?></option>
          <?php endforeach; ?>
          <?php if (empty($providerCfg['models'])): ?>
            <option value="">enter below</option>
          <?php endif; ?>
        </select>
        <input type="text" name="model_custom" value="<?= htmlspecialchars($model) ?>" placeholder="Override model name (optional)" style="margin-top:4px" />
      </div>
      <div class="form-full">
        <label>API Base URL <span class="hint">(leave blank for provider default; required for Ollama / custom)</span></label>
        <input id="inp-base" type="text" name="api_base" value="<?= htmlspecialchars($api_base) ?>" placeholder="<?= htmlspecialchars($providerCfg['endpoint']) ?>" />
      </div>
      <div class="form-full">
        <label>Test Prompt for AI Builder</label>
        <textarea name="prompt" rows="3"><?= htmlspecialchars($test_prompt) ?></textarea>
      </div>
    </div>
    <button type="submit">&#x1F50C; Run Diagnostics</button>
  </form>
</div>

<?php
// Use model_custom override if provided
if (!empty($_POST['model_custom'])) $defaultModel = trim($_POST['model_custom']);

if ($_SERVER['REQUEST_METHOD'] === 'POST'):

// Extract user_id from JWT once (reused by depcheck test)
$user_id_for_header = '';
if ($php_token) {
    $parts = explode('.', $php_token);
    if (count($parts) === 3) {
        $raw64   = str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4, '=', STR_PAD_RIGHT);
        $payload = json_decode(base64_decode($raw64), true) ?? [];
        $user_id_for_header = (string)($payload['sub'] ?? $payload['user_id'] ?? $payload['id'] ?? '');
    }
}
?>

<?php
// ── Test 1: VPS health check ─────────────────────────────────────────────────
echo "<h2>1 — VPS Connectivity</h2><div class='card'>";
$vps_health = curl_json("$VPS_URL/api/system/info", 'GET', [
    'Authorization' => $php_token ? "Bearer $php_token" : '',
    'Content-Type'  => 'application/json',
]);
$vps_ok = $vps_health['status'] >= 200 && $vps_health['status'] < 400;
echo "<table><tr><th>Check</th><th>Result</th></tr>";
echo "<tr><td>HTTP Status</td><td>" . badge($vps_ok, (string)$vps_health['status'], (string)$vps_health['status']) . "</td></tr>";
echo "<tr><td>cURL error</td><td>" . ($vps_health['curl_err'] ?: badge(true, 'none')) . "</td></tr>";
if ($vps_health['body']) {
    $sys = $vps_health['body'];
    echo "<tr><td>Platform</td><td>" . htmlspecialchars($sys['platform'] ?? '—') . "</td></tr>";
    echo "<tr><td>Python version</td><td>" . htmlspecialchars($sys['python_version'] ?? '—') . "</td></tr>";
}
if (!$vps_ok) echo code_block($vps_health['raw'] ?: $vps_health['curl_err']);
echo "</table></div>";
?>

<?php
// ── Test 2: Connected agents ─────────────────────────────────────────────────
echo "<h2>2 — Connected Agents</h2><div class='card'>";
$agents_r = curl_json("$VPS_URL/api/agent/status", 'GET', [
    'Authorization' => $php_token ? "Bearer $php_token" : '',
    'Content-Type'  => 'application/json',
]);
$agents_ok = $agents_r['status'] === 200;
echo "<table><tr><th>Check</th><th>Result</th></tr>";
echo "<tr><td>HTTP Status</td><td>" . badge($agents_ok, '200', (string)$agents_r['status']) . "</td></tr>";
if ($agents_ok && is_array($agents_r['body'])) {
    $agents = $agents_r['body'];
    echo "<tr><td>Agents</td><td>" . badge(count($agents) > 0, count($agents) . ' connected', 'None connected') . "</td></tr>";
    foreach ($agents as $i => $ag) {
        echo "<tr><td>Agent $i — " . htmlspecialchars($ag['hostname'] ?? '?') . "</td><td>";
        echo "ID: <code>" . htmlspecialchars(substr($ag['agent_id'] ?? '', 0, 12)) . "…</code> | ";
        echo "OS: " . htmlspecialchars($ag['os'] ?? '?') . " | ";
        echo "Seen: " . htmlspecialchars($ag['last_seen'] ?? '?');
        echo "</td></tr>";
    }
} else {
    echo code_block($agents_r['raw'] ?? 'no response');
}
echo "</table></div>";
?>

<?php
// ── Test 3: Depcheck — samtools via agent ────────────────────────────────────
echo "<h2>3 — Dep Analysis (samtools via agent)</h2><div class='card'>";
$dep_headers = ['Authorization' => $php_token ? "Bearer $php_token" : '', 'Content-Type' => 'application/json'];
if ($user_id_for_header) $dep_headers['X-Seqnode-User-Id'] = $user_id_for_header;
$dep_r = curl_json("$VPS_URL/api/depcheck/analyze", 'POST', $dep_headers, ['tool_ids' => ['samtools']]);
$dep_ok = $dep_r['status'] === 200;
echo "<table><tr><th>Check</th><th>Result</th></tr>";
echo "<tr><td>User-Id header</td><td>" . badge((bool)$user_id_for_header, $user_id_for_header ?: '(from JWT)', 'Not extracted') . "</td></tr>";
echo "<tr><td>HTTP Status</td><td>" . badge($dep_ok, '200', (string)$dep_r['status']) . "</td></tr>";
if ($dep_ok && is_array($dep_r['body'])) {
    $results = $dep_r['body']['results'] ?? [];
    foreach ($results as $tid => $res) {
        $st   = $res['status'] ?? 'unknown';
        $icon = ['ok' => '&#x2705;', 'partial' => '&#x26A0;&#xFE0F;', 'missing' => '&#x274C;'][$st] ?? '&#x2753;';
        echo "<tr><td>$tid</td><td>$icon $st";
        if (!empty($res['binary_path'])) echo " — <code>" . htmlspecialchars($res['binary_path']) . "</code>";
        if (!empty($res['version']))     echo " — <em>" . htmlspecialchars(explode("\n", $res['version'])[0]) . "</em>";
        echo "</td></tr>";
    }
} else {
    echo code_block($dep_r['raw'] ?? 'no response');
}
echo "</table></div>";
?>

<?php
// ── Test 4: Direct LLM API test ──────────────────────────────────────────────
echo "<h2>4 — Direct LLM API Test (" . htmlspecialchars($providerCfg['label']) . ")</h2><div class='card'>";

$effectiveBase = $api_base;
if (!$effectiveBase && $provider === 'gemini') {
    $effectiveBase = str_replace('{model}', $defaultModel, $providerCfg['endpoint']);
}

echo "<p class='hint'>Provider: <span class='provider-tag'>" . htmlspecialchars($provider) . "</span> &nbsp; Model: <code>" . htmlspecialchars($defaultModel) . "</code></p>";

if (!$api_key && !in_array($provider, ['ollama'])) {
    echo "<p style='color:#fbbf24'>&#x26A0; No API key provided — direct test may fail (unless key is stored in VPS).</p>";
}

$llm_result = test_llm_direct($provider, $api_key, $defaultModel, $effectiveBase ?: '');

echo "<table><tr><th>Check</th><th>Result</th></tr>";
echo "<tr><td>HTTP Status</td><td>" . badge($llm_result['status'] === 200, (string)$llm_result['status'], (string)$llm_result['status']) . "</td></tr>";
echo "<tr><td>Connected</td><td>" . badge($llm_result['ok']) . "</td></tr>";
if ($llm_result['ok']) {
    echo "<tr><td>Model reported</td><td><code>" . htmlspecialchars($llm_result['model'] ?? $defaultModel) . "</code></td></tr>";
    echo "<tr><td>Response</td><td>" . htmlspecialchars($llm_result['text']) . "</td></tr>";
} else {
    echo "<tr><td>Error</td><td><span style='color:#f87171'>" . htmlspecialchars($llm_result['error'] ?: 'No response') . "</span></td></tr>";
}
echo "</table></div>";
?>

<?php
// ── Test 5: AI Workflow Builder via VPS ──────────────────────────────────────
echo "<h2>5 — AI Workflow Builder via VPS (POST /api/ai/build-workflow)</h2><div class='card'>";
if (!$php_token) {
    echo "<p style='color:#fbbf24'>No PHP auth token — skipping (VPS requires auth).</p>";
} else {
    $ai_r = curl_json("$VPS_URL/api/ai/build-workflow", 'POST',
        ['Authorization' => "Bearer $php_token", 'Content-Type' => 'application/json'],
        ['prompt' => $test_prompt, 'context_files' => []],
        60
    );
    echo "<table><tr><th>Check</th><th>Result</th></tr>";
    echo "<tr><td>HTTP Status</td><td>" . badge($ai_r['status'] === 200, '200', (string)$ai_r['status']) . "</td></tr>";
    if ($ai_r['status'] === 200 && is_array($ai_r['body'])) {
        $body = $ai_r['body'];
        echo "<tr><td>Workflow returned</td><td>" . badge(!empty($body['workflow']), 'yes', 'null') . "</td></tr>";
        echo "<tr><td>Is valid</td><td>"           . badge((bool)($body['is_valid'] ?? false)) . "</td></tr>";
        echo "<tr><td>Provider used</td><td>"       . htmlspecialchars($body['provider_used'] ?? '?') . "</td></tr>";
        echo "<tr><td>Model used</td><td>"          . htmlspecialchars($body['model_used'] ?? '?') . "</td></tr>";
        echo "<tr><td>Duration</td><td>"            . ($body['duration_ms'] ?? '?') . " ms</td></tr>";
        if (!empty($body['validation_errors'])) {
            echo "<tr><td>Validation errors</td><td><span style='color:#fbbf24'>";
            foreach ($body['validation_errors'] as $e) echo htmlspecialchars($e) . "<br>";
            echo "</span></td></tr>";
        }
        if (!empty($body['workflow'])) {
            $wf = $body['workflow'];
            echo "<tr><td>Workflow name</td><td>" . htmlspecialchars($wf['name'] ?? '?') . "</td></tr>";
            $nc = count($wf['nodes'] ?? []);
            echo "<tr><td>Nodes</td><td>" . badge($nc > 0, "$nc node(s)", '0 nodes') . "</td></tr>";
            foreach (($wf['nodes'] ?? []) as $n) {
                echo "<tr><td style='padding-left:20px'>→ node</td><td><code>" . htmlspecialchars($n['id'] ?? '?') . "</code> — " . htmlspecialchars($n['plugin_id'] ?? $n['tool_id'] ?? $n['type'] ?? '?') . "</td></tr>";
            }
        }
    } else {
        echo code_block($ai_r['raw'] ?? 'no response');
    }
    echo "</table>";
}
echo "</div>";
?>

<?php
// ── Test 6: AI test-connection via VPS ───────────────────────────────────────
echo "<h2>6 — AI Test-Connection via VPS (POST /api/ai/test-connection)</h2><div class='card'>";
if (!$php_token) {
    echo "<p style='color:#fbbf24'>No PHP auth token — skipping.</p>";
} else {
    $tc_body = ['provider' => $provider];
    if ($api_key)    $tc_body['api_key']  = $api_key;
    if ($api_base)   $tc_body['api_base'] = $api_base;
    if ($defaultModel) $tc_body['model']  = $defaultModel;

    $tc_r = curl_json("$VPS_URL/api/ai/test-connection", 'POST',
        ['Authorization' => "Bearer $php_token", 'Content-Type' => 'application/json'],
        $tc_body, 25
    );
    echo "<table><tr><th>Check</th><th>Result</th></tr>";
    echo "<tr><td>HTTP Status</td><td>" . badge($tc_r['status'] === 200, '200', (string)$tc_r['status']) . "</td></tr>";
    if ($tc_r['status'] === 200) {
        echo "<tr><td>Connected</td><td>" . badge($tc_r['body']['ok'] ?? false) . "</td></tr>";
        echo "<tr><td>Message</td><td>"   . htmlspecialchars($tc_r['body']['message'] ?? '—') . "</td></tr>";
    } else {
        echo code_block($tc_r['raw'] ?? 'no response');
    }
    echo "</table>";
}
echo "</div>";
?>

<hr style="border-color:#334155;margin-top:30px">
<p class="note">&#x26A0; Delete this file after diagnostics: <code>public_html/api/diagnose_ai.php</code></p>

<?php else: ?>
<p style="color:#64748b;margin-top:20px;font-size:12px">Fill in the form above and click <strong>Run Diagnostics</strong>.</p>
<p style="color:#64748b;font-size:12px">PHP auth token: open SeqNode → F12 → Application → Local Storage → <code>seqnode_token</code></p>
<?php endif; ?>
<script>onProviderChange();</script>
</body>
</html>
