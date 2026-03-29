<?php

declare(strict_types=1);

class AuthController
{
    // ── POST /auth/register ──────────────────────────────────────────────────
    public static function register(): void
    {
        $body = self::body();

        $v = Validator::make($body, [
            'full_name' => 'required|min:3|max:255',
            'email'     => 'required|email|max:255',
            'password'  => 'required|min:8|max:72|confirmed',
            'role'      => 'required|in:researcher,physician,bioinformatician,student,university_staff,institution',
        ]);

        if ($v->fails()) Response::error('Validation failed.', 422, $v->errors());

        $db    = Database::get();
        $email = strtolower(trim($body['email']));
        $ip    = self::ip();

        // Check for duplicate email
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) Response::error('This email address is already registered.', 409);

        // Check registration rate limit per IP
        $maxReg = (int)Env::get('RATE_LIMIT_REGISTER', 3);
        $stmt   = $db->prepare(
            "SELECT COUNT(*) as c FROM users WHERE created_ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)"
        );
        $stmt->execute([$ip]);
        if ((int)$stmt->fetch()['c'] >= $maxReg) {
            Response::error('Too many registrations from this IP. Please try again later.', 429);
        }

        $uuid         = self::uuid4();
        $passwordHash = password_hash(
            $body['password'], PASSWORD_BCRYPT, ['cost' => (int)Env::get('BCRYPT_COST', 12)]
        );
        $verifyToken  = bin2hex(random_bytes(32));
        $verifyExpiry = date('Y-m-d H:i:s', time() + 86400);

        $db->beginTransaction();
        try {
            $db->prepare("
                INSERT INTO users (uuid, email, password_hash, full_name, role, created_ip)
                VALUES (?, ?, ?, ?, ?, ?)
            ")->execute([$uuid, $email, $passwordHash, trim($body['full_name']), $body['role'], $ip]);

            $userId = (int)$db->lastInsertId();

            $db->prepare("
                INSERT INTO email_verifications (user_id, token, expires_at)
                VALUES (?, ?, ?)
            ")->execute([$userId, $verifyToken, $verifyExpiry]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            error_log('Register error: ' . $e->getMessage());
            Response::error('Account creation failed.', 500);
        }

        try {
            Mailer::sendVerification($email, trim($body['full_name']), $verifyToken);
        } catch (Throwable $e) {
            error_log('Verification mail failed: ' . $e->getMessage());
        }

        Response::success(
            ['email' => $email],
            'Account created. Please check your email to verify your account.',
            201
        );
    }

    // ── POST /auth/login ─────────────────────────────────────────────────────
    public static function login(): void
    {
        $body  = self::body();
        $ip    = self::ip();
        $email = strtolower(trim($body['email'] ?? ''));

        Auth::checkLoginRateLimit($ip);

        $v = Validator::make($body, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);
        if ($v->fails()) Response::error('Validation failed.', 422, $v->errors());

        $db   = Database::get();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Constant-time check to prevent timing attacks
        $hash = $user['password_hash'] ?? '$2y$12$invalidhashfortimingprotection0000000000000000000000';
        if (!$user || !password_verify($body['password'], $hash)) {
            Auth::logLoginAttempt($ip, $email, false);
            Response::error('Invalid email or password.', 401);
        }

        if (!(bool)$user['is_active']) {
            Response::error('Account is disabled. Please contact support.', 403);
        }

        if (!(bool)$user['is_verified']) {
            Response::error('Email not verified. Please check your inbox.', 403);
        }

        Auth::logLoginAttempt($ip, $email, true);

        $db->prepare(
            "UPDATE users SET last_login_at = NOW(), last_login_ip = ?, login_count = login_count + 1 WHERE id = ?"
        )->execute([$ip, $user['id']]);

        $accessToken              = JWT::generateAccessToken($user);
        [$refreshPlain, $refreshHash] = JWT::generateRefreshToken();
        $refreshExp               = (int)Env::get('JWT_REFRESH_EXPIRES', 2592000);

        $db->prepare("
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), ?, ?)
        ")->execute([
            $user['id'], $refreshHash, $refreshExp,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $ip,
        ]);

        Response::success([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshPlain,
            'token_type'    => 'Bearer',
            'expires_in'    => (int)Env::get('JWT_ACCESS_EXPIRES', 3600),
            'user'          => self::publicUser($user),
        ], 'Login successful.');
    }

    // ── POST /auth/logout ────────────────────────────────────────────────────
    public static function logout(): void
    {
        $body  = self::body();
        $token = $body['refresh_token'] ?? '';

        if ($token) {
            $hash = hash('sha256', $token);
            Database::get()->prepare(
                "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?"
            )->execute([$hash]);
        }

        Response::success(null, 'Logged out successfully.');
    }

    // ── POST /auth/refresh ───────────────────────────────────────────────────
    public static function refresh(): void
    {
        $body  = self::body();
        $plain = $body['refresh_token'] ?? '';
        if (!$plain) Response::error('Refresh token is missing.', 400);

        $hash = hash('sha256', $plain);
        $db   = Database::get();

        $stmt = $db->prepare("
            SELECT rt.*, u.id, u.uuid, u.email, u.full_name, u.role, u.is_admin, u.is_active, u.plan
            FROM refresh_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = ?
              AND rt.revoked_at IS NULL
              AND rt.expires_at > NOW()
              AND u.is_active = 1
              AND u.deleted_at IS NULL
        ");
        $stmt->execute([$hash]);
        $row = $stmt->fetch();

        if (!$row) Response::error('Invalid or expired refresh token.', 401);

        // Rotate: revoke old token, issue new one
        $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?")
           ->execute([$hash]);

        [$newPlain, $newHash] = JWT::generateRefreshToken();
        $refreshExp = (int)Env::get('JWT_REFRESH_EXPIRES', 2592000);

        $db->prepare("
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), ?, ?)
        ")->execute([
            $row['id'], $newHash, $refreshExp,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), self::ip(),
        ]);

        Response::success([
            'access_token'  => JWT::generateAccessToken($row),
            'refresh_token' => $newPlain,
            'token_type'    => 'Bearer',
            'expires_in'    => (int)Env::get('JWT_ACCESS_EXPIRES', 3600),
        ], 'Token refreshed.');
    }

    // ── GET /auth/verify-email?token= ────────────────────────────────────────
    public static function verifyEmail(): void
    {
        $token = trim($_GET['token'] ?? '');
        if (!$token) Response::error('Verification token is missing.', 400);

        $db   = Database::get();
        $stmt = $db->prepare("
            SELECT ev.*, u.full_name, u.email FROM email_verifications ev
            JOIN users u ON u.id = ev.user_id
            WHERE ev.token = ? AND ev.verified_at IS NULL AND ev.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row) Response::error('Invalid or expired verification token.', 400);

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE users SET is_verified = 1, email_verified_at = NOW() WHERE id = ?")
               ->execute([$row['user_id']]);
            $db->prepare("UPDATE email_verifications SET verified_at = NOW() WHERE id = ?")
               ->execute([$row['id']]);
            $db->commit();
        } catch (Throwable) {
            $db->rollBack();
            Response::error('Email verification failed.', 500);
        }

        try { Mailer::sendWelcome($row['email'], $row['full_name']); } catch (Throwable) {}

        Response::success(null, 'Email verified successfully. You can now log in.');
    }

    // ── POST /auth/forgot-password ───────────────────────────────────────────
    public static function forgotPassword(): void
    {
        $body  = self::body();
        $email = strtolower(trim($body['email'] ?? ''));

        // Generic response to avoid revealing whether email exists
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::success(null, 'If this email exists, a reset link has been sent.');
        }

        $db   = Database::get();
        $stmt = $db->prepare("SELECT id, full_name FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            $db->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$user['id']]);

            $token   = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', time() + 3600);

            $db->prepare(
                "INSERT INTO password_resets (user_id, token, expires_at, ip_address) VALUES (?, ?, ?, ?)"
            )->execute([$user['id'], $token, $expires, self::ip()]);

            try { Mailer::sendPasswordReset($email, $user['full_name'], $token); } catch (Throwable) {}
        }

        Response::success(null, 'If this email exists, a reset link has been sent.');
    }

    // ── POST /auth/reset-password ────────────────────────────────────────────
    public static function resetPassword(): void
    {
        $body = self::body();

        $v = Validator::make($body, [
            'token'    => 'required',
            'password' => 'required|min:8|max:72|confirmed',
        ]);
        if ($v->fails()) Response::error('Validation failed.', 422, $v->errors());

        $db   = Database::get();
        $stmt = $db->prepare("
            SELECT pr.* FROM password_resets pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.token = ? AND pr.used_at IS NULL AND pr.expires_at > NOW()
        ");
        $stmt->execute([$body['token']]);
        $row = $stmt->fetch();

        if (!$row) Response::error('Invalid or expired reset token.', 400);

        $hash = password_hash(
            $body['password'], PASSWORD_BCRYPT, ['cost' => (int)Env::get('BCRYPT_COST', 12)]
        );

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $row['user_id']]);
            $db->prepare("UPDATE password_resets SET used_at = NOW() WHERE id = ?")->execute([$row['id']]);
            $db->prepare("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?")->execute([$row['user_id']]);
            $db->commit();
        } catch (Throwable) {
            $db->rollBack();
            Response::error('Password reset failed.', 500);
        }

        Response::success(null, 'Password reset successfully. Please log in with your new password.');
    }

    // ── POST /auth/resend-verification ──────────────────────────────────────
    public static function resendVerification(): void
    {
        $body  = self::body();
        $email = strtolower(trim($body['email'] ?? ''));

        // Always respond generically to prevent email enumeration
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::success(null, 'If this email exists and is unverified, a new link has been sent.');
        }

        $db   = Database::get();
        $stmt = $db->prepare(
            "SELECT id, full_name, is_verified FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL"
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && !(bool)$user['is_verified']) {
            // Rate-limit: max 3 resends per hour per email
            $stmt = $db->prepare(
                "SELECT COUNT(*) as c FROM email_verifications
                 WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)"
            );
            $stmt->execute([$user['id']]);
            $count = (int)($stmt->fetch()['c'] ?? 0);

            if ($count < 3) {
                // Invalidate old tokens and create a fresh one
                $db->prepare("DELETE FROM email_verifications WHERE user_id = ?")->execute([$user['id']]);

                $token   = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', time() + 86400);

                $db->prepare(
                    "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)"
                )->execute([$user['id'], $token, $expires]);

                try {
                    Mailer::sendVerification($email, $user['full_name'], $token);
                } catch (Throwable $e) {
                    error_log('Resend verification mail failed: ' . $e->getMessage());
                }
            }
        }

        Response::success(null, 'If this email exists and is unverified, a new verification link has been sent.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static function body(): array
    {
        return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    }

    private static function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
    }

    private static function uuid4(): string
    {
        $data    = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public static function publicUser(array $user): array
    {
        return [
            'id'           => $user['id'],
            'uuid'         => $user['uuid'],
            'email'        => $user['email'],
            'full_name'    => $user['full_name'],
            'display_name' => $user['display_name'],
            'role'         => $user['role'],
            'is_admin'     => (bool)$user['is_admin'],
            'plan'         => $user['plan'],
            'institution'  => $user['institution'],
            'avatar_url'   => $user['avatar_url'],
            'is_verified'  => (bool)$user['is_verified'],
        ];
    }
}
