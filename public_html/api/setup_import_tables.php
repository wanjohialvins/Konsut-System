<?php
// backend/setup_import_tables.php
require_once 'config.php';

// Only Admin/CEO or CLI
if (php_sapi_name() !== 'cli') {
    require_once 'auth.php';
    $userId = getRequestHeader('X-User-Id');
    if (!$userId)
        die('Unauthorized');

    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $role = $stmt->fetchColumn();
    if (!in_array(strtolower($role), ['admin', 'ceo'])) {
        die('Unauthorized');
    }
} else {
    $pdo = getDbConnection();
}

$sql = "
CREATE TABLE IF NOT EXISTS import_staging_clients (
    batch_id VARCHAR(50) NOT NULL,
    row_index INT NOT NULL,
    data_json TEXT, -- Raw JSON data
    status ENUM('pending', 'valid', 'error', 'imported') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_batch (batch_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $pdo->exec($sql);
    echo "Import Staging Table Created Successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
