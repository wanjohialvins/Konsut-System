<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();

// Only logged in users can access tickets
$user_id = getRequestHeader('X-User-Id');
$user_role = strtolower(getRequestHeader('X-User-Role') ?? '');

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single ticket and its messages
                $stmt = $db->prepare("SELECT t.*, u.username as creator_name FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = ?");
                $stmt->execute([$_GET['id']]);
                $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$ticket) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Ticket not found']);
                    exit;
                }

                // Security: Only owner or admin can view ticket
                if ($user_role !== 'admin' && $user_role !== 'ceo' && $ticket['user_id'] != $user_id) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Forbidden']);
                    exit;
                }

                $msgStmt = $db->prepare("SELECT m.*, u.username as author_name, u.role as author_role FROM ticket_messages m JOIN users u ON m.user_id = u.id WHERE m.ticket_id = ? ORDER BY m.created_at ASC");
                $msgStmt->execute([$_GET['id']]);
                $ticket['messages'] = $msgStmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode($ticket);
            } else {
                // List tickets
                if ($user_role === 'admin' || $user_role === 'ceo') {
                    $stmt = $db->prepare("SELECT t.*, u.username as creator_name FROM tickets t JOIN users u ON t.user_id = u.id ORDER BY t.updated_at DESC");
                    $stmt->execute();
                } else {
                    $stmt = $db->prepare("SELECT t.*, u.username as creator_name FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.user_id = ? ORDER BY t.updated_at DESC");
                    $stmt->execute([$user_id]);
                }
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (isset($data['action']) && $data['action'] === 'add_message') {
                // Adding a reply to a ticket
                $ticket_id = $data['ticket_id'];
                $message = $data['message'];
                $is_internal = $data['is_internal'] ?? 0;

                $stmt = $db->prepare("INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)");
                $stmt->execute([$ticket_id, $user_id, $message, $is_internal]);

                // Update ticket updated_at
                $updateStmt = $db->prepare("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $updateStmt->execute([$ticket_id]);

                echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
            } else {
                // Creating a new ticket
                $id = 'TKT-' . strtoupper(substr(uniqid(), -6));
                $subject = $data['subject'];
                $category = $data['category'] ?? 'general';
                $priority = $data['priority'] ?? 'medium';
                $message = $data['message'];

                $db->beginTransaction();
                try {
                    $stmt = $db->prepare("INSERT INTO tickets (id, user_id, subject, category, priority, status) VALUES (?, ?, ?, ?, ?, 'open')");
                    $stmt->execute([$id, $user_id, $subject, $category, $priority]);

                    $msgStmt = $db->prepare("INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES (?, ?, ?)");
                    $msgStmt->execute([$id, $user_id, $message]);

                    $db->commit();
                    echo json_encode(['success' => true, 'id' => $id]);
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            }
            break;

        case 'PUT':
            // Update ticket status (Admin only for status changes maybe?)
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $_GET['id'] ?? $data['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing ticket ID']);
                exit;
            }

            $fields = [];
            $params = [];
            if (isset($data['status'])) {
                $fields[] = "status = ?";
                $params[] = $data['status'];
            }
            if (isset($data['priority'])) {
                $fields[] = "priority = ?";
                $params[] = $data['priority'];
            }

            if (empty($fields)) {
                echo json_encode(['success' => true, 'message' => 'No changes made']);
                exit;
            }

            $params[] = $id;
            $stmt = $db->prepare("UPDATE tickets SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);

            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if ($user_role !== 'admin' && $user_role !== 'ceo') {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden']);
                exit;
            }
            $id = $_GET['id'];
            $stmt = $db->prepare("DELETE FROM tickets WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>