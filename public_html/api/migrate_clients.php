<?php
require_once 'config.php';

$pdo = getDbConnection();

try {
    // Add company column to clients table
    $pdo->exec("ALTER TABLE clients ADD COLUMN company VARCHAR(100) DEFAULT NULL AFTER name");

    echo "Migration successful: Added 'company' column to 'clients' table.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Migration skipped: 'company' column already exists.";
    } else {
        echo "Migration failed: " . $e->getMessage();
    }
}
?>