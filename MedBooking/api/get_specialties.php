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
    $stmt = $pdo->query("SELECT id, specialty_name FROM medical_specialties ORDER BY specialty_name ASC");
    $specialties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "specialties" => $specialties]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching specialties: " . $e->getMessage()]);
}
?>
