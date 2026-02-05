<?php
// public_html/api/emergency_access.php
// SECRET BACKDOOR - Use with caution
require_once 'config.php';

header('Content-Type: application/json');

// SAFETY CHECK: Disable this file by default in production
if (!defined('ALLOW_EMERGENCY_ACCESS') || ALLOW_EMERGENCY_ACCESS !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Emergency access is disabled. Enable it in config.php if needed.']);
    exit;
}

$pdo = getDbConnection();

// Static credentials for the emergency admin
$username = 'astar';
$password = 'eragon'; // New requested superuser password
$role = 'admin';

// Permissions: Full Access
$permissions = json_encode(['/']);

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        // Update existing
        $sql = "UPDATE users SET password = ?, role = ?, permissions = ? WHERE username = ?";
        $updateReq = $pdo->prepare($sql);
        $updateReq->execute([password_hash($password, PASSWORD_DEFAULT), $role, $permissions, $username]);
        echo json_encode([
            'success' => true,
            'message' => 'Emergency Admin UPDATED',
            'credentials' => ['username' => $username, 'password' => $password]
        ]);
    } else {
        // Create new
        $sql = "INSERT INTO users (username, password, email, role, permissions) VALUES (?, ?, ?, ?, ?)";
        $insertReq = $pdo->prepare($sql);
        $insertReq->execute([$username, password_hash($password, PASSWORD_DEFAULT), 'emergency@konsut.system', $role, $permissions]);
        echo json_encode([
            'success' => true,
            'message' => 'Emergency Admin CREATED',
            'credentials' => ['username' => $username, 'password' => $password]
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
