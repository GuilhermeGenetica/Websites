<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

try {
    $stmt = $pdo->query("SELECT country_id, name FROM countries ORDER BY name ASC");
    $countries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "countries" => $countries]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching countries: " . $e->getMessage()]);
}
?>
