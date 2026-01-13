<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        // Notifications are per-user usually, but simplistic system here (system-wide alerts or broadcast)
        // Or we assume this is "Admin Notifications" as per `Notifications.tsx` using `api.admin.getNotifications`.
        requirePermission('view_dashboard');
        try {
            $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC");
            $notifs = $stmt->fetchAll();
            foreach ($notifs as &$n) {
                $n['read'] = (bool) $n['read_status']; // Map db 'read_status' to frontend 'read'
                unset($n['read_status']);
            }
            echo json_encode($notifs);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Internal use mostly, or via 'Broadcast' action
        requirePermission('admin');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            // Create notification
            $stmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, read_status) VALUES (?, ?, ?, ?, 0)");
            $stmt->execute([
                $data['id'],
                $data['title'],
                $data['message'],
                $data['type'] ?? 'info'
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Mark as read
        requirePermission('view_dashboard');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            // Maybe bulk update?
            $data = json_decode(file_get_contents('php://input'), true);
            // handle logic later
            exit;
        }

        // Mark specific as read
        try {
            $stmt = $pdo->prepare("UPDATE notifications SET read_status = 1 WHERE id = ?");
            $stmt->execute([$id]);
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
