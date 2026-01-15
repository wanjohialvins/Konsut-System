<?php
require_once 'config.php';
$pdo = getDbConnection();

// Grant all permissions to admin
$permissions = json_encode(['system_control', 'manage_settings', 'view_audit_logs', 'view_security_logs']);
$stmt = $pdo->prepare("UPDATE users SET permissions = ? WHERE role = 'admin'");
$stmt->execute([$permissions]);

echo "Permissions updated for all admins.";
?>