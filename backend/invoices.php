<?php
// backend/invoices.php
require_once 'config.php';
require_once 'auth.php'; // Assuming auth.php contains requirePermission

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requirePermission('view_invoices');
    if (isset($_GET['id'])) {
        // Get single invoice with items
        $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$_GET['id']]);
        $invoice = $stmt->fetch();

        if ($invoice) {
            $stmt = $pdo->prepare("SELECT * FROM document_items WHERE document_id = ?");
            $stmt->execute([$_GET['id']]);
            $items = $stmt->fetchAll();

            // Fetch customer details if id exists
            if ($invoice['customer_id']) {
                $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
                $stmt->execute([$invoice['customer_id']]);
                $invoice['customer'] = $stmt->fetch();
            } else {
                $invoice['customer'] = ['name' => 'Unknown'];
            }

            $invoice['items'] = $items;
            echo json_encode($invoice);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
        }
    } else {
        // List invoices with basic info
        $type = $_GET['type'] ?? null;
        $query = "SELECT d.*, c.name as customerName FROM documents d LEFT JOIN clients c ON d.customer_id = c.id WHERE d.deleted_at IS NULL";
        if ($type) {
            $query .= " AND d.type = :type";
            $stmt = $pdo->prepare($query . " ORDER BY d.created_at DESC");
            $stmt->execute(['type' => $type]);
        } else {
            $stmt = $pdo->query($query . " ORDER BY d.created_at DESC");
        }
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    requirePermission('manage_invoices');
    $data = json_decode(file_get_contents('php://input'), true);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO documents (id, customer_id, type, status, issuedDate, dueDate, quotationValidUntil, currency, currencyRate, subtotal, taxAmount, grandTotal, clientResponsibilities, termsAndConditions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['customer']['id'] ?? null,
            $data['type'],
            $data['status'] ?? 'draft',
            $data['issuedDate'],
            $data['dueDate'] ?? null,
            $data['quotationValidUntil'] ?? null,
            $data['currency'] ?? 'Ksh',
            $data['currencyRate'] ?? 1.0,
            $data['subtotal'],
            $data['taxAmount'] ?? 0,
            $data['grandTotal'],
            $data['clientResponsibilities'] ?? '',
            $data['termsAndConditions'] ?? ''
        ]);

        $itemStmt = $pdo->prepare("INSERT INTO document_items (document_id, product_id, name, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['items'] as $item) {
            $itemStmt->execute([
                $data['id'],
                $item['id'] ?? null,
                $item['name'],
                $item['description'] ?? '',
                $item['quantity'],
                $item['unitPrice'],
                $item['unitPrice'] * $item['quantity']
            ]);
        }
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    requirePermission('manage_invoices');
    $data = json_decode(file_get_contents('php://input'), true);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("UPDATE documents SET customer_id=?, status=?, issuedDate=?, dueDate=?, quotationValidUntil=?, currency=?, currencyRate=?, subtotal=?, taxAmount=?, grandTotal=?, clientResponsibilities=?, termsAndConditions=? WHERE id=?");
        $stmt->execute([
            $data['customer']['id'] ?? null,
            $data['status'],
            $data['issuedDate'],
            $data['dueDate'] ?? null,
            $data['quotationValidUntil'] ?? null,
            $data['currency'] ?? 'Ksh',
            $data['currencyRate'] ?? 1.0,
            $data['subtotal'],
            $data['taxAmount'] ?? 0,
            $data['grandTotal'],
            $data['clientResponsibilities'] ?? '',
            $data['termsAndConditions'] ?? '',
            $data['id']
        ]);

        // Clear old items
        $pdo->prepare("DELETE FROM document_items WHERE document_id = ?")->execute([$data['id']]);

        // Insert new items
        $itemStmt = $pdo->prepare("INSERT INTO document_items (document_id, product_id, name, description, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($data['items'] as $item) {
            $itemStmt->execute([
                $data['id'],
                $item['id'] ?? null,
                $item['name'],
                $item['description'] ?? '',
                $item['quantity'],
                $item['unitPrice'],
                $item['unitPrice'] * $item['quantity']
            ]);
        }
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    requirePermission('delete_invoice');
    $id = $_GET['id'] ?? '';
    // Soft Delete
    $stmt = $pdo->prepare("UPDATE documents SET deleted_at = NOW() WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>