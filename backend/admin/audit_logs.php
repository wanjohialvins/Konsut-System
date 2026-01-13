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
            a.details as data_after, 
            '' as data_before,
            'SYSTEM' as entity_type,
            '0' as entity_id,
            '0.0.0.0' as ip_address,
            a.timestamp as created_at, 
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