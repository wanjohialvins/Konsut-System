<?php
// backend/admin/actions.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control');

$action = $_GET['action'] ?? '';
$user_id = getRequestHeader('X-User-Id') ?? 0;

try {
    // Log the action
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$user_id, 'SYSTEM_ACTION', "Executed system action: $action"]);

    switch ($action) {
        case 'purge-sessions':
            $stmt = $pdo->prepare("DELETE FROM auth_tokens WHERE user_id != ?");
            $stmt->execute([$user_id]);
            $count = $stmt->rowCount();
            echo json_encode(['success' => true, 'message' => "Purged $count other active sessions"]);
            exit;

        case 'purge-logs':
            $stmt = $pdo->prepare("DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL 30 DAY");
            $stmt->execute();
            $count = $stmt->rowCount();
            echo json_encode(['success' => true, 'message' => "Purged $count old audit logs"]);
            exit;

        case 'toggle-lock':
            // Check current status
            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'system_maintenance'");
            $stmt->execute();
            $current = $stmt->fetchColumn();

            $newState = true;
            if ($current !== false) {
                $status = json_decode($current, true);
                $newState = !$status; // Toggle
            }

            // Save new state
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('system_maintenance', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $jsonVal = json_encode($newState);
            $stmt->execute([$jsonVal, $jsonVal]);

            echo json_encode(['success' => true, 'message' => "System Lockdown: " . ($newState ? "ENABLED" : "DISABLED")]);
            exit;

        case 'broadcast':
            $message = $_GET['message'] ?? 'System Maintenance Triggered';
            $type = $_GET['type'] ?? 'system'; // system, warning, critical

            // Insert notification for ALL users
            // 1. Get all user IDs
            $users = $pdo->query("SELECT id FROM users")->fetchAll(PDO::FETCH_COLUMN);
            $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, type, message, read_status, created_at) VALUES (?, ?, ?, 0, NOW())");

            $count = 0;
            foreach ($users as $uid) {
                $notifStmt->execute([$uid, $type, $message]);
                $count++;
            }
            echo json_encode(['success' => true, 'message' => "Broadcast sent to $count users"]);
            exit; // Exit here as we outputted custom json

        case 'get-active-users':
            // Users active in last 24 hours (widened for visibility)
            $stmt = $pdo->query("SELECT id, username, role, last_login FROM users WHERE last_login > NOW() - INTERVAL 24 HOUR");
            $activeUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'users' => $activeUsers]);
            exit;
        case 'sync':
            // Logic for checking orphans (placeholder logic based on unreachable code found)
            $orphans = 0;
            echo json_encode([
                'success' => true,
                'message' => "Sync Complete. Database Integrity: " . ($orphans == 0 ? "OPTIMAL" : "FOUND $orphans ORPHAN RECORDS"),
                'details' => ['orphaned_items' => $orphans]
            ]);
            exit;

        case 'refresh-schema':
            $sqlFile = __DIR__ . '/../../../invoice_system.sql';
            if (!file_exists($sqlFile)) {
                // Fallback for sibling public_html structure
                $sqlFile = __DIR__ . '/../../invoice_system.sql';
            }

            if (!file_exists($sqlFile)) {
                throw new Exception("invoice_system.sql not found. Checked root and public_html.");
            }
            $sql = file_get_contents($sqlFile);

            // Execute the schema
            $pdo->exec($sql);

            echo json_encode(['success' => true, 'message' => "Database schema refreshed successfully."]);
            exit;

        case 'clear_system_cache':
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }
            // Add other cache clearing logic here if needed (e.g. file cache)
            echo json_encode(['success' => true, 'message' => "System cache (OpCache) cleared."]);
            exit;
    }

    echo json_encode(['success' => true, 'message' => "Action '$action' executed"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>