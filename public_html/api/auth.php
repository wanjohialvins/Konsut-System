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
            unset($user['password']);

            $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

            $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
            $pdo->prepare("INSERT INTO login_history (user_id, ip_address) VALUES (?, ?)")->execute([$user['id'], $ip_address]);

            sendResponse(['success' => true, 'user' => $user]);
        } else {
            sendError('Invalid credentials', 401);
        }
        exit;
    }

    if ($action === 'recovery_login') {
        $phrase = trim($data['phrase'] ?? '');
        // Hash of 'Drottning'
        $recoveryHash = '$2y$10$hiznOqJ1rlUVnxK9lA3JH.2dmSu8qWl0sp94LYSVQdVerwEVlOI0G';

        if (password_verify($phrase, $recoveryHash)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
            $stmt->execute();
            $user = $stmt->fetch();

            if ($user) {
                unset($user['password']);

                $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
                $pdo->prepare("INSERT INTO login_history (user_id, ip_address) VALUES (?, ?)")->execute([$user['id'], $ip_address]);
                $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")->execute([$user['id'], 'RECOVERY_LOGIN', "Used recovery phrase from IP $ip_address"]);

                sendResponse(['success' => true, 'user' => $user, 'forceReset' => true]);
            }
        } else {
            sendError('Invalid recovery phrase', 401);
        }
        exit;
    }

    if ($action === 'register' || $action === 'add_user') {
        // Only admin should be able to add users (check this in a real app)
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'staff';
        $permsInput = $data['permissions'] ?? [];
        if (empty($permsInput)) {
            $permsInput = getDefaultPermissions($role);
        }
        $permissions = json_encode($permsInput);

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

    if ($action === 'request_reset') {
        $identity = trim($data['identity'] ?? ''); // Username or Email

        if (empty($identity)) {
            sendError('Username or Email is required', 400);
        }

        // 1. Find User
        $stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$identity, $identity]);
        $user = $stmt->fetch();

        if ($user) {
            // 2. Create Ticket
            // We do this silently if user exists to avoid enumeration, 
            // but for this internal app we can be more explicit if needed.
            // Using logic similar to tickets.php

            $ticketId = 'TKT-' . strtoupper(substr(uniqid(), -6));
            $subject = "Password Reset Request: " . $user['username'];
            $category = "access";
            $priority = "high";
            $message = "User requested password reset via 'Forgot Password' screen.\nIdentity provided: " . $identity;

            try {
                $pdo->beginTransaction();

                $stmt = $pdo->prepare("INSERT INTO tickets (id, user_id, subject, category, priority, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'open', NOW(), NOW())");
                $stmt->execute([$ticketId, $user['id'], $subject, $category, $priority]);

                $msgStmt = $pdo->prepare("INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at) VALUES (?, ?, ?, 0, NOW())");
                $msgStmt->execute([$ticketId, $user['id'], $message]);

                $pdo->commit();

                sendResponse(['success' => true, 'message' => 'Password reset request submitted. Admins have been notified.']);

            } catch (Exception $e) {
                $pdo->rollBack();
                // Log error internally, return generic error
                error_log("Reset Request Ticket Failed: " . $e->getMessage());
                sendError('Failed to process request. Please contact support manually.', 500);
            }

        } else {
            // Delay slightly to mimic DB work
            usleep(300000);
            sendResponse(['success' => true, 'message' => 'If an account exists, a request has been submitted.']);
        }
        exit;
    }

    if ($action === 'impersonate') {
        // 1. Security Check: Only Admin/CEO
        $requesterId = getRequestHeader('X-User-Id');

        // Re-verify role from DB for max security
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$requesterId]);
        $realRole = $stmt->fetchColumn();

        if (!in_array(strtolower((string) $realRole), ['admin', 'ceo'])) {
            sendError('Unauthorized: Only Admins can impersonate users', 403);
        }

        $targetId = $data['target_user_id'] ?? null;
        if (!$targetId)
            sendError('Target User ID required', 400);

        // 2. Fetch Target
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$targetId]);
        $targetUser = $stmt->fetch();

        if (!$targetUser)
            sendError('Target user not found', 404);

        // 3. Log it
        unset($targetUser['password']);
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
        $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")
            ->execute([$requesterId, 'IMPERSONATION', "Impersonated user: {$targetUser['username']} ({$targetUser['id']})"]);

        // 4. Return "Login" Response
        sendResponse(['success' => true, 'user' => $targetUser, 'isImpersonation' => true]);
        exit;
    }

    if ($action === 'force_logout') {
        // 1. Security Check: Only Admin/CEO
        $requesterId = getRequestHeader('X-User-Id');
        requirePermission('manage_users'); // Or check role explicitly

        $targetId = $data['target_user_id'] ?? null;
        if (!$targetId)
            sendError('Target User ID required', 400);

        if ($targetId == $requesterId)
            sendError('Cannot force logout yourself', 400);

        // 2. Update User Flag
        $stmt = $pdo->prepare("UPDATE users SET force_refresh = 1 WHERE id = ?");
        $stmt->execute([$targetId]);

        // 3. Log it
        $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")
            ->execute([$requesterId, 'FORCE_LOGOUT', "Forced logout for user ID: $targetId"]);

        sendResponse(['success' => true, 'message' => 'User will be logged out on next action.']);
        exit;
    }

    if ($action === 'global_logout') {
        // 1. Security Check: Only Admin/CEO
        $requesterId = getRequestHeader('X-User-Id');
        requirePermission('system_control');

        // 2. Update ALL users except requester
        $stmt = $pdo->prepare("UPDATE users SET force_refresh = 1 WHERE id != ?");
        $stmt->execute([$requesterId]);

        // 3. Log it
        $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")
            ->execute([$requesterId, 'GLOBAL_LOGOUT', "Initiated global kill switch. All other sessions invalidated."]);

        sendResponse(['success' => true, 'message' => 'All other users have been forced to logout.']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list_users') {
    // Check admin rights here usually
    $stmt = $pdo->query("SELECT id, username, email, role, permissions, last_login, created_at FROM users");
    echo json_encode($stmt->fetchAll());
    exit;
}
