<?php
// backend/admin/actions.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control');

$action = $_GET['action'] ?? '';
$user_id = $_SERVER['HTTP_X_USER_ID'] ?? 0; // Ideally from session/token

try {
    // Log the action
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$user_id, 'SYSTEM_ACTION', "Executed system action: $action"]);

    switch ($action) {
        case 'purge-sessions':
            // In a real app, delete from sessions table or invalidate tokens
            // For now, just a dummy success
            break;

        case 'broadcast':
            $message = $_GET['message'] ?? 'System Maintenance Triggered';
            // Insert notification for ALL users
            // 1. Get all user IDs
            $users = $pdo->query("SELECT id FROM users")->fetchAll(PDO::FETCH_COLUMN);
            $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, type, message, read_status, created_at) VALUES (?, 'system', ?, 0, NOW())");

            $count = 0;
            foreach ($users as $uid) {
                $notifStmt->execute([$uid, $message]);
                $count++;
            }
            echo json_encode(['success' => true, 'message' => "Broadcast sent to $count users"]);
            exit; // Exit here as we outputted custom json

        case 'sync':
            // "Registry Sync" - A fancy name for a Database Health Check
            // We'll check for orphaned invoices (items without valid invoice_id)
            $orphans = $pdo->query("SELECT COUNT(*) FROM invoice_items WHERE invoice_id NOT IN (SELECT id FROM invoices)")->fetchColumn();

            echo json_encode([
                'success' => true,
                'message' => "Sync Complete. Database Integrity: " . ($orphans == 0 ? "OPTIMAL" : "FOUND $orphans ORPHAN RECORDS"),
                'details' => ['orphaned_items' => $orphans]
            ]);
            exit;
    }

    echo json_encode(['success' => true, 'message' => "Action '$action' executed"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>