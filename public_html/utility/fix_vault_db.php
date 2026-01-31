<?php
require_once 'config.php';

$pdo = getDbConnection();
header('Content-Type: text/plain');

echo "Database Fix Tool Starting...\n";

// 1. Add user_id to vault_documents
try {
    echo "Checking 'user_id' column...\n";
    $result = $pdo->query("SHOW COLUMNS FROM vault_documents LIKE 'user_id'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE vault_documents ADD COLUMN user_id INT NULL");
        echo "SUCCESS: Added 'user_id' column.\n";

        // Add FK
        try {
            $pdo->exec("ALTER TABLE vault_documents ADD CONSTRAINT fk_vault_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
            echo "SUCCESS: Added Foreign Key constraint.\n";
        } catch (Exception $e) {
            echo "WARNING: Could not add FK (might be datatype mismatch or index issue): " . $e->getMessage() . "\n";
        }
    } else {
        echo "SKIPPED: 'user_id' exists.\n";
    }
} catch (Exception $e) {
    echo "ERROR: Failed to add user_id: " . $e->getMessage() . "\n";
}

// 2. Add iv to vault_documents
try {
    echo "Checking 'iv' column...\n";
    $result = $pdo->query("SHOW COLUMNS FROM vault_documents LIKE 'iv'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE vault_documents ADD COLUMN iv VARCHAR(255) NULL");
        echo "SUCCESS: Added 'iv' column.\n";
    } else {
        echo "SKIPPED: 'iv' exists.\n";
    }
} catch (Exception $e) {
    echo "ERROR: Failed to add iv: " . $e->getMessage() . "\n";
}

echo "Database Fix Complete.\n";
?>