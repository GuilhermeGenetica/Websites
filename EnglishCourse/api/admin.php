<?php
// api/admin.php
// Endpoint para gestão de utilizadores pelo administrador.

require_once __DIR__ . '/bootstrap.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- Headers ---
header("Access-Control-Allow-Origin: " . $frontendBaseUrl);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- Autenticação e Autorização ---
try {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new Exception("Acesso negado. Token não fornecido.", 401);
    }
    $jwt = $matches[1];
    $decoded = JWT::decode($jwt, new Key($jwtSecretKey, 'HS256'));
    $userId = $decoded->data->id;
    $isAdmin = $decoded->data->is_admin ?? false;

    if (!$isAdmin) {
        throw new Exception("Acesso negado. Permissões insuficientes.", 403);
    }
} catch (Exception $e) {
    $code = $e->getCode() > 0 ? $e->getCode() : 401;
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit();
}

// --- Lógica do Endpoint ---
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // --- Listar Utilizadores com Paginação, Ordenação e Busca ---
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
        $offset = ($page - 1) * $limit;
        
        $sortBy = $_GET['sortBy'] ?? 'created_at';
        $sortOrder = strtoupper($_GET['sortOrder'] ?? 'DESC');
        $allowedSortBy = ['id', 'name', 'email', 'level', 'plan', 'is_active', 'is_admin', 'created_at'];
        if (!in_array($sortBy, $allowedSortBy)) $sortBy = 'created_at';
        if ($sortOrder !== 'ASC') $sortOrder = 'DESC';
        
        $search = $_GET['search'] ?? '';

        // Contagem Total
        $countSql = "SELECT COUNT(id) FROM users";
        $countWhere = '';
        $countParams = [];
        if (!empty($search)) {
            $countWhere = " WHERE name LIKE ? OR email LIKE ?";
            $countParams = ["%$search%", "%$search%"];
        }
        $stmtCount = $conn->prepare($countSql . $countWhere);
        $stmtCount->execute($countParams);
        $total = $stmtCount->fetchColumn();
        $totalPages = ceil($total / $limit);

        // Busca dos Dados
        $sql = "SELECT id, name, email, level, plan, is_active, is_admin, stripe_customer_id, stripe_subscription_id FROM users";
        $where = '';
        $params = [];
        if (!empty($search)) {
            $where = " WHERE name LIKE ? OR email LIKE ?";
            $params = ["%$search%", "%$search%"];
        }
        $sql .= $where . " ORDER BY `$sortBy` $sortOrder LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $conn->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key + 1, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $users = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'users' => $users,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => $totalPages]
        ]);

    } elseif ($method === 'POST') {
        // --- Atualizar Utilizador ---
        $data = json_decode(file_get_contents("php://input"), true);
        $userIdToUpdate = $data['userIdToUpdate'] ?? null;
        $updates = $data['updates'] ?? [];

        if (!$userIdToUpdate || empty($updates)) {
            throw new Exception("Dados insuficientes para atualização.");
        }

        $allowedFields = ['name', 'email', 'level', 'plan', 'is_active', 'is_admin', 'stripe_customer_id', 'stripe_subscription_id'];
        $setClauses = [];
        $params = [];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setClauses[] = "`$field` = ?";
                // CORREÇÃO: Converte strings vazias para NULL nos campos unique que podem ser nulos
                if (in_array($field, ['stripe_customer_id', 'stripe_subscription_id']) && $value === '') {
                    $params[] = null;
                } else {
                    $params[] = $value;
                }
            }
        }

        if (empty($setClauses)) {
            throw new Exception("Nenhum campo válido para atualização.");
        }

        $sql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE id = ?";
        $params[] = $userIdToUpdate;

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Utilizador atualizado com sucesso.']);
    }

} catch (Exception $e) {
    http_response_code(400);
    custom_log("Admin API Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
