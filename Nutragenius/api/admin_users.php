<?php
require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- Security Check: Ensure user is an authenticated admin ---
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
    if (!isset($decoded->data->is_admin) || !$decoded->data->is_admin) {
        json_response(['error' => 'Forbidden. Administrator access required.'], 403);
    }
    $admin_id = $decoded->data->id; // Get admin's own ID
} catch (Exception $e) {
    json_response(['error' => 'Invalid authentication token.'], 401);
}

// --- Handle different request methods ---
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- Fetch, filter, sort, and paginate users ---
    try {
        // Pagination
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Sorting
        $valid_sort_columns = ['full_name', 'email', 'created_at'];
        $sortBy = isset($_GET['sortBy']) && in_array($_GET['sortBy'], $valid_sort_columns) ? $_GET['sortBy'] : 'created_at';
        $sortOrder = isset($_GET['sortOrder']) && strtolower($_GET['sortOrder']) === 'asc' ? 'ASC' : 'DESC';
        
        // Search
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        $where_clauses = [];
        $params = [];

        if (!empty($search)) {
            $where_clauses[] = "(full_name LIKE :search OR email LIKE :search)";
            $params[':search'] = "%{$search}%";
        }

        $where_sql = count($where_clauses) > 0 ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

        // Get total count for pagination
        $count_query = "SELECT COUNT(id) as total FROM users {$where_sql}";
        $stmt_count = $pdo->prepare($count_query);
        $stmt_count->execute($params);
        $total_users = $stmt_count->fetch()['total'];

        // Get paginated data
        $data_query = "SELECT id, full_name, email, is_active, is_admin, has_paid, created_at FROM users {$where_sql} ORDER BY {$sortBy} {$sortOrder} LIMIT :limit OFFSET :offset";
        $stmt_data = $pdo->prepare($data_query);
        
        // Bind search params if they exist
        foreach ($params as $key => &$val) {
            $stmt_data->bindParam($key, $val, PDO::PARAM_STR);
        }
        $stmt_data->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt_data->bindParam(':offset', $offset, PDO::PARAM_INT);
        
        $stmt_data->execute();
        $users = $stmt_data->fetchAll();
        
        json_response([
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'totalUsers' => (int)$total_users,
                'totalPages' => ceil($total_users / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        log_error($e->getMessage(), __FILE__, $e->getLine());
        json_response(['error' => 'Failed to fetch users.'], 500);
    }

} elseif ($method === 'POST') {
    // --- Update or Delete a user ---
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['action']) || !isset($data['userId'])) {
        json_response(['error' => 'Invalid request. Action and userId are required.'], 400);
    }

    $user_id_to_modify = (int)$data['userId'];
    
    // Prevent admin from modifying their own status for certain actions
    if ($user_id_to_modify === $admin_id && in_array($data['action'], ['toggleStatus', 'deleteUser'])) {
        json_response(['error' => 'For security, administrators cannot alter their own status or delete their own account.'], 403);
    }

    try {
        if ($data['action'] === 'toggleStatus') {
            $valid_fields = ['is_active', 'is_admin', 'has_paid'];
            $field = $data['field'];
            if (!in_array($field, $valid_fields)) {
                json_response(['error' => 'Invalid field provided for update.'], 400);
            }
            
            $sql = "UPDATE users SET {$field} = NOT {$field} WHERE id = :userId";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['userId' => $user_id_to_modify]);
            
            json_response(['message' => "User's {$field} status toggled successfully."]);

        } elseif ($data['action'] === 'deleteUser') {
            
            $sql = "DELETE FROM users WHERE id = :userId";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['userId' => $user_id_to_modify]);

            if ($stmt->rowCount() > 0) {
                json_response(['message' => 'User deleted successfully.']);
            } else {
                json_response(['error' => 'User not found or already deleted.'], 404);
            }
        } else {
            json_response(['error' => 'Unknown action.'], 400);
        }

    } catch (PDOException $e) {
        log_error($e->getMessage(), __FILE__, $e->getLine());
        json_response(['error' => 'A database error occurred.'], 500);
    }
} else {
    json_response(['error' => 'Invalid request method.'], 405);
}
