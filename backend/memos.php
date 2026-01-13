<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_memos');
        try {
            $stmt = $pdo->query("SELECT * FROM memos ORDER BY created_at DESC");
            $memos = $stmt->fetchAll();
            // Convert urgent 0/1 to boolean
            foreach ($memos as &$memo) {
                $memo['urgent'] = (bool) $memo['urgent'];
            }
            echo json_encode($memos);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_memos'); // Memos likely managed by admin
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO memos (id, title, content, author, date, urgent) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['title'],
                $data['content'],
                $data['author'],
                $data['date'],
                $data['urgent'] ? 1 : 0
            ]);
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
