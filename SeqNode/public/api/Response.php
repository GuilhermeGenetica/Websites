<?php

declare(strict_types=1);

class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'OK', int $status = 200): void
    {
        self::json(['success' => true, 'message' => $message, 'data' => $data], $status);
    }

    public static function error(string $message, int $status = 400, mixed $errors = null): void
    {
        $body = ['success' => false, 'message' => $message];
        if ($errors !== null) $body['errors'] = $errors;
        self::json($body, $status);
    }

    public static function unauthorized(string $message = 'Unauthorized.'): void
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden.'): void
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Not found.'): void
    {
        self::error($message, 404);
    }
}
