<?php
require_once 'config.php';
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Authenticate user
if (!isset($_COOKIE['auth_token'])) {
    json_response(['error' => 'Authentication required.'], 401);
}

$user_id = null;
try {
    $decoded = JWT::decode($_COOKIE['auth_token'], new Key(getenv('JWT_SECRET'), 'HS256'));
    $user_id = $decoded->data->id;
} catch (Exception $e) {
    json_response(['error' => 'Invalid or expired authentication token.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // **CORRECTION**: Convert empty strings to NULL before database operations.
    // This ensures that unfilled numeric fields are stored as NULL, not 0.
    foreach ($data as $key => &$value) {
        if ($value === '') {
            $value = null;
        }
    }
    unset($value); // Unset reference to the last element

    // Sanitize and prepare data for DB
    $data['healthGoals'] = json_encode($data['healthGoals'] ?? []);
    $data['healthConcerns'] = json_encode($data['healthConcerns'] ?? []);

    try {
        // Check if data already exists for the user
        $stmt_check = $pdo->prepare("SELECT id FROM questionnaires WHERE user_id = ?");
        $stmt_check->execute([$user_id]);
        $exists = $stmt_check->fetch();

        if ($exists) {
            // UPDATE existing record
            $set_clauses = [];
            foreach ($data as $key => $value) {
                // Do not try to update user_id in the SET clause
                if ($key !== 'user_id') {
                    $set_clauses[] = "`$key` = :$key";
                }
            }
            $sql = "UPDATE questionnaires SET " . implode(', ', $set_clauses) . " WHERE user_id = :user_id";
            $data['user_id'] = $user_id;
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);
            json_response(['message' => 'Questionnaire updated successfully.']);

        } else {
            // INSERT new record
            $data['user_id'] = $user_id;
            $columns = array_keys($data);
            $placeholders = array_map(fn($c) => ":$c", $columns);
            
            $sql = "INSERT INTO questionnaires (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);
            json_response(['message' => 'Questionnaire saved successfully.'], 201);
        }
    } catch (PDOException $e) {
        log_error($e->getMessage(), __FILE__, $e->getLine(), ['data' => $data]);
        json_response(['error' => 'Failed to save questionnaire data.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM questionnaires WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $questionnaire = $stmt->fetch();
        
        if ($questionnaire) {
            // Decode JSON strings back to arrays
            $questionnaire['healthGoals'] = json_decode($questionnaire['healthGoals'], true) ?: [];
            $questionnaire['healthConcerns'] = json_decode($questionnaire['healthConcerns'], true) ?: [];
            json_response($questionnaire);
        } else {
            json_response(null, 200); // No data found is not an error
        }
    } catch (PDOException $e) {
        log_error($e->getMessage(), __FILE__, $e->getLine());
        json_response(['error' => 'Failed to fetch questionnaire data.'], 500);
    }
}

