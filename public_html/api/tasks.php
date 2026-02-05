<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_tasks');
        try {
            $userId = getRequestHeader('X-User-Id');
            $userRole = getRequestHeader('X-User-Role');

            // Logic: Admins/Managers see ALL tasks. Others see only assigned to them OR created by them (if we tracked creator).
            // Current DB schema has 'assignee' column (string name) not ID. This is a flaw but we work with it.
            // Ideally assigner should be tracked too.
            // For now, checks if user is assigner or assignee?
            // Since 'assignee' is a string name, we need the username.

            if (in_array($userRole, ['admin', 'manager', 'ceo'])) {
                $stmt = $pdo->query("SELECT t.*, u.username as creator_name 
                                    FROM tasks t 
                                    LEFT JOIN users u ON t.created_by = u.id 
                                    ORDER BY t.created_at DESC");
                echo json_encode($stmt->fetchAll());
            } else {
                // Fetch username for this user
                $uStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
                $uStmt->execute([$userId]);
                $uName = $uStmt->fetchColumn();

                // Filter: Assignee matches username OR created by this user
                $stmt = $pdo->prepare("SELECT t.*, u.username as creator_name 
                                      FROM tasks t 
                                      LEFT JOIN users u ON t.created_by = u.id 
                                      WHERE t.assignee = ? OR t.assignee = '' OR t.created_by = ? 
                                      ORDER BY t.due_date ASC");
                $stmt->execute([$uName, $userId]);
                echo json_encode($stmt->fetchAll());
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_tasks');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $userId = getRequestHeader('X-User-Id');
            $stmt = $pdo->prepare("INSERT INTO tasks (id, title, priority, status, due_date, assignee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['title'],
                $data['priority'] ?? 'medium',
                $data['status'] ?? 'pending',
                $data['due_date'],
                $data['assignee'] ?? '',
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
            // Check if it's a status update or full update
            if (isset($data['status']) && count($data) == 2) {
                $stmt = $pdo->prepare("UPDATE tasks SET status=? WHERE id=?");
                $stmt->execute([$data['status'], $data['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE tasks SET title=?, priority=?, status=?, due_date=?, assignee=? WHERE id=?");
                $stmt->execute([
                    $data['title'],
                    $data['priority'],
                    $data['status'],
                    $data['due_date'],
                    $data['assignee'],
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
