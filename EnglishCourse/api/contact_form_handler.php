<?php
// Adress: api/
// File: contact_form_handler.php
// Extension: .php

// --- INÍCIO: CONFIGURAÇÕES DE DEBUG ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Define o caminho para o seu arquivo de log personalizado
define('CUSTOM_LOG_FILE', sys_get_temp_dir() . '/perfect_english_debug.log');

// Função auxiliar para registrar mensagens no seu arquivo de log personalizado
function custom_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    try {
        file_put_contents(CUSTOM_LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
    } catch (Exception $e) {
        error_log("LOGGING ERROR: Could not write to " . CUSTOM_LOG_FILE . ": " . $e->getMessage());
    }
}
// --- FIM: CONFIGURAÇÕES DE DEBUG ---

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Inclui a função sendEmail (que está na raiz) e as configurações (que estão em api/)
require_once __DIR__ . '/../send_email.php';
require_once __DIR__ . '/config.php';
global $contactRecipientEmail; // Acessa a variável global definida em config.php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

// Recebe os dados JSON
$data = json_decode(file_get_contents("php://input"), true);

// Validação de entrada
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    custom_log("Contact Form Validation Failed: Missing fields.");
    echo json_encode(['success' => false, 'message' => 'Por favor, preencha todos os campos.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    custom_log("Contact Form Validation Failed: Invalid email format for " . $email);
    echo json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.']);
    exit;
}

$emailSubjectPrefix = '[Contato - Perfect English] '; 
$fullSubject = $emailSubjectPrefix . $subject;
$emailBody = "Nome: " . htmlspecialchars($name) . "<br>"
           . "Email: " . htmlspecialchars($email) . "<br>"
           . "Assunto: " . htmlspecialchars($subject) . "<br><br>"
           . "Mensagem:<br>" . nl2br(htmlspecialchars($message));

// Prevenção de Erro: Verifica se a variável de destino está definida
if (empty($contactRecipientEmail)) {
    custom_log("Contact Recipient Email is not configured in .env!");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor: Destinatário de contato não configurado.']);
    exit;
}
           
custom_log("Attempting to send contact email to $contactRecipientEmail from " . $email);
// Usa a variável global $contactRecipientEmail
if (sendEmail($contactRecipientEmail, $fullSubject, $emailBody, $email, $name)) {
    custom_log("Contact email sent successfully!");
    echo json_encode(['success' => true, 'message' => 'Mensagem enviada com sucesso!']);
} else {
    custom_log("Failed to send contact email.");
    // Mensagem de erro genérica para o frontend
    echo json_encode(['success' => false, 'message' => 'Não foi possível enviar a mensagem. Por favor, tente novamente mais tarde.']);
}