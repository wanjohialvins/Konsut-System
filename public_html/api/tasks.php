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
            $userRole = $user['role'];

            $sql = "SELECT t.*, 
                           u_creator.username as creator_name, 
                           u_assignee.username as assignee_name 
                    FROM tasks t 
                    LEFT JOIN users u_creator ON t.created_by = u_creator.id 
                    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id";

            if (in_array($userRole, ['admin', 'manager', 'ceo'])) {
                $stmt = $pdo->query("$sql ORDER BY t.created_at DESC");
            } else {
                $stmt = $pdo->prepare("$sql WHERE t.assignee_id = ? OR t.assignee_id IS NULL OR t.created_by = ? ORDER BY t.due_date ASC");
                $stmt->execute([$userId, $userId]);
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
            $stmt = $pdo->prepare("INSERT INTO tasks (id, title, priority, status, due_date, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['title'],
                $data['priority'] ?? 'medium',
                $data['status'] ?? 'pending',
                $data['dueDate'] ?? $data['due_date'] ?? null,
                $data['assigneeId'] ?? $data['assignee_id'] ?? null,
                $userId
            ]);
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
                $stmt = $pdo->prepare("UPDATE tasks SET title=?, priority=?, status=?, due_date=?, assignee_id=? WHERE id=?");
                $stmt->execute([
                    $data['title'],
                    $data['priority'],
                    $data['status'],
                    $data['dueDate'] ?? $data['due_date'] ?? null,
                    $data['assigneeId'] ?? $data['assignee_id'] ?? null,
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
