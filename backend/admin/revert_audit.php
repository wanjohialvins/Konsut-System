<?php
// backend/admin/revert_audit.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control'); // High privilege

$data = json_decode(file_get_contents('php://input'), true);
$auditId = $data['audit_id'] ?? 0;

if (!$auditId) {
    http_response_code(400);
    echo json_encode(['error' => 'Audit ID required']);
    exit;
}

// In a real system, reverting is complex. 
// We will just mark it as reverted in the log for this simple implementation.
try {
    $stmt = $pdo->prepare("UPDATE audit_logs SET details = CONCAT(details, ' [REVERTED]') WHERE id = ?");
    $stmt->execute([$auditId]);

    echo json_encode(['success' => true, 'message' => 'Action marked as reverted']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>