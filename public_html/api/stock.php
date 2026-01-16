<?php
// backend/stock.php
require_once 'config.php';

$pdo = getDbConnection();
file_put_contents('debug_stock.txt', date('Y-m-d H:i:s') . " | ACCESSED\n", FILE_APPEND);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        requirePermission('view_stock');
        $stmt = $pdo->query("SELECT * FROM stock WHERE deleted_at IS NULL ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        requirePermission('manage_stock');
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO stock (id, name, description, category, unitPrice, unitPriceUsd, quantity) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)
                                   ON DUPLICATE KEY UPDATE 
                                   name=VALUES(name), description=VALUES(description), category=VALUES(category), 
                                   unitPrice=VALUES(unitPrice), unitPriceUsd=VALUES(unitPriceUsd), quantity=VALUES(quantity)");
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['description'] ?? '',
                $data['category'] ?? '',
                $data['unitPrice'],
                $data['unitPriceUsd'] ?? null,
                $data['quantity'] ?? 0
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        requirePermission('manage_stock');
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE stock SET name=?, description=?, category=?, unitPrice=?, unitPriceUsd=?, quantity=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['category'] ?? '',
            $data['unitPrice'],
            $data['unitPriceUsd'] ?? null,
            $data['quantity'] ?? 0,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        requirePermission('manage_stock');
        $id = $_GET['id'] ?? '';
        $all = isset($_GET['all']) && $_GET['all'] === 'true';

        try {
            if ($all) {
                // Bulk HARD Delete (Clear Database)
                $stmt = $pdo->prepare("DELETE FROM stock");
                $stmt->execute();
            } else {
                // Single Soft Delete (Keep history safely)
                $stmt = $pdo->prepare("UPDATE stock SET deleted_at = NOW() WHERE id = ?");
                $stmt->execute([$id]);
            }
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
        }
        break;
}
