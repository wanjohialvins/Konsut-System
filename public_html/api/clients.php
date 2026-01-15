<?php
// backend/clients.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        requirePermission('view_clients');
        $stmt = $pdo->query("SELECT * FROM clients WHERE deleted_at IS NULL ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        requirePermission('manage_clients');
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO clients (id, name, email, phone, address, kraPin) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['name'],
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['address'] ?? '',
            $data['kraPin'] ?? ''
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'PUT':
        requirePermission('manage_clients');
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE clients SET name=?, email=?, phone=?, address=?, kraPin=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['address'] ?? '',
            $data['kraPin'] ?? '',
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        requirePermission('manage_clients');
        $id = $_GET['id'] ?? '';
        // Soft Delete
        $stmt = $pdo->prepare("UPDATE clients SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
}
?>