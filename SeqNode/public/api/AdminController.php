<?php

declare(strict_types=1);

class AdminController
{
    // ── GET /admin/users ─────────────────────────────────────────────────────
    public static function listUsers(): void
    {
        Auth::requireAdmin();

        $page   = max(1, (int)($_GET['page']   ?? 1));
        $limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $role   = trim($_GET['role']   ?? '');
        $plan   = trim($_GET['plan']   ?? '');
        $active = $_GET['active'] ?? null;

        $where  = ['deleted_at IS NULL'];
        $params = [];

        if ($search !== '') {
            $where[]  = "(full_name LIKE ? OR email LIKE ? OR institution LIKE ?)";
            $like     = "%$search%";
            $params   = array_merge($params, [$like, $like, $like]);
        }
        if ($role)          { $where[] = 'role = ?';      $params[] = $role; }
        if ($plan)          { $where[] = 'plan = ?';      $params[] = $plan; }
        if ($active !== null) { $where[] = 'is_active = ?'; $params[] = (int)$active; }

        $whereClause = implode(' AND ', $where);
        $db          = Database::get();

        $cntStmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE $whereClause");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetch()['total'];

        $params[] = $limit;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT id, uuid, email, full_name, display_name, role, is_admin,
                   is_active, is_verified, plan, plan_expires_at,
                   institution, country, last_login_at, login_count, created_at
            FROM users
            WHERE $whereClause
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);

        Response::success([
            'users'       => $stmt->fetchAll(),
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => (int)ceil($total / $limit),
        ]);
    }

    // ── GET /admin/users/{id} ────────────────────────────────────────────────
    public static function getUser(int $id): void
    {
        Auth::requireAdmin();
        $stmt = Database::get()->prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) Response::notFound('User not found.');

        Response::success(UserController::fullProfile($user));
    }

    // ── PUT /admin/users/{id} ────────────────────────────────────────────────
    public static function updateUser(int $id): void
    {
        Auth::requireAdmin();
        $body    = self::body();
        $allowed = [
            'full_name', 'display_name', 'role', 'is_admin', 'is_active',
            'is_verified', 'plan', 'plan_expires_at', 'institution', 'department',
            'position', 'specialty', 'orcid', 'crm', 'phone', 'country', 'city',
            'website', 'notes', 'bio',
        ];

        $fields = [];
        $values = [];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = ?";
                $values[] = ($body[$f] !== '' && $body[$f] !== null) ? $body[$f] : null;
            }
        }

        if (empty($fields)) Response::error('No fields to update.', 400);

        $values[] = $id;
        Database::get()->prepare(
            "UPDATE users SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?"
        )->execute($values);

        self::getUser($id);
    }

    // ── PUT /admin/users/{id}/toggle-active ──────────────────────────────────
    public static function toggleActive(int $id): void
    {
        $admin = Auth::requireAdmin();
        if ($admin['user_id'] === $id) Response::error('Cannot deactivate your own account.', 400);

        $db   = Database::get();
        $stmt = $db->prepare("SELECT is_active FROM users WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) Response::notFound('User not found.');

        $newState = $user['is_active'] ? 0 : 1;
        $db->prepare("UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?")
           ->execute([$newState, $id]);

        if (!$newState) {
            $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL")
               ->execute([$id]);
        }

        Response::success(
            ['is_active' => (bool)$newState],
            $newState ? 'User activated.' : 'User deactivated.'
        );
    }

    // ── PUT /admin/users/{id}/toggle-admin ───────────────────────────────────
    public static function toggleAdmin(int $id): void
    {
        $admin = Auth::requireAdmin();
        if ($admin['user_id'] === $id) Response::error('Cannot change your own admin status.', 400);

        $db   = Database::get();
        $stmt = $db->prepare("SELECT is_admin FROM users WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) Response::notFound('User not found.');

        $newState = $user['is_admin'] ? 0 : 1;
        $db->prepare("UPDATE users SET is_admin = ?, updated_at = NOW() WHERE id = ?")
           ->execute([$newState, $id]);

        Response::success(
            ['is_admin' => (bool)$newState],
            $newState ? 'Admin granted.' : 'Admin revoked.'
        );
    }

    // ── DELETE /admin/users/{id} ─────────────────────────────────────────────
    public static function deleteUser(int $id): void
    {
        $admin = Auth::requireAdmin();
        if ($admin['user_id'] === $id) Response::error('Cannot delete your own account from here.', 400);

        $db   = Database::get();
        $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) Response::notFound('User not found.');

        $db->prepare(
            "UPDATE users SET deleted_at = NOW(), is_active = 0, email = CONCAT(email, '_deleted_', id) WHERE id = ?"
        )->execute([$id]);
        $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?")->execute([$id]);

        Response::success(null, 'User deleted.');
    }

    // ── GET /admin/stats ─────────────────────────────────────────────────────
    public static function stats(): void
    {
        Auth::requireAdmin();
        $db = Database::get();

        $q = fn(string $sql) => $db->query($sql)->fetch();

        Response::success([
            'total_users'    => (int)$q("SELECT COUNT(*) as c FROM users WHERE deleted_at IS NULL")['c'],
            'active_users'   => (int)$q("SELECT COUNT(*) as c FROM users WHERE is_active=1 AND deleted_at IS NULL")['c'],
            'verified_users' => (int)$q("SELECT COUNT(*) as c FROM users WHERE is_verified=1 AND deleted_at IS NULL")['c'],
            'paid_users'     => (int)$q("SELECT COUNT(*) as c FROM users WHERE plan != 'free' AND deleted_at IS NULL")['c'],
            'by_role'        => $db->query("SELECT role, COUNT(*) as total FROM users WHERE deleted_at IS NULL GROUP BY role")->fetchAll(),
            'by_plan'        => $db->query("SELECT plan, COUNT(*) as total FROM users WHERE deleted_at IS NULL GROUP BY plan")->fetchAll(),
            'logins_today'   => (int)$q("SELECT COUNT(*) as c FROM login_attempts WHERE success=1 AND attempted_at >= CURDATE()")['c'],
            'new_this_month' => (int)$q("SELECT COUNT(*) as c FROM users WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW()) AND deleted_at IS NULL")['c'],
        ]);
    }

    private static function body(): array
    {
        return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    }
}
