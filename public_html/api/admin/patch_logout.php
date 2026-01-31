<?php
require_once '../config.php';
requirePermission('manage_system');

$pdo = getDbConnection();

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'force_refresh'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN force_refresh TINYINT(1) DEFAULT 0");
        echo json_encode(['success' => true, 'message' => "Column 'force_refresh' added."]);
    } else {
        echo json_encode(['success' => true, 'message' => "Column 'force_refresh' already exists."]);
    }
} catch (PDOException $e) {
    sendError($e->getMessage(), 500);
}
