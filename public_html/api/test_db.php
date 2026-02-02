<?php
// public_html/api/test_db.php
require_once 'config.php';

header('Content-Type: text/plain');

echo "--- Database Connection Test ---\n";

try {
    $pdo = getDbConnection();
    echo "SUCCESS: Database connection established.\n";
    echo "Database Name: " . DB_NAME . "\n";
    echo "Host: " . DB_HOST . "\n";
    echo "User: " . DB_USER . "\n";
} catch (Exception $e) {
    echo "FAILURE: " . $e->getMessage() . "\n";
    echo "Specific details have been logged to public_html/logs/php_errors.txt\n";
}
?>