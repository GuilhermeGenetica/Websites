<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$country_id = $_GET['country_id'] ?? null;

try {
    $sql = "SELECT state_id, name, uf FROM states";
    $params = [];

    if ($country_id) {
        $sql .= " WHERE country_id = :country_id";
        $params[':country_id'] = $country_id;
    }
    $sql .= " ORDER BY name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $states = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "states" => $states]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching states: " . $e->getMessage()]);
}
?>
