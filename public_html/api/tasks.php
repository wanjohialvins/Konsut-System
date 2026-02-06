<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_tasks');
        try {
            $user = $GLOBALS['CURRENT_USER_SESSION'];
            $userId = $user['id'];
            $userRole = strtolower($user['role']);

            $sql = "SELECT t.*, 
                           u_creator.username as creator_name, 
                           u_assignee.username as assignee_name 
                    FROM tasks t 
                    LEFT JOIN users u_creator ON t.created_by = u_creator.id 
                    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id";

            if (in_array($userRole, ['admin', 'manager', 'ceo'])) {
                $stmt = $pdo->query("$sql ORDER BY t.created_at DESC");
            } else {
                $stmt = $pdo->prepare("$sql WHERE t.assignee_id = ? OR t.assignee_role = ? OR t.assignee_id IS NULL OR t.created_by = ? ORDER BY t.due_date ASC");
                $stmt->execute([$userId, $userRole, $userId]);
            }
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_tasks');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $userId = $GLOBALS['CURRENT_USER_SESSION']['id'];
            $assigneeId = $data['assigneeId'] ?? $data['assignee_id'] ?? null;
            $assigneeRole = $data['assigneeRole'] ?? $data['assignee_role'] ?? null;
            $taskId = $data['id'] ?? ('TASK-' . time());

            $stmt = $pdo->prepare("INSERT INTO tasks (id, title, priority, status, due_date, assignee_id, assignee_role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $taskId,
                $data['title'],
                $data['priority'] ?? 'medium',
                $data['status'] ?? 'pending',
                $data['dueDate'] ?? $data['due_date'] ?? null,
                $assigneeId,
                $assigneeRole,
                $userId
            ]);

            // Auto-generate notification
            $notifTitle = "New Task: " . $data['title'];
            $notifMsg = "A new task has been assigned to " . ($assigneeRole ? "role: $assigneeRole" : "you") . ".";
            $notifId = 'NOTIF-' . time();

            $notifStmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, assignee_id, assignee_role) VALUES (?, ?, ?, 'info', ?, ?)");
            $notifStmt->execute([$notifId, $notifTitle, $notifMsg, $assigneeId, $assigneeRole]);

            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        requirePermission('manage_tasks');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            if (isset($data['status']) && count($data) == 2) {
                $stmt = $pdo->prepare("UPDATE tasks SET status=? WHERE id=?");
                $stmt->execute([$data['status'], $data['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE tasks SET title=?, priority=?, status=?, due_date=?, assignee_id=?, assignee_role=? WHERE id=?");
                $stmt->execute([
                    $data['title'],
                    $data['priority'],
                    $data['status'],
                    $data['dueDate'] ?? $data['due_date'] ?? null,
                    $data['assigneeId'] ?? $data['assignee_id'] ?? null,
                    $data['assigneeRole'] ?? $data['assignee_role'] ?? null,
                    $data['id']
                ]);
            }
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        requirePermission('manage_tasks');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
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
