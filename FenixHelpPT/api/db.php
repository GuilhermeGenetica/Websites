<?php
// Carregar variáveis de ambiente do ficheiro .env
$env = parse_ini_file('.env');

$DB_HOST = $env['DB_HOST'];
$DB_NAME = $env['DB_NAME'];
$DB_USER = $env['DB_USER'];
$DB_PASS = $env['DB_PASS'];

// Criar a ligação à base de dados
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

// Verificar a ligação
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Definir o charset para utf8mb4 para suportar todos os caracteres
$conn->set_charset("utf8mb4");

// Headers para permitir comunicação (CORS) e JSON
header("Access-Control-Allow-Origin: *"); // Em produção, restrinja ao seu domínio
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// O browser envia uma requisição OPTIONS antes de POST/PUT, precisamos de responder OK.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
