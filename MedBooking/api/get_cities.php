<?php
require_once 'config.php';
require_once 'utils.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$state_id = $_GET['state_id'] ?? null;
$country_id = $_GET['country_id'] ?? null;

try {
    $sql = "SELECT city_id, name FROM cities";
    $params = [];
    $conditions = [];

    if ($state_id) {
        $conditions[] = "state_id = :state_id";
        $params[':state_id'] = $state_id;
    }
    if ($country_id) {
        $conditions[] = "country_id = :country_id";
        $params[':country_id'] = $country_id;
    }

    if (count($conditions) > 0) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    $sql .= " ORDER BY name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $cities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "cities" => $cities]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching cities: " . $e->getMessage()]);
}
?>
