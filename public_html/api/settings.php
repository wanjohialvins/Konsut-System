<?php
// backend/settings.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requirePermission('view_settings');
    $stmt = $pdo->query("SELECT * FROM settings");
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
    }
    echo json_encode($settings);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requirePermission('manage_settings');
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'database_stats') {
            // Fetch table stats
            requirePermission('system_control');
            $stmt = $pdo->query("SELECT table_name AS name, table_rows AS rows_count, data_length AS size FROM information_schema.tables WHERE table_schema = '" . DB_NAME . "'");
            echo json_encode($stmt->fetchAll());
            exit;
        }
        if ($_GET['action'] === 'truncate_table') {
            requirePermission('system_control');
            $table = $data['table'] ?? '';

            // Whitelist tables to prevent SQL injection or deletion of system tables if needed
            // For now, valid tables from our schema
            $validTables = [
                'audit_logs',
                'auth_tokens',
                'clients',
                'document_items',
                'documents',
                'login_history',
                'memos',
                'notification_reads',
                'notifications',
                'sequences',
                'settings',
                'stock',
                'suppliers',
                'tasks',
                'ticket_messages',
                'tickets',
                'users',
                'vault_documents'
            ];

            if (!in_array($table, $validTables)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid or restricted table']);
                exit;
            }

            try {
                $pdo->query("SET FOREIGN_KEY_CHECKS = 0");
                $pdo->query("TRUNCATE TABLE `$table`"); // Backticks for safety
                $pdo->query("SET FOREIGN_KEY_CHECKS = 1");

                // Audit
                $userId = getRequestHeader('X-User-Id');
                if ($userId) {
                    $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")
                        ->execute([$userId, 'TRUNCATE_TABLE', "Truncated table: $table"]);
                }

                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            exit;
        }
    }

    foreach ($data as $key => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, json_encode($value), json_encode($value)]);
    }
    echo json_encode(['success' => true]);
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requirePermission('system_control');
    if (isset($_GET['action']) && $_GET['action'] === 'clear') {
        // Thermonuclear Reset: Wipe everything except users and active sessions
        $tables = [
            'document_items',   // FK to documents
            'documents',        // FK to clients
            'vault_documents',  // FK to users
            'ticket_messages',  // FK to tickets
            'tickets',
            'notification_reads', // FK to notifications
            'notifications',
            'tasks',
            'memos',
            'login_history',
            'audit_logs',
            'stock',
            'suppliers',
            'clients',
            'sequences',
            'settings',
            'audit_logs' // Duplicate safety
        ];

        try {
            $pdo->beginTransaction();

            // Disable FK checks to allow truncation/deletion in any order (though we sorted above)
            $pdo->query("SET FOREIGN_KEY_CHECKS = 0");

            foreach ($tables as $table) {
                // Use TRUNCATE for speed and auto-increment reset, but DELETE for safety if user lacks DROP privs
                // TRUNCATE is better for a "nuclear" reset
                $pdo->query("TRUNCATE TABLE $table");
            }

            // Reset default sequences
            $pdo->query("INSERT INTO sequences (type, current_value) VALUES ('invoice', 0), ('quotation', 0), ('proforma', 0)");

            // Re-enable FK checks
            $pdo->query("SET FOREIGN_KEY_CHECKS = 1");

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'System state completely atomized.']);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
?>