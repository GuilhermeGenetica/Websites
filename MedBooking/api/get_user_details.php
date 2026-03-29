<?php
// api/get_user_details.php

// Define cabeçalhos para permitir requisições de origens diferentes (CORS) e definir o tipo de conteúdo.
header("Access-Control-Allow-Origin: https://medbooking.app");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responde com sucesso a requisições OPTIONS (pre-flight requests).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Inclui os arquivos de configuração e utilidades.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/utils.php';

// Pega a chave secreta do JWT do ambiente.
$secretKey = $_ENV['JWT_SECRET_KEY'] ?? 'your_super_secret_jwt_key';

// Função para autenticar o administrador.
function authenticateAdmin($secretKey) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access. Token missing."]);
        return false;
    }

    $decodedToken = decodeJwtToken($token, $secretKey);
    if (!$decodedToken || !isset($decodedToken['user_type']) || $decodedToken['user_type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Access denied. Only administrators can access this resource."]);
        return false;
    }
    return true;
}

// Verifica se a requisição é do tipo GET.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

// Autentica o administrador.
if (!authenticateAdmin($secretKey)) {
    exit();
}

// Pega e valida os parâmetros da URL.
$userType = $_GET['user_type'] ?? null;
$userId = $_GET['user_id'] ?? null;

if (!$userType || !$userId || !in_array($userType, ['doctor', 'patient']) || !is_numeric($userId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid parameters: user_type and user_id are required."]);
    exit();
}

// Define a tabela, o campo de ID e as colunas com base no tipo de usuário.
if ($userType === 'doctor') {
    $tableName = 'users_doctors';
    $idField = 'doctor_id';
    $columns = [
        'u.doctor_id', 'u.full_name', 'u.email', 'u.password_hash', 'u.phone_number', 
        'u.whatsapp_number', 'u.crm_number', 'u.specialization', 'u.sub_specialization', 
        'u.education', 'u.university', 'u.graduation_year', 'u.bio', 'u.consultation_fee', 
        'u.fee_currency', 'u.website_url', 'u.linkedin_url', 'u.awards', 'u.languages', 
        'u.countries_of_practice', 'u.profile_picture_url', 'u.document_url', 'u.date_of_birth', 
        'u.gender', 'u.address_street', 'u.address_number', 'u.address_complement', 
        'u.address_district', 'u.address_zip_code', 'u.full_address', 'u.created_at', 
        'u.updated_at', 'u.is_active', 'u.is_approved', 'u.last_login', 'u.reset_token', 
        'u.reset_token_expires_at', 'u.clinic_address', 'u.clinic_phone', 'u.sub_specialty', 
        'u.website', 'u.linkedin', 'u.certifications', 'u.countries_of_practice_json', 
        'u.google_refresh_token', 'u.google_access_token', 'u.google_access_token_expiry', 
        'u.bank_payment_details'
        // 'u.updated_at' is already included
    ];
} else { // patient
    $tableName = 'users_patients';
    $idField = 'patient_id';
    $columns = [
        'u.patient_id', 'u.full_name', 'u.email', 'u.password_hash', 'u.phone_number', 
        'u.whatsapp_number', 'u.address_street', 'u.address_number', 'u.address_complement', 
        'u.address_district', 'u.address_zip_code', 'u.full_address', 'u.nationality', 
        'u.date_of_birth', 'u.gender', 'u.emergency_contact_name', 'u.emergency_contact_phone', 
        'u.medical_history', 'u.allergies', 'u.medications', 'u.profile_picture_url', 
        'u.document_url', 'u.created_at', 'u.updated_at', 'u.is_active', 'u.last_login', 
        'u.reset_token', 'u.reset_token_expires_at'
        // 'u.updated_at' is already included
    ];
}

try {
    $selectColumns = implode(', ', $columns);
    $sql = "
        SELECT 
            {$selectColumns},
            co.name AS country, 
            s.name AS state, 
            ci.name AS city
        FROM {$tableName} u
        LEFT JOIN countries co ON u.country_id = co.country_id
        LEFT JOIN states s ON u.state_id = s.state_id
        LEFT JOIN cities ci ON u.city_id = ci.city_id
        WHERE u.{$idField} = :user_id
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // AJUSTE: Converte os IDs de JSON para nomes legíveis.
        if ($userType === 'doctor') {
            // Converte IDs de idiomas para nomes.
            if (!empty($user['languages'])) {
                $languageIds = json_decode($user['languages'], true);
                if (is_array($languageIds) && !empty($languageIds)) {
                    $placeholders = implode(',', array_fill(0, count($languageIds), '?'));
                    $langStmt = $pdo->prepare("SELECT name FROM languages WHERE id IN ({$placeholders})");
                    $langStmt->execute($languageIds);
                    $languageNames = $langStmt->fetchAll(PDO::FETCH_COLUMN);
                    $user['languages'] = implode(', ', $languageNames);
                }
            }

            // Converte IDs de países de atuação para nomes.
            if (!empty($user['countries_of_practice_json'])) {
                $countryIds = json_decode($user['countries_of_practice_json'], true);
                if (is_array($countryIds) && !empty($countryIds)) {
                    $placeholders = implode(',', array_fill(0, count($countryIds), '?'));
                    $countryStmt = $pdo->prepare("SELECT name FROM countries WHERE country_id IN ({$placeholders})");
                    $countryStmt->execute($countryIds);
                    $countryNames = $countryStmt->fetchAll(PDO::FETCH_COLUMN);
                    $user['countries_of_practice_json'] = implode(', ', $countryNames);
                }
            }
        }

        // Adiciona a senha "decodificada" para fins administrativos.
        $adminPassword = $_ENV['ADMIN_PASSWORD'] ?? null;
        if ($adminPassword && password_get_info($user['password_hash'])['algo'] === 0 && $user['password_hash'] === $adminPassword) {
             $user['password_decoded'] = $adminPassword . " (Matches admin password, unhashed)";
        } else if ($adminPassword && password_verify($adminPassword, $user['password_hash'])) {
             $user['password_decoded'] = $adminPassword . " (Matches admin password)";
        } else {
            $user['password_decoded'] = "Could not decode (complex hash)";
        }
        echo json_encode(["success" => true, "data" => $user]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found."]);
    }

} catch (PDOException $e) {
    error_log("Database error in get_user_details: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error while fetching user details."]);
}
?>
