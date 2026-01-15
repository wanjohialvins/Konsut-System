<?php
// backend/users.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        requirePermission('view_users');
        $stmt = $pdo->query("SELECT id, username, email, role, permissions, last_login, created_at FROM users ORDER BY username ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        requirePermission('manage_users');
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['username']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password are required']);
            exit;
        }

        $username = $data['username'];
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $email = $data['email'] ?? '';
        $role = $data['role'] ?? 'staff';
        $permissions = json_encode($data['permissions'] ?? []);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, password, email, role, permissions) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$username, $password, $email, $role, $permissions]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'User creation failed: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        requirePermission('manage_users');
        $data = json_decode(file_get_contents('php://input'), true);

        // We don't update password here for security simplicity, usually separate endpoint
        // But if provided, we can update it
        
        $fields = "email=?, role=?, permissions=?";
        $params = [
            $data['email'] ?? '',
            $data['role'] ?? 'staff',
            json_encode($data['permissions'] ?? [])
        ];

        if (!empty($data['password'])) {
            $fields .= ", password=?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $params[] = $data['id']; // For WHERE clause

        try {
            $stmt = $pdo->prepare("UPDATE users SET $fields WHERE id=?");
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        requirePermission('manage_users');
        $id = $_GET['id'] ?? '';
        
        // Prevent deleting self (simple check, assuming header user_id passed or check session if used)
        // For now, raw delete
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Delete failed']);
        }
        break;
}
?>
