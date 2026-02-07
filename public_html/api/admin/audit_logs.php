<?php
// backend/admin/audit_logs.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('view_audit_logs');

$limit = $_GET['limit'] ?? 100;

try {
    $stmt = $pdo->prepare("
        SELECT 
            a.id, 
            a.user_id, 
            a.action, 
            a.details,
            a.data_before,
            a.data_after,
            a.entity_type,
            a.entity_id,
            '0.0.0.0' as ip_address,
            DATE_FORMAT(a.timestamp, '%Y-%m-%dT%H:%i:%sZ') as created_at, 
            u.username, 
            u.role 
        FROM audit_logs a 
        LEFT JOIN users u ON a.user_id = u.id 
        ORDER BY a.timestamp DESC 
        LIMIT ?");
    $stmt->bindParam(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>