<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_documents');
        try {
            $stmt = $pdo->query("SELECT * FROM vault_documents ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_documents');

        // Handle file upload vs metadata only
        // For this iteration, we accept metadata JSON. 
        // Real file upload would require multipart/form-data handling.

        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO vault_documents (id, name, type, size, upload_date, path) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['type'],
                $data['size'],
                $data['upload_date'],
                $data['path'] ?? ''
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        requirePermission('manage_documents');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM vault_documents WHERE id = ?");
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
