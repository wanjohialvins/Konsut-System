<?php
require_once 'config.php';
$pdo = getDbConnection();

// Set password to 'admin123'
$pass = password_hash('admin123', PASSWORD_DEFAULT);

$username = 'admin';

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user) {
    // Update existing
    $sql = "UPDATE users SET password = ? WHERE username = ?";
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute([$pass, $username])) {
        echo "<h1>Success!</h1><p>Password for 'admin' updated to 'admin123'.</p>";
    } else {
        echo "<h1>Error</h1><p>Failed to update password.</p>";
    }
} else {
    // Create if missing
    $sql = "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')";
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute([$username, $pass])) {
        echo "<h1>Success!</h1><p>User 'admin' created with password 'admin123'.</p>";
    } else {
        echo "<h1>Error</h1><p>Failed to create user.</p>";
    }
}
?>