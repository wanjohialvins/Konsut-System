<?php
require_once 'config.php';

$pdo = getDbConnection();

try {
    echo "Starting schema update...\n";

    // 1. Add last_active to users if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_active'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN last_active DATETIME DEFAULT NULL");
        echo "Added 'last_active' column to 'users' table.\n";
    } else {
        echo "'last_active' already exists in 'users' table.\n";
    }

    // 2. Add created_by to documents if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM documents LIKE 'created_by'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE documents ADD COLUMN created_by INT DEFAULT NULL, ADD CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
        echo "Added 'created_by' column to 'documents' table.\n";
    } else {
        echo "'created_by' already exists in 'documents' table.\n";
    }

    echo "Schema update completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
