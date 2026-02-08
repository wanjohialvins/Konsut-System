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


// Save backup to server for restore functionality
$backupDir = __DIR__ . '/../../logs/backups/';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$filename = 'system_backup_' . date('Y-m-d_H-i-s') . '.json';
$filepath = $backupDir . $filename;

$jsonContent = json_encode($backup, JSON_PRETTY_PRINT);
if (file_put_contents($filepath, $jsonContent) === false) {
    error_log("Failed to save backup to $filepath");
}

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="' . $filename . '"');

echo $jsonContent;
?>