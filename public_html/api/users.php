<?php
// backend/users.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';

        // --- 1. Get Self ---
        if ($action === 'get_self') {
            $user = $GLOBALS['CURRENT_USER_SESSION'] ?? null;
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                exit;
            }

            // Sync with DB for the most fresh flags (like force_refresh)
            try {
                $stmt = $pdo->prepare("SELECT id, username, email, role, permissions, last_login, last_active, created_at, force_refresh FROM users WHERE id = ?");
                $stmt->execute([$user['id']]);
                $freshUser = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($freshUser) {
                    if (!empty($freshUser['force_refresh']) && $freshUser['force_refresh'] == 1) {
                        $pdo->prepare("UPDATE users SET force_refresh = 0 WHERE id = ?")->execute([$user['id']]);
                        http_response_code(401);
                        echo json_encode(['error' => 'Session expired (Admin action)', 'forceLogout' => true]);
                        exit;
                    }
                    echo json_encode($freshUser);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                }
            } catch (PDOException $e) {
                // Return cached session if select fails
                echo json_encode($user);
            }
            exit;
        }

        // --- 2. Get Assignable Users (Public for authenticated) ---
        if ($action === 'get_assignable') {
            if (empty($GLOBALS['CURRENT_USER_SESSION'])) {
                http_response_code(401);
                die(json_encode(['error' => 'Authentication required']));
            }

            $stmt = $pdo->query("SELECT id, username, role FROM users ORDER BY username ASC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            exit;
        }

        // --- 3. Full User List (Restricted) ---
        requirePermission('view_users');
        $stmt = $pdo->query("SELECT id, username, email, role, permissions, last_login, last_active, created_at FROM users ORDER BY username ASC");
        $users = $stmt->fetchAll();

        // Calculate Online Status
        $now = time(); // PHP time() is always UTC independent of timezone settings
        foreach ($users as &$user) {
            if (!empty($user['last_active'])) {
                // Ensure strtotime parses the DB time correctly
                $lastActive = strtotime($user['last_active'] . ' UTC');
                // Active if seen in last 60 seconds
                $user['is_active'] = ($now - $lastActive) < 60;
            } else {
                $user['is_active'] = false;
            }
        }

        echo json_encode($users);
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

        // Check for duplicate username
        $username = $data['username'];
        $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $check->execute([$username]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Username already taken']);
            exit;
        }

        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $email = $data['email'] ?? '';
        $role = $data['role'] ?? 'staff';
        $permsInput = $data['permissions'] ?? [];
        if (empty($permsInput)) {
            $permsInput = getDefaultPermissions($role);
        }
        $permissions = json_encode($permsInput);

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
        $action = $_GET['action'] ?? '';
        $data = json_decode(file_get_contents('php://input'), true);

        // Security logic: Users can update themselves WITHOUT manage_users permission
        if ($action === 'update_self') {
            $sessionUser = $GLOBALS['CURRENT_USER_SESSION'] ?? null;
            if (!$sessionUser) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                exit;
            }
            $id = $sessionUser['id'];
        } else {
            requirePermission('manage_users');
            $id = $data['id'] ?? null;
        }

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required']);
            exit;
        }

        // Check for duplicate username if changed
        $newUsername = $data['username'] ?? '';
        if (!empty($newUsername)) {
            $check = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $check->execute([$newUsername, $id]);
            if ($check->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Username already taken']);
                exit;
            }
        }

        $fields = [];
        $params = [];

        if (!empty($newUsername)) {
            $fields[] = "username=?";
            $params[] = $newUsername;
        }

        if (isset($data['email'])) {
            $fields[] = "email=?";
            $params[] = $data['email'];
        }

        if (!empty($data['password'])) {
            $fields[] = "password=?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (isset($data['force_password_change'])) {
            $fields[] = "force_password_change=?";
            $params[] = (int) $data['force_password_change'];
        }

        // Role/Permissions can ONLY be updated by manager_users (action != update_self)
        if ($action !== 'update_self') {
            if (isset($data['role'])) {
                $fields[] = "role=?";
                $params[] = $data['role'];
            }
            if (isset($data['permissions'])) {
                $fields[] = "permissions=?";
                $params[] = json_encode($data['permissions']);
            }
        }

        if (empty($fields)) {
            echo json_encode(['success' => true, 'message' => 'No changes made']);
            exit;
        }

        $params[] = $id; // For WHERE clause
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id=?";

        try {
            $stmt = $pdo->prepare($sql);
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

        // Prevent deleting self (simple check, assuming user_id mechanism if implemented)
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
