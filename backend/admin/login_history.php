<?php
// backend/admin/login_history.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('view_security_logs');

$limit = $_GET['limit'] ?? 50;

try {
    $stmt = $pdo->prepare("
        SELECT 
            l.id,
            l.user_id,
            l.ip_address,
            l.login_time as timestamp,
            COALESCE(u.username, 'Deleted User') as username,
            COALESCE(u.role, 'viewer') as role
        FROM login_history l 
        LEFT JOIN users u ON l.user_id = u.id 
        ORDER BY l.login_time DESC 
        LIMIT ?");
    $stmt->bindParam(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>