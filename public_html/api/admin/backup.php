<?php
// backend/api/admin/backup.php
require_once '../config.php';

// Ensure user has admin/system control permissions
requirePermission('system_control');

$pdo = getDbConnection();

$tables = [
    'users',
    'clients',
    'stock',
    'suppliers',
    'vault_documents',
    'tasks',
    'memos',
    'notifications',
    'documents',
    'document_items',
    'invoice_items',
    'settings',
    'audit_logs',
    'login_history'
];

$backup = [
    'metadata' => [
        'generated_at' => date('Y-m-d H:i:s'),
        'version' => '2.0'
    ],
    'data' => []
];

foreach ($tables as $table) {
    try {
        // Check if table exists to prevent crash
        $check = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() > 0) {
            $stmt = $pdo->query("SELECT * FROM $table");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $backup['data'][$table] = $rows;
        }
    } catch (Exception $e) {
        // Log error but continue with other tables
        error_log("Backup error for table $table: " . $e->getMessage());
    }
}

// Special handling for settings to keep them as objects if they were JSON strings
// The settings table stores 'setting_value' as JSON column or stringified JSON.
// Current fetchAll returns raw DB values. Depending on DB driver, JSON columns might be returned as strings.

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="system_backup_' . date('Y-m-d') . '.json"');

echo json_encode($backup, JSON_PRETTY_PRINT);
?>