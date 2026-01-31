<?php
require_once 'config.php';
header('Content-Type: text/plain');

try {
    $pdo = getDbConnection();

    echo "1. Altering 'users' table column 'role' from ENUM to VARCHAR(50)...\n";
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'staff'");
    echo "Success: Table altered.\n\n";

    echo "2. Fixing empty/missing roles for existing users...\n";
    $stmt = $pdo->prepare("UPDATE users SET role = 'viewer' WHERE role IS NULL OR role = ''");
    $stmt->execute();
    echo "Success: " . $stmt->rowCount() . " users updated.\n\n";

    echo "3. Verifying updated structure...\n";
    $stmt = $pdo->query("DESCRIBE users");
    while ($row = $stmt->fetch()) {
        if ($row['Field'] === 'role') {
            echo "Role Column Final Type: " . $row['Type'] . "\n";
        }
    }

    echo "\nAll database fixes completed successfully.\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>