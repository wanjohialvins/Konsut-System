<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        $user = $GLOBALS['CURRENT_USER_SESSION'];
        $userId = $user['id'];
        $userRole = strtolower($user['role']);

        if (isset($_GET['action']) && $_GET['action'] === 'count') {
            try {
                // Count unread notifications targeting this user/role or global
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) 
                    FROM notifications n
                    WHERE (n.assignee_id = ? OR n.assignee_role = ? OR (n.assignee_id IS NULL AND n.assignee_role IS NULL))
                    AND n.id NOT IN (SELECT notification_id FROM notification_reads WHERE user_id = ?)
                ");
                $stmt->execute([$userId, $userRole, $userId]);
                echo json_encode(['unreadCount' => (int) $stmt->fetchColumn()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
        }

        try {
            // Fetch notifications with per-user read status
            $stmt = $pdo->prepare("
                SELECT n.*, 
                       CASE WHEN nr.notification_id IS NOT NULL THEN 1 ELSE 0 END as read_status
                FROM notifications n
                LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
                WHERE (n.assignee_id = ? OR n.assignee_role = ? OR (n.assignee_id IS NULL AND n.assignee_role IS NULL))
                ORDER BY n.created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$userId, $userId, $userRole]);
            $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($notifs as &$n) {
                $n['read'] = (bool) $n['read_status'];
                unset($n['read_status']);
            }
            echo json_encode($notifs);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('admin');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, assignee_id, assignee_role) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['title'],
                $data['message'],
                $data['type'] ?? 'info',
                $data['assigneeId'] ?? $data['assignee_id'] ?? null,
                $data['assigneeRole'] ?? $data['assignee_role'] ?? null
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Mark as read per user
        $user = $GLOBALS['CURRENT_USER_SESSION'];
        $userId = $user['id'];
        $id = $_GET['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO notification_reads (user_id, notification_id) VALUES (?, ?)");
            $stmt->execute([$userId, $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        requirePermission('admin');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
