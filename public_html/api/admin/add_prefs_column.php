<?php
// backend/api/admin/add_prefs_column.php
require_once '../config.php';

try {
    $pdo = getDbConnection();

    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'preferences'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE users ADD COLUMN preferences LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`))");
        echo "Column 'preferences' added successfully.";
    } else {
        echo "Column 'preferences' already exists.";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>