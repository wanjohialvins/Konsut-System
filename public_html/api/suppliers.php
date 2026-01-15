<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_suppliers'); // Assuming generic permission, or 'view_stock'
        try {
            $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_suppliers');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, category, contact_person, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['category'],
                $data['contact_person'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $data['status'] ?? 'Active'
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        requirePermission('manage_suppliers');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("UPDATE suppliers SET name=?, category=?, contact_person=?, phone=?, email=?, status=? WHERE id=?");
            $stmt->execute([
                $data['name'],
                $data['category'],
                $data['contact_person'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $data['status'] ?? 'Active',
                $data['id']
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        requirePermission('manage_suppliers');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = ?");
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
