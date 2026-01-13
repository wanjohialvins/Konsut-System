<?php
// backend/auth.php
require_once 'config.php';

$pdo = getDbConnection();
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // In a real cloud env, use JWT. For local/C-Panel simplicity, we'll return user data.
            // You can implement session_start() if needed.
            unset($user['password']);

            // Update last login
            $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

            // Log login history
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
            $pdo->prepare("INSERT INTO login_history (user_id, ip_address) VALUES (?, ?)")->execute([$user['id'], $ip_address]);

            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
        exit;
    }

    if ($action === 'recovery_login') {
        $phrase = trim($data['phrase'] ?? '');
        // Hash of 'Drottning'
        $recoveryHash = '$2y$10$hiznOqJ1rlUVnxK9lA3JH.2dmSu8qWl0sp94LYSVQdVerwEVlOI0G';

        if (password_verify($phrase, $recoveryHash)) {
            // Find admin user
            $stmt = $pdo->prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
            $stmt->execute();
            $user = $stmt->fetch();

            if ($user) {
                unset($user['password']);

                // Log recovery login
                $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
                $pdo->prepare("INSERT INTO login_history (user_id, ip_address) VALUES (?, ?)")->execute([$user['id'], $ip_address]);
                $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")->execute([$user['id'], 'RECOVERY_LOGIN', "Used recovery phrase from IP $ip_address"]);

                // Force reset flag
                echo json_encode(['success' => true, 'user' => $user, 'forceReset' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Admin account not found']);
            }
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid recovery phrase']);
        }
        exit;
    }

    if ($action === 'register' || $action === 'add_user') {
        // Only admin should be able to add users (check this in a real app)
        $username = $data['username'] ?? '';
        $password = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'staff';
        $email = $data['email'] ?? '';
        $permissions = json_encode($data['permissions'] ?? []);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, password, email, role, permissions) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$username, $password, $email, $role, $permissions]);
            echo json_encode(['success' => true, 'message' => 'User created']);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User already exists or error: ' . $e->getMessage()]);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list_users') {
    // Check admin rights here usually
    $stmt = $pdo->query("SELECT id, username, email, role, permissions, last_login, created_at FROM users");
    echo json_encode($stmt->fetchAll());
    exit;
}
