<?php

declare(strict_types=1);

class Auth
{
    private static ?array $currentUser = null;

    /** Extract and validate Bearer token. Returns JWT payload or terminates with 401. */
    public static function require(): array
    {
        $payload = self::attempt();
        if ($payload === null) {
            Response::unauthorized('Invalid or expired access token.');
        }
        return $payload;
    }

    /** Attempt authentication without forcing an error. */
    public static function attempt(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) return null;

        $token   = substr($header, 7);
        $payload = JWT::decode($token, Env::require('JWT_SECRET'));

        if ($payload === null || ($payload['type'] ?? '') !== 'access') return null;

        self::$currentUser = $payload;
        return $payload;
    }

    /** Require admin role. */
    public static function requireAdmin(): array
    {
        $payload = self::require();
        if (empty($payload['is_admin'])) {
            Response::forbidden('Access restricted to administrators.');
        }
        return $payload;
    }

    /** Return the currently authenticated user payload. */
    public static function user(): ?array
    {
        return self::$currentUser;
    }

    /** Check login rate limit by IP. Terminates with 429 if exceeded. */
    public static function checkLoginRateLimit(string $ip): void
    {
        $db     = Database::get();
        $window = (int)Env::get('RATE_LIMIT_WINDOW', 900);
        $max    = (int)Env::get('RATE_LIMIT_LOGIN', 5);

        $stmt = $db->prepare(
            "SELECT COUNT(*) as attempts FROM login_attempts
             WHERE ip_address = ? AND success = 0
               AND attempted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)"
        );
        $stmt->execute([$ip, $window]);

        if ((int)$stmt->fetch()['attempts'] >= $max) {
            $mins = (int)ceil($window / 60);
            Response::error("Too many failed attempts. Try again in $mins minutes.", 429);
        }
    }

    /** Record a login attempt in the database. */
    public static function logLoginAttempt(string $ip, string $email, bool $success): void
    {
        try {
            Database::get()->prepare(
                "INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)"
            )->execute([$email, $ip, $success ? 1 : 0]);
        } catch (Throwable) {
            // Non-blocking
        }
    }
}
