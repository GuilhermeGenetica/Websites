<?php
// /api/rules.php
// Handles fetching rules for the frontend and CRUD operations for the admin editor.

require_once 'config.php'; // Includes DB connection ($pdo) and helper functions like json_response, log_error
require __DIR__ . '/../vendor/autoload.php'; // Needed for JWT

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- Helper function to check if user is admin ---
function is_admin_user($pdo) {
    if (!isset($_COOKIE['auth_token'])) {
        return false;
    }
    try {
        $decoded = JWT::decode($_COOKIE['auth_token'], new Key(JWT_SECRET, 'HS256'));
        $user_id = $decoded->data->id;

        $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        return $user && $user['is_admin'] == 1;
    } catch (Exception $e) {
        return false; // Invalid token or DB error
    }
}

// --- Main Request Handling ---
$method = $_SERVER['REQUEST_METHOD'];
$is_admin = is_admin_user($pdo); // Check admin status once

header('Content-Type: application/json; charset=utf-8'); // Ensure correct header is always set

try {
    switch ($method) {
        case 'GET':
            // Fetch all active rules, grouped by category (for recommendation engine and admin editor loading)
            $stmt = $pdo->prepare("SELECT * FROM rules WHERE is_active = 1 ORDER BY category, id");
            $stmt->execute();
            $rules = $stmt->fetchAll();

            $rulesByCategory = [];
            foreach ($rules as $rule) {
                $category = $rule['category'];
                if (!isset($rulesByCategory[$category])) {
                    $rulesByCategory[$category] = [];
                }
                // Decode JSON strings into PHP arrays/objects before sending
                $rule['conditions'] = json_decode($rule['conditions_json'], true);
                $rule['keyNutrient'] = json_decode($rule['key_nutrient_json'], true); // Use true for associative array if needed, otherwise null/string/array
                unset($rule['conditions_json'], $rule['key_nutrient_json']); // Remove the original JSON string fields
                $rulesByCategory[$category][] = $rule;
            }
            json_response($rulesByCategory);
            break;

        case 'POST':
            // Create a new rule (Admin only)
            if (!$is_admin) {
                json_response(['error' => 'Unauthorized'], 403);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            // Basic validation
            if (empty($data['category']) || !isset($data['conditions']) || !isset($data['response'])) {
                 json_response(['error' => 'Missing required fields (category, conditions, response).'], 400);
            }
            if (!is_array($data['conditions'])) {
                 json_response(['error' => 'Conditions must be an array.'], 400);
            }

            // Prepare data for insertion (encode arrays/objects to JSON strings)
            $conditions_json = json_encode($data['conditions']);
            // Handle keyNutrient: might be null, string, or array
            $key_nutrient_json = isset($data['keyNutrient']) ? json_encode($data['keyNutrient']) : null;


            $sql = "INSERT INTO rules (category, conditions_json, logic, response, key_nutrient_json, is_active) VALUES (:category, :conditions_json, :logic, :response, :key_nutrient_json, :is_active)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':category' => $data['category'],
                ':conditions_json' => $conditions_json,
                ':logic' => $data['logic'] ?? 'AND',
                ':response' => $data['response'],
                ':key_nutrient_json' => $key_nutrient_json,
                 ':is_active' => isset($data['is_active']) ? (bool)$data['is_active'] : true
            ]);

            $new_rule_id = $pdo->lastInsertId();
             // Fetch the newly created rule to return it (decode JSON for consistency)
            $stmt_fetch = $pdo->prepare("SELECT * FROM rules WHERE id = ?");
            $stmt_fetch->execute([$new_rule_id]);
            $new_rule = $stmt_fetch->fetch();
            if ($new_rule) {
                $new_rule['conditions'] = json_decode($new_rule['conditions_json'], true);
                $new_rule['keyNutrient'] = json_decode($new_rule['key_nutrient_json'], true);
                unset($new_rule['conditions_json'], $new_rule['key_nutrient_json']);
                json_response($new_rule, 201);
            } else {
                 json_response(['error' => 'Failed to retrieve created rule.'], 500);
            }
            break;

        case 'PUT':
            // Update an existing rule (Admin only)
             if (!$is_admin) {
                json_response(['error' => 'Unauthorized'], 403);
            }

            // Expecting rule ID in the URL, e.g., /api/rules.php?id=123
            $rule_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$rule_id) {
                 json_response(['error' => 'Invalid or missing rule ID.'], 400);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            // Basic validation
             if (empty($data)) {
                 json_response(['error' => 'No update data provided.'], 400);
            }

            // Build SET clauses dynamically
            $set_clauses = [];
            $params = [':id' => $rule_id];
            foreach ($data as $key => $value) {
                 // Prevent updating ID
                 if ($key === 'id') continue;

                 // Map frontend keys to DB columns and handle JSON encoding
                 if ($key === 'conditions') {
                     if (!is_array($value)) { json_response(['error' => 'Conditions must be an array.'], 400); }
                     $set_clauses[] = "conditions_json = :conditions_json";
                     $params[':conditions_json'] = json_encode($value);
                 } elseif ($key === 'keyNutrient') {
                     $set_clauses[] = "key_nutrient_json = :key_nutrient_json";
                     $params[':key_nutrient_json'] = isset($value) ? json_encode($value) : null;
                 } elseif (in_array($key, ['category', 'logic', 'response', 'is_active'])) { // Whitelist allowed columns
                     $set_clauses[] = "`$key` = :$key";
                     $params[":$key"] = ($key === 'is_active') ? (bool)$value : $value;
                 }
            }

            if (empty($set_clauses)) {
                 json_response(['error' => 'No valid fields provided for update.'], 400);
            }

            $sql = "UPDATE rules SET " . implode(', ', $set_clauses) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() > 0) {
                 // Fetch the updated rule to return it
                $stmt_fetch = $pdo->prepare("SELECT * FROM rules WHERE id = ?");
                $stmt_fetch->execute([$rule_id]);
                $updated_rule = $stmt_fetch->fetch();
                if ($updated_rule) {
                    $updated_rule['conditions'] = json_decode($updated_rule['conditions_json'], true);
                    $updated_rule['keyNutrient'] = json_decode($updated_rule['key_nutrient_json'], true);
                    unset($updated_rule['conditions_json'], $updated_rule['key_nutrient_json']);
                    json_response($updated_rule);
                } else {
                     json_response(['message' => 'Rule updated, but failed to retrieve confirmation.']); // Should not happen often
                }
            } else {
                 // Check if the rule exists, maybe no actual changes were made
                 $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM rules WHERE id = ?");
                 $stmt_check->execute([$rule_id]);
                 if ($stmt_check->fetchColumn() > 0) {
                     json_response(['message' => 'No changes detected for the rule.']);
                 } else {
                    json_response(['error' => 'Rule not found or update failed.'], 404);
                 }
            }
            break;

        case 'DELETE':
            // Delete a rule (Admin only) - Or set is_active = 0
             if (!$is_admin) {
                json_response(['error' => 'Unauthorized'], 403);
            }

             // Expecting rule ID in the URL, e.g., /api/rules.php?id=123
             $rule_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
             if (!$rule_id) {
                 json_response(['error' => 'Invalid or missing rule ID.'], 400);
            }

            // Option 1: Hard Delete
            // $sql = "DELETE FROM rules WHERE id = :id";
            // Option 2: Soft Delete (recommended)
            $sql = "UPDATE rules SET is_active = 0 WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $rule_id]);

            if ($stmt->rowCount() > 0) {
                // json_response(['message' => 'Rule deleted successfully.']); // For Hard Delete
                 json_response(['message' => 'Rule deactivated successfully.']); // For Soft Delete
            } else {
                json_response(['error' => 'Rule not found or already inactive/deleted.'], 404);
            }
            break;

        default:
             json_response(['error' => "Method {$method} not allowed."], 405);
            break;
    }

} catch (PDOException $e) {
    log_error("Database error in rules.php: " . $e->getMessage(), __FILE__, $e->getLine());
    json_response(['error' => 'A database error occurred.'], 500);
} catch (Exception $e) {
    log_error("General error in rules.php: " . $e->getMessage(), __FILE__, $e->getLine());
     json_response(['error' => 'An internal server error occurred.'], 500);
}
?>
