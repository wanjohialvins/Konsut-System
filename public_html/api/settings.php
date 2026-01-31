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
    foreach ($data as $key => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, json_encode($value), json_encode($value)]);
    }
    echo json_encode(['success' => true]);
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requirePermission('system_control');
    if (isset($_GET['action']) && $_GET['action'] === 'clear') {
        // Thermonuclear Reset: Wipe everything except users
        $tables = [
            'document_items',
            'documents',
            'clients',
            'stock',
            'suppliers',
            'audit_logs',
            'notifications',
            'tasks',
            'memos',
            'vault_documents',
            'tickets',
            'ticket_messages',
            'settings'
        ];

        foreach ($tables as $table) {
            $pdo->query("DELETE FROM $table");
            // Reset Auto Increment if applicable
            try {
                $pdo->query("ALTER TABLE $table AUTO_INCREMENT = 1");
            } catch (Exception $e) {
            }
        }

        echo json_encode(['success' => true, 'message' => 'System wiped successfully']);
    }
}
?>