<?php

declare(strict_types=1);

class JWT
{
    /** Encode a payload into a signed HS256 JWT. */
    public static function encode(array $payload, string $secret): string
    {
        $header  = self::b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::b64url(json_encode($payload));
        $sig     = self::b64url(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$sig";
    }

    /** Decode and verify a JWT. Returns payload array or null if invalid/expired. */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $sig] = $parts;

        // Constant-time signature comparison
        $expected = self::b64url(hash_hmac('sha256', "$header.$payload", $secret, true));
        if (!hash_equals($expected, $sig)) return null;

        $data = json_decode(self::b64url_decode($payload), true);
        if (!is_array($data)) return null;

        if (isset($data['exp']) && $data['exp'] < time()) return null;
        if (isset($data['nbf']) && $data['nbf'] > time()) return null;

        return $data;
    }

    /** Generate a short-lived access token. */
    public static function generateAccessToken(array $user): string
    {
        $exp = (int)Env::get('JWT_ACCESS_EXPIRES', 3600);
        return self::encode([
            'iss'      => Env::get('APP_URL', ''),
            'sub'      => $user['uuid'],
            'user_id'  => $user['id'],
            'email'    => $user['email'],
            'role'     => $user['role'],
            'is_admin' => (bool)$user['is_admin'],
            'iat'      => time(),
            'exp'      => time() + $exp,
            'type'     => 'access',
        ], Env::require('JWT_SECRET'));
    }

    /**
     * Generate a random opaque refresh token stored as a hash in the DB.
     * Returns [plain_token, sha256_hash].
     */
    public static function generateRefreshToken(): array
    {
        $plain = bin2hex(random_bytes(40));
        $hash  = hash('sha256', $plain);
        return [$plain, $hash];
    }

    private static function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64url_decode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
