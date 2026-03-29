<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'error_log.txt');

function log_request($message) {
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents('api_log.txt', "[$timestamp] $message\n", FILE_APPEND);
}

log_request("--- NOVO PEDIDO ---");
log_request("METHOD: {$_SERVER['REQUEST_METHOD']}");
log_request("QUERY_STRING: {$_SERVER['QUERY_STRING']}");
log_request("BODY: " . file_get_contents('php://input'));

require 'db.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}


$endpoint = $_GET['endpoint'] ?? 'status';
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$method = $_SERVER['REQUEST_METHOD'];

log_request("Endpoint solicitado: '$endpoint' com ID: '$id'");

$data = json_decode(file_get_contents('php://input'), true);

switch ($endpoint) {
    case 'records':
        handle_records($conn, $method, $id, $data);
        break;
    case 'users':
        handle_users($conn, $method, $id, $data);
        break;
    case 'actions':
        handle_actions($conn, $method, $id, $data);
        break;
    case 'posts':
        handle_posts($conn, $method, $id, $data);
        break;
    case 'login':
        handle_login($conn, $method, $data);
        break;
    case 'upload_media':
        handle_upload($conn);
        break;
    case 'delete_media':
        handle_delete_media($conn);
        break;
    case 'status':
        http_response_code(200);
        echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
        log_request("Status check bem-sucedido.");
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => "Endpoint not found: $endpoint"]);
        log_request("ERRO: Endpoint '$endpoint' não encontrado.");
        break;
}

function handle_records($conn, $method, $id, $data) {
    if ($method === 'GET') {
        $sql = "SELECT * FROM records ORDER BY createdAt DESC";
        $result = $conn->query($sql);
        $records = [];
        while($row = $result->fetch_assoc()) {
            $row['phases'] = json_decode($row['phases']);
            if (isset($row['damageValue'])) {
                $row['damageValue'] = (float)$row['damageValue'];
            }
            $records[] = $row;
        }
        echo json_encode($records);
    } elseif ($method === 'POST') {
        $type = $data['type'];
        $name = $conn->real_escape_string($data['name']);
        $phone = $conn->real_escape_string($data['phone']);
        $email = $conn->real_escape_string($data['email'] ?? null);
        $location = $conn->real_escape_string($data['location'] ?? null);
        $address = $conn->real_escape_string($data['address'] ?? null);
        $country = $conn->real_escape_string($data['country'] ?? null);
        $postalCode = $conn->real_escape_string($data['postalCode'] ?? null);
        $people = (int)($data['people'] ?? 0);
        $photoLink = $conn->real_escape_string($data['photoLink'] ?? null);
        $description = $conn->real_escape_string($data['description'] ?? null);
        $phases = json_encode($data['phases']);
        $volunteerSkills = $conn->real_escape_string($data['volunteerSkills'] ?? null);
        $consent = (bool)$data['consent'];
        $phoneConsent = (bool)($data['phoneConsent'] ?? false);
        $socialSecurityNumber = $conn->real_escape_string($data['socialSecurityNumber'] ?? null);
        $taxIdNumber = $conn->real_escape_string($data['taxIdNumber'] ?? null);
        $citizenCardNumber = $conn->real_escape_string($data['citizenCardNumber'] ?? null);
        $damageDescription = $conn->real_escape_string($data['damageDescription'] ?? null);
        $damageValue = isset($data['damageValue']) && is_numeric($data['damageValue']) ? (float)$data['damageValue'] : null;
        $damageDate = $conn->real_escape_string($data['damageDate'] ?? null);
        $affectedArea = $conn->real_escape_string($data['affectedArea'] ?? null);

        $sql = "INSERT INTO records (type, name, phone, email, location, address, country, postalCode, people, photoLink, description, phases, volunteerSkills, consent, phoneConsent, socialSecurityNumber, taxIdNumber, citizenCardNumber, damageDescription, damageValue, damageDate, affectedArea) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssssssssissssisssssdss", 
            $type, $name, $phone, $email, $location, $address, $country, $postalCode, $people, 
            $photoLink, $description, $phases, $volunteerSkills, $consent, $phoneConsent,
            $socialSecurityNumber, $taxIdNumber, $citizenCardNumber, $damageDescription,
            $damageValue, $damageDate, $affectedArea
        );
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Record created successfully', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            log_request("ERRO SQL: " . $stmt->error);
            echo json_encode(['message' => 'Failed to create record', 'error' => $stmt->error]);
        }
    } elseif ($method === 'PUT' && $id) {
        $status = $conn->real_escape_string($data['status']);
        $notes = $conn->real_escape_string($data['notes']);
        $validatedAt = date('Y-m-d H:i:s');
        $sql = "UPDATE records SET status = ?, notes = ?, validatedAt = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $status, $notes, $validatedAt, $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Record updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update record', 'error' => $stmt->error]);
        }
    } elseif ($method === 'DELETE' && $id) {
        $sql = "DELETE FROM records WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Record deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete record', 'error' => $stmt->error]);
        }
    }
}

function handle_users($conn, $method, $id, $data) {
    if ($method === 'GET') {
        $sql = "SELECT id, name, email, accessLevel, createdAt FROM users ORDER BY createdAt DESC";
        $result = $conn->query($sql);
        $users = [];
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
    } elseif ($method === 'POST') {
        $name = $conn->real_escape_string($data['name']);
        $email = $conn->real_escape_string($data['email']);
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $accessLevel = $conn->real_escape_string($data['accessLevel']);
        $sql = "INSERT INTO users (name, email, password, accessLevel) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $name, $email, $password, $accessLevel);
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'User created successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create user', 'error' => $stmt->error]);
        }
    } elseif ($method === 'PUT' && $id) {
        $name = $conn->real_escape_string($data['name']);
        $email = $conn->real_escape_string($data['email']);
        $accessLevel = $conn->real_escape_string($data['accessLevel']);
        $sql = "UPDATE users SET name = ?, email = ?, accessLevel = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $name, $email, $accessLevel, $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'User updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update user', 'error' => $stmt->error]);
        }
    } elseif ($method === 'DELETE' && $id) {
        if ($id === 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Cannot delete primary admin user']);
            return;
        }
        $sql = "DELETE FROM users WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'User deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete user', 'error' => $stmt->error]);
        }
    }
}

function handle_actions($conn, $method, $id, $data) {
    if ($method === 'GET') {
        $sql = "SELECT * FROM actions ORDER BY createdAt DESC";
        $result = $conn->query($sql);
        $actions = [];
        while($row = $result->fetch_assoc()) {
            $actions[] = $row;
        }
        echo json_encode($actions);
    } elseif ($method === 'POST') {
        $title = $conn->real_escape_string($data['title']);
        $activityType = $conn->real_escape_string($data['activityType']);
        $activityDate = $conn->real_escape_string($data['activityDate']);
        $location = $conn->real_escape_string($data['location']);
        $country = $conn->real_escape_string($data['country'] ?? 'Portugal');
        $postalCode = $conn->real_escape_string($data['postalCode'] ?? null);
        $responsiblePerson = $conn->real_escape_string($data['responsiblePerson']);
        $responsibleEmail = $conn->real_escape_string($data['responsibleEmail']);
        $responsiblePhone = $conn->real_escape_string($data['responsiblePhone']);
        $description = $conn->real_escape_string($data['description'] ?? null);
        $notes = $conn->real_escape_string($data['notes'] ?? null);

        $sql = "INSERT INTO actions (title, activityType, activityDate, location, country, postalCode, responsiblePerson, responsibleEmail, responsiblePhone, description, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssssss", $title, $activityType, $activityDate, $location, $country, $postalCode, $responsiblePerson, $responsibleEmail, $responsiblePhone, $description, $notes);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Action created successfully', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            log_request("ERRO SQL (actions): " . $stmt->error);
            echo json_encode(['message' => 'Failed to create action', 'error' => $stmt->error]);
        }
    } elseif ($method === 'PUT' && $id) {
        $status = $conn->real_escape_string($data['status']);
        $notes = $conn->real_escape_string($data['notes']);
        $validatedAt = date('Y-m-d H:i:s');
        $sql = "UPDATE actions SET status = ?, notes = ?, validatedAt = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $status, $notes, $validatedAt, $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Action updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update action', 'error' => $stmt->error]);
        }
    } elseif ($method === 'DELETE' && $id) {
        $sql = "DELETE FROM actions WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Action deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete action', 'error' => $stmt->error]);
        }
    }
}

function handle_posts($conn, $method, $id, $data) {
    if ($method === 'GET') {
        $sql = "SELECT * FROM posts ORDER BY createdAt DESC";
        $result = $conn->query($sql);
        $posts = [];
        while($row = $result->fetch_assoc()) {
            $row['pinned'] = (bool)$row['pinned'];
            $posts[] = $row;
        }
        echo json_encode($posts);
    } elseif ($method === 'POST') {
        $sql = "INSERT INTO posts (title, theme, author, description, content, pinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $pinned = isset($data['pinned']) ? (int)$data['pinned'] : 0;
        $createdAt = $data['createdAt'] ?? date('Y-m-d H:i:s');
        $updatedAt = $data['updatedAt'] ?? date('Y-m-d H:i:s');
        $stmt->bind_param("sssssiss", $data['title'], $data['theme'], $data['author'], $data['description'], $data['content'], $pinned, $createdAt, $updatedAt);
        if ($stmt->execute()) { http_response_code(201); echo json_encode(['message' => 'Post created', 'id' => $conn->insert_id, 'data' => $data]); }
        else { http_response_code(500); echo json_encode(['message' => 'Failed to create post', 'error' => $stmt->error]); }
    } elseif ($method === 'PUT' && $id) {
        $fields = [];
        $params = [];
        $types = '';
        // SOLUÇÃO 4: Adicionado 'createdAt' à lista de campos atualizáveis.
        foreach (['title', 'theme', 'author', 'description', 'content', 'pinned', 'createdAt', 'updatedAt'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= ($field === 'pinned') ? 'i' : 's';
            }
        }
        if (empty($fields)) { http_response_code(400); echo json_encode(['message' => 'No fields to update']); return; }
        $sql = "UPDATE posts SET " . implode(', ', $fields) . " WHERE id = ?";
        $params[] = $id;
        $types .= 'i';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) { echo json_encode(['message' => 'Post updated successfully']); }
        else { http_response_code(500); log_request("ERRO UPDATE POST: " . $stmt->error); echo json_encode(['message' => 'Failed to update post', 'error' => $stmt->error]); }
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $conn->prepare("SELECT content FROM posts WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $post = $result->fetch_assoc();

        if ($post && !empty($post['content'])) {
            preg_match_all('/(src|href)="([^"]*\/media\/[^"]+)"/', $post['content'], $matches);
            $filesToDelete = $matches[2];
            foreach ($filesToDelete as $fileUrl) {
                $filePath = '..' . parse_url($fileUrl, PHP_URL_PATH);
                if (file_exists($filePath)) {
                    unlink($filePath);
                    log_request("Ficheiro associado apagado: " . $filePath);
                }
            }
        }
        
        $sql = "DELETE FROM posts WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) { echo json_encode(['message' => 'Post deleted successfully']); }
        else { http_response_code(500); echo json_encode(['message' => 'Failed to delete post', 'error' => $stmt->error]); }
    }
}

function handle_upload($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
        return;
    }

    $uploadDir = '../media/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create media directory.']);
            return;
        }
    }

    if (isset($_FILES['file']) && $_FILES['file']['error'] == 0) {
        $fileName = time() . '_' . preg_replace('/[^A-Za-z0-9\.\-]/', '_', basename($_FILES['file']['name']));
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
            $domainName = $_SERVER['HTTP_HOST'];
            $url = $protocol . $domainName . '/media/' . $fileName;
            echo json_encode(['success' => true, 'url' => $url]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
        }
    } else {
        http_response_code(400);
        $error_code = $_FILES['file']['error'] ?? 'N/A';
        log_request("ERRO UPLOAD: " . $error_code);
        echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error. Code: ' . $error_code]);
    }
}

function handle_delete_media($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
        return;
    }
    
    $fileName = isset($_POST['fileName']) ? basename($_POST['fileName']) : '';
    if (empty($fileName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File name not provided.']);
        return;
    }

    $filePath = '../media/' . $fileName;
    log_request("A tentar apagar o ficheiro: " . $filePath);

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            log_request("Ficheiro apagado com sucesso.");
            echo json_encode(['success' => true, 'message' => 'File deleted successfully.']);
        } else {
            http_response_code(500);
            log_request("ERRO: Não foi possível apagar o ficheiro.");
            echo json_encode(['success' => false, 'message' => 'Could not delete the file.']);
        }
    } else {
        http_response_code(404);
        log_request("AVISO: Ficheiro não encontrado para apagar.");
        echo json_encode(['success' => false, 'message' => 'File not found.']);
    }
}

function handle_login($conn, $method, $data) {
    if ($method === 'POST') {
        $email = $conn->real_escape_string($data['email']);
        $password = $data['password'];
        $sql = "SELECT * FROM users WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    }
}

$conn->close();
?>