<?php

declare(strict_types=1);

/**
 * UserSettingsController — User Preferences & Agent Token Management
 *
 * Routes (all require Auth::require()):
 * GET  /api/user/preferences            → load all user prefs (ui, agent, etc.)
 * POST /api/user/preferences            → save a section of prefs
 * GET  /api/user/agent-token            → get current agent token (or null)
 * POST /api/user/agent-token/regenerate → generate new token (invalidates old)
 * DELETE /api/user/agent-token          → revoke token
 */
class UserSettingsController
{
    /* ── Preferences ────────────────────────────────────────────────────── */

    // Sensitive fields that must be masked when returning to the browser.
    private const SENSITIVE_FIELDS   = ['api_key', 'jwt_secret', 'oauth_token'];
    private const MASKED_SENTINEL    = '__MASKED__';
    // Sections that contain sensitive fields
    private const SENSITIVE_SECTIONS = ['llm_config', 'auth'];

    /** Mask sensitive fields before returning to browser. */
    private static function maskSensitive(string $section, array $data): array
    {
        if (!in_array($section, self::SENSITIVE_SECTIONS, true)) return $data;
        foreach (self::SENSITIVE_FIELDS as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $data[$field] = self::MASKED_SENTINEL;
            }
        }
        return $data;
    }

    /** When saving, if a sensitive field is blank or the sentinel, keep the existing stored value. */
    private static function restoreSensitive(string $section, array $incoming, array $existing): array
    {
        if (!in_array($section, self::SENSITIVE_SECTIONS, true)) return $incoming;
        foreach (self::SENSITIVE_FIELDS as $field) {
            $val = $incoming[$field] ?? '';
            if ($val === '' || $val === self::MASKED_SENTINEL) {
                // Keep whatever was already stored
                if (isset($existing[$field])) {
                    $incoming[$field] = $existing[$field];
                } else {
                    unset($incoming[$field]);
                }
            }
        }
        return $incoming;
    }

    /** GET /api/user/preferences — return all stored sections for the user. */
    public static function getPreferences(): void
    {
        $payload = Auth::require();
        $userId  = (int) $payload['user_id'];
        $db      = Database::get();

        $stmt = $db->prepare("SELECT section, data FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $sec  = $row['section'];
            $data = json_decode($row['data'], true) ?? [];
            $result[$sec] = self::maskSensitive($sec, $data);
        }

        http_response_code(200);
        echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * POST /api/user/preferences — upsert one or more sections.
     * Allowed sections: ui, agent, plugin_defaults, plugin_paths, llm_config, dirs, auth
     * Sensitive fields in llm_config/auth are masked on read and preserved if blank on write.
     */
    public static function savePreferences(): void
    {
        $payload = Auth::require();
        $userId  = (int) $payload['user_id'];
        $db      = Database::get();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $sections = [];
        if (isset($body['sections']) && is_array($body['sections'])) {
            $sections = $body['sections'];
        } elseif (isset($body['section']) && isset($body['data'])) {
            $sections[$body['section']] = $body['data'];
        } else {
            Response::error('Provide either {section, data} or {sections: {...}}.', 400);
        }

        $allowed   = ['ui', 'agent', 'plugin_defaults', 'plugin_paths', 'llm_config', 'dirs', 'auth'];
        $stmtRead  = $db->prepare("SELECT data FROM user_preferences WHERE user_id = ? AND section = ? LIMIT 1");
        $stmtCheck = $db->prepare("SELECT id FROM user_preferences WHERE user_id = ? AND section = ? LIMIT 1");
        $stmtUpd   = $db->prepare("UPDATE user_preferences SET data = ?, updated_at = NOW() WHERE user_id = ? AND section = ?");
        $stmtIns   = $db->prepare("INSERT INTO user_preferences (user_id, section, data) VALUES (?, ?, ?)");

        foreach ($sections as $section => $data) {
            if (!in_array($section, $allowed, true)) continue;

            // For sensitive sections, load existing data first so we can restore masked values
            $existing = [];
            if (in_array($section, self::SENSITIVE_SECTIONS, true)) {
                $stmtRead->execute([$userId, $section]);
                $row = $stmtRead->fetch();
                if ($row) $existing = json_decode($row['data'], true) ?? [];
                $data = self::restoreSensitive($section, $data, $existing);
            }

            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmtCheck->execute([$userId, $section]);
            if ($stmtCheck->fetch()) {
                $stmtUpd->execute([$json, $userId, $section]);
            } else {
                $stmtIns->execute([$userId, $section, $json]);
            }
        }

        http_response_code(200);
        echo json_encode(['saved' => true, 'sections' => array_keys($sections)]);
        exit;
    }

    /* ── Agent Token ────────────────────────────────────────────────────── */

    /** GET /api/user/agent-token — return current agent token info. */
    public static function getAgentToken(): void
    {
        $payload = Auth::require();
        $userId  = (int) $payload['user_id']; // CORRIGIDO AQUI
        $db      = Database::get();

        $stmt = $db->prepare(
            "SELECT token, label, last_seen, agent_url, agent_info, is_active, created_at
             FROM agent_tokens WHERE user_id = ? LIMIT 1"
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(200);
            echo json_encode(['token' => null]);
            exit;
        }

        http_response_code(200);
        echo json_encode([
            'token'      => $row['token'],
            'label'      => $row['label'],
            'last_seen'  => $row['last_seen'],
            'agent_url'  => $row['agent_url'],
            'agent_info' => $row['agent_info'] ? json_decode($row['agent_info'], true) : null,
            'is_active'  => (bool) $row['is_active'],
            'created_at' => $row['created_at'],
        ]);
        exit;
    }

    /** POST /api/user/agent-token/regenerate — create a new token (replaces old). */
    public static function regenerateAgentToken(): void
    {
        $payload = Auth::require();
        $userId  = (int) $payload['user_id']; // CORRIGIDO AQUI
        $db      = Database::get();

        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $label = trim($body['label'] ?? 'My Agent');

        // "snagt_" + 48 hex chars = 54-char token
        $plain = 'snagt_' . bin2hex(random_bytes(24));

        $db->prepare("DELETE FROM agent_tokens WHERE user_id = ?")->execute([$userId]);
        $db->prepare("INSERT INTO agent_tokens (user_id, token, label) VALUES (?, ?, ?)")
           ->execute([$userId, $plain, $label]);

        http_response_code(200);
        echo json_encode([
            'token'      => $plain,
            'label'      => $label,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        exit;
    }

    /** DELETE /api/user/agent-token — revoke the current agent token. */
    public static function revokeAgentToken(): void
    {
        $payload = Auth::require();
        $userId  = (int) $payload['user_id']; // CORRIGIDO AQUI

        Database::get()->prepare("DELETE FROM agent_tokens WHERE user_id = ?")->execute([$userId]);

        http_response_code(200);
        echo json_encode(['revoked' => true]);
        exit;
    }

    /**
     * POST /api/user/agent-token/verify
     * Called by the Oracle VPS to validate an incoming agent token.
     * No user JWT required — the agent token IS the credential.
     * Also records last_seen and agent_info (hostname, OS, etc.).
     *
     * Body: { "token": "snagt_xxx", "agent_info": { "hostname": "...", "os": "..." } }
     * Returns: { "valid": true, "user_id": 123, "label": "My Workstation" }
     * or HTTP 401 { "valid": false }
     */
    public static function verifyAgentToken(): void
    {
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];
        $token = trim($body['token'] ?? '');
        $info  = $body['agent_info'] ?? null;

        if (!$token) {
            http_response_code(400);
            echo json_encode(['valid' => false, 'reason' => 'Token required.']);
            exit;
        }

        $db   = Database::get();
        $stmt = $db->prepare(
            "SELECT id, user_id, label, is_active FROM agent_tokens WHERE token = ? LIMIT 1"
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row || !$row['is_active']) {
            http_response_code(401);
            echo json_encode(['valid' => false, 'reason' => 'Invalid or revoked token.']);
            exit;
        }

        // Update last_seen and agent_info
        $infoJson = $info ? json_encode($info, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
        $db->prepare(
            "UPDATE agent_tokens SET last_seen = NOW(), agent_info = COALESCE(?, agent_info), updated_at = NOW() WHERE id = ?"
        )->execute([$infoJson, $row['id']]);

        http_response_code(200);
        echo json_encode([
            'valid'   => true,
            'user_id' => (int) $row['user_id'],
            'label'   => $row['label'],
        ]);
        exit;
    }
}