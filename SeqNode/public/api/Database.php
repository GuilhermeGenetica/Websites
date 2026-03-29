<?php

declare(strict_types=1);

class Database
{
    private static ?PDO $instance = null;

    public static function get(): PDO
    {
        if (self::$instance !== null) return self::$instance;

        $host = Env::require('DB_HOST');
        $port = Env::get('DB_PORT', '3306');
        $name = Env::require('DB_NAME');
        $user = Env::require('DB_USER');
        $pass = Env::require('DB_PASS');

        $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";

        try {
            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ]);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            Response::error('Database connection failed.', 503);
        }

        return self::$instance;
    }
}
