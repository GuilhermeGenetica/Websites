<?php

declare(strict_types=1);

class UserController
{
    // ── GET /user/profile ────────────────────────────────────────────────────
    public static function profile(): void
    {
        $auth = Auth::require();
        $stmt = Database::get()->prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user) Response::notFound('User not found.');

        Response::success(self::fullProfile($user));
    }

    // ── PUT /user/profile ────────────────────────────────────────────────────
    public static function updateProfile(): void
    {
        $auth    = Auth::require();
        $body    = self::body();
        $allowed = [
            'full_name', 'display_name', 'bio', 'avatar_url', 'role',
            'institution', 'department', 'position', 'specialty',
            'orcid', 'crm', 'phone', 'country', 'city', 'website',
        ];

        $fields = [];
        $values = [];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = ?";
                $values[] = $body[$f] !== '' ? $body[$f] : null;
            }
        }

        if (empty($fields)) Response::error('No fields to update.', 400);

        if (isset($body['avatar_url']) && $body['avatar_url'] !== '') {
            if (!filter_var($body['avatar_url'], FILTER_VALIDATE_URL)) {
                Response::error('Invalid avatar URL.', 422);
            }
        }

        $values[] = $auth['user_id'];
        Database::get()->prepare(
            "UPDATE users SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?"
        )->execute($values);

        // Return updated profile
        $stmt = Database::get()->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$auth['user_id']]);

        Response::success(self::fullProfile($stmt->fetch()), 'Profile updated successfully.');
    }

    // ── PUT /user/change-password ────────────────────────────────────────────
    public static function changePassword(): void
    {
        $auth = Auth::require();
        $body = self::body();

        $v = Validator::make($body, [
            'current_password' => 'required',
            'password'         => 'required|min:8|max:72|confirmed',
        ]);
        if ($v->fails()) Response::error('Validation failed.', 422, $v->errors());

        $db   = Database::get();
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($body['current_password'], $user['password_hash'])) {
            Response::error('Current password is incorrect.', 401);
        }

        $newHash = password_hash(
            $body['password'], PASSWORD_BCRYPT, ['cost' => (int)Env::get('BCRYPT_COST', 12)]
        );

        $db->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?")
           ->execute([$newHash, $auth['user_id']]);

        // Revoke all other refresh tokens
        $db->prepare(
            "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL"
        )->execute([$auth['user_id']]);

        Response::success(null, 'Password changed successfully.');
    }

    // ── DELETE /user/account ─────────────────────────────────────────────────
    public static function deleteAccount(): void
    {
        $auth = Auth::require();
        $body = self::body();

        if (empty($body['password'])) Response::error('Password confirmation is required.', 400);

        $db   = Database::get();
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            Response::error('Incorrect password.', 401);
        }

        // Soft delete
        $db->prepare(
            "UPDATE users SET deleted_at = NOW(), email = CONCAT(email, '_deleted_', id), is_active = 0 WHERE id = ?"
        )->execute([$auth['user_id']]);

        $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?")
           ->execute([$auth['user_id']]);

        Response::success(null, 'Account deleted.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static function body(): array
    {
        return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    }

    public static function fullProfile(array $user): array
    {
        return [
            'id'              => $user['id'],
            'uuid'            => $user['uuid'],
            'email'           => $user['email'],
            'full_name'       => $user['full_name'],
            'display_name'    => $user['display_name'],
            'bio'             => $user['bio'],
            'avatar_url'      => $user['avatar_url'],
            'role'            => $user['role'],
            'is_admin'        => (bool)$user['is_admin'],
            'is_active'       => (bool)$user['is_active'],
            'is_verified'     => (bool)$user['is_verified'],
            'plan'            => $user['plan'],
            'plan_expires_at' => $user['plan_expires_at'],
            'institution'     => $user['institution'],
            'department'      => $user['department'],
            'position'        => $user['position'],
            'specialty'       => $user['specialty'],
            'orcid'           => $user['orcid'],
            'crm'             => $user['crm'],
            'phone'           => $user['phone'],
            'country'         => $user['country'],
            'city'            => $user['city'],
            'website'         => $user['website'],
            'last_login_at'   => $user['last_login_at'],
            'login_count'     => (int)$user['login_count'],
            'created_at'      => $user['created_at'],
        ];
    }
}
