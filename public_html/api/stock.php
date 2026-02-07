<?php
// backend/stock.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

function normalizeStock($data)
{
    return [
        'id' => isset($data['id']) ? trim($data['id']) : null,
        'name' => isset($data['name']) ? trim($data['name']) : '',
        'description' => isset($data['description']) ? trim($data['description']) : '',
        'category' => isset($data['category']) ? trim($data['category']) : 'products',
        'unitPrice' => isset($data['unitPrice']) ? floatval($data['unitPrice']) : 0,
        'unitPriceUsd' => isset($data['unitPriceUsd']) ? floatval($data['unitPriceUsd']) : 0,
        'quantity' => isset($data['quantity']) ? intval($data['quantity']) : 0
    ];
}

switch ($method) {
    case 'GET':
        requirePermission('view_stock');
        $stmt = $pdo->query("SELECT * FROM stock WHERE deleted_at IS NULL ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        requirePermission('manage_stock');
        $raw = json_decode(file_get_contents('php://input'), true);
        $data = normalizeStock($raw);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name is required']);
            exit;
        }

        // Negative Value Prevention (Phase 5 requirement check early)
        if ($data['unitPrice'] < 0 || $data['quantity'] < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Negative values not allowed']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO stock (id, name, description, category, unitPrice, unitPriceUsd, quantity) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)
                                   ON DUPLICATE KEY UPDATE 
                                   name=VALUES(name), description=VALUES(description), category=VALUES(category), 
                                   unitPrice=VALUES(unitPrice), unitPriceUsd=VALUES(unitPriceUsd), quantity=VALUES(quantity)");
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['description'],
                $data['category'],
                $data['unitPrice'],
                $data['unitPriceUsd'],
                $data['quantity']
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        requirePermission('manage_stock');
        $raw = json_decode(file_get_contents('php://input'), true);
        $data = normalizeStock($raw);

        if ($data['unitPrice'] < 0 || $data['quantity'] < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Negative values not allowed']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE stock SET name=?, description=?, category=?, unitPrice=?, unitPriceUsd=?, quantity=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['description'],
            $data['category'],
            $data['unitPrice'],
            $data['unitPriceUsd'],
            $data['quantity'],
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
                // Bulk HARD Delete (Clear Database) - Restricted?
                // For now, allow it but maybe audit it?
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
