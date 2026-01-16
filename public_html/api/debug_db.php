<?php
require_once 'config.php';
header('Content-Type: text/plain');

$pdo = getDbConnection();

echo "--- TABLE STRUCTURE (users) ---\n";
$stmt = $pdo->query("DESCRIBE users");
while ($row = $stmt->fetch()) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Default'] . "\n";
}

echo "\n--- USER DATA (Partial) ---\n";
$stmt = $pdo->query("SELECT id, username, role, permissions FROM users LIMIT 10");
while ($row = $stmt->fetch()) {
    echo $row['id'] . " | " . $row['username'] . " | [" . $row['role'] . "] | " . substr($row['permissions'], 0, 50) . "...\n";
}
?>