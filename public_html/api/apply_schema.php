<?php
// backend/apply_schema.php

$host = 'localhost';
$user = 'root';
$pass = ''; // Default XAMPP password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connected to MySQL server successfully.<br>";

    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        die("Error: database.sql not found.");
    }

    $sql = file_get_contents($sqlFile);

    // Remove comments to avoid issues with parsing if we were splitting, 
    // but PDO::exec might handle multiple statements if supported. 
    // However, it's safer to execute properly.
    // Let's try executing the full block.
    // If that fails, we might need to split by ';'.

    try {
        $pdo->exec($sql);
        echo "Database schema imported successfully from database.sql.<br>";
    } catch (PDOException $e) {
        // Fallback: Attempt to split statements (rudimentary)
        echo "Full execution failed (" . $e->getMessage() . "). Attempting statement splitting...<br>";

        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $stmt) {
            if (!empty($stmt)) {
                try {
                    $pdo->exec($stmt);
                } catch (PDOException $e2) {
                    echo "Error executing statement: " . htmlspecialchars(substr($stmt, 0, 50)) . "... <br>Error: " . $e2->getMessage() . "<br>";
                }
            }
        }
        echo "Statement splitting execution completed (check errors above).<br>";
    }

} catch (\PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}
?>