<?php
require_once 'config.php';
// The Composer autoload is now handled by config.php, so the line below is removed.
// require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Authenticate user
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

$user_id = null;
try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
    $user_id = $decoded->data->id;
} catch (Exception $e) {
    json_response(['error' => 'Invalid authentication token.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT id, full_name, email, avatar_url, dob, location, has_paid, is_admin, created_at FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        if ($user) {
            json_response($user);
        } else {
            json_response(['error' => 'User not found.'], 404);
        }
    } catch (PDOException $e) {
        log_error($e->getMessage(), __FILE__, $e->getLine());
        json_response(['error' => 'Failed to retrieve user data.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle multipart/form-data for file uploads
    $action = $_POST['action'] ?? null;

    if ($action === 'update_profile') {
        $fullName = trim($_POST['fullName'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $dob = trim($_POST['dob'] ?? '') ?: null;
        $location = trim($_POST['location'] ?? '') ?: null;
        
        if (empty($fullName) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(['error' => 'Full name and a valid email are required.'], 400);
        }

        $avatar_url = null;
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $media_dir = __DIR__ . '/../media';
            if (!is_dir($media_dir)) {
                mkdir($media_dir, 0755, true);
            }
            
            $file_info = new SplFileInfo($_FILES['avatar']['name']);
            $extension = $file_info->getExtension();
            $new_filename = uniqid('avatar_', true) . '.' . $extension;
            $destination = $media_dir . '/' . $new_filename;

            if (move_uploaded_file($_FILES['avatar']['tmp_name'], $destination)) {
                $avatar_url = '/media/' . $new_filename;
            } else {
                json_response(['error' => 'Failed to upload image.'], 500);
            }
        }
        
        try {
            $sql = "UPDATE users SET full_name = ?, email = ?, dob = ?, location = ?";
            $params = [$fullName, $email, $dob, $location];

            if ($avatar_url) {
                $sql .= ", avatar_url = ?";
                $params[] = $avatar_url;
            }

            $sql .= " WHERE id = ?";
            $params[] = $user_id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            json_response(['message' => 'Profile updated successfully.']);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate email)
                 json_response(['error' => 'This email address is already in use by another account.'], 409);
            }
            log_error($e->getMessage(), __FILE__, $e->getLine());
            json_response(['error' => 'Failed to update profile.'], 500);
        }
    }

    if ($action === 'update_password') {
        $currentPassword = $_POST['currentPassword'] ?? '';
        $newPassword = $_POST['newPassword'] ?? '';

        if (empty($currentPassword) || strlen($newPassword) < 8) {
            json_response(['error' => 'Current password is required and the new password must be at least 8 characters long.'], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();

            if ($user && password_verify($currentPassword, $user['password_hash'])) {
                $new_hash = password_hash($newPassword, PASSWORD_DEFAULT);
                $update_stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                $update_stmt->execute([$new_hash, $user_id]);
                json_response(['message' => 'Password updated successfully.']);
            } else {
                json_response(['error' => 'The current password is incorrect.'], 403);
            }
        } catch (PDOException $e) {
             log_error($e->getMessage(), __FILE__, $e->getLine());
             json_response(['error' => 'Failed to update the password.'], 500);
        }
    }
}
