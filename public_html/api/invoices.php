<?php
// backend/invoices.php
require_once 'config.php';
require_once 'auth.php';
require_once 'utils/client_utils.php';

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
            sendResponse($invoice);
        } else {
            sendError('Invoice not found', 404);
        }
    } else {
        // List invoices with basic info
        $type = $_GET['type'] ?? null;
        $clientId = $_GET['clientId'] ?? null;
        $query = "SELECT d.*, c.name as customerName FROM documents d LEFT JOIN clients c ON d.customer_id = c.id WHERE d.deleted_at IS NULL";
        $params = [];

        if ($type) {
            $query .= " AND d.type = :type";
            $params['type'] = $type;
        }
        if ($clientId) {
            $query .= " AND d.customer_id = :clientId";
            $params['clientId'] = $clientId;
        }

        $stmt = $pdo->prepare($query . " ORDER BY d.created_at DESC");
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    requirePermission('manage_invoices');
    $data = json_decode(file_get_contents('php://input'), true);
    // file_put_contents('debug_invoice.txt', "POST Data: " . print_r($data, true) . "\n", FILE_APPEND);

    $pdo->beginTransaction();
    try {
        $clientStatus = ensureClientExists($pdo, $data['customer'] ?? []);
        $customerId = $clientStatus['id'];
        $clientUpdated = $clientStatus['updated'];

        $userId = getRequestHeader('X-User-Id');
        // file_put_contents('debug_invoice.txt', "Resolved Customer ID: " . var_export($customerId, true) . " | User ID: " . var_export($userId, true) . "\n", FILE_APPEND);

        $stmt = $pdo->prepare("INSERT INTO documents (id, customer_id, type, status, issuedDate, dueDate, quotationValidUntil, currency, currencyRate, subtotal, taxAmount, grandTotal, clientResponsibilities, termsAndConditions, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $customerId,
            $data['type'],
            $data['status'] ?? 'draft',
            $data['issuedDate'],
            (!empty($data['dueDate'])) ? $data['dueDate'] : null,
            (!empty($data['quotationValidUntil'])) ? $data['quotationValidUntil'] : null,
            $data['currency'] ?? 'Ksh',
            $data['currencyRate'] ?? 1.0,
            $data['subtotal'],
            $data['taxAmount'] ?? 0,
            $data['grandTotal'],
            $data['clientResponsibilities'] ?? '',
            $data['termsAndConditions'] ?? '',
            $userId
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
        echo json_encode(['success' => true, 'client_updated' => $clientUpdated, 'id' => $data['id']]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    requirePermission('manage_invoices');
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = getRequestHeader('X-User-Id');
    $pdo->beginTransaction();
    try {
        $clientStatus = ensureClientExists($pdo, $data['customer'] ?? []);
        $customerId = $clientStatus['id'];
        $clientUpdated = $clientStatus['updated'];

        // Check if document exists
        $check = $pdo->prepare("SELECT COUNT(*) FROM documents WHERE id = ?");
        $check->execute([$data['id']]);
        $exists = $check->fetchColumn() > 0;

        if ($exists) {
            // Retrieve existing created_by to preserve it? 
            // Actually, created_by is not updated here, so it's preserved.

            $stmt = $pdo->prepare("UPDATE documents SET customer_id=?, status=?, issuedDate=?, dueDate=?, quotationValidUntil=?, currency=?, currencyRate=?, subtotal=?, taxAmount=?, grandTotal=?, clientResponsibilities=?, termsAndConditions=? WHERE id=?");
            $stmt->execute([
                $customerId,
                $data['status'],
                $data['issuedDate'],
                (!empty($data['dueDate'])) ? $data['dueDate'] : null,
                (!empty($data['quotationValidUntil'])) ? $data['quotationValidUntil'] : null,
                $data['currency'] ?? 'Ksh',
                $data['currencyRate'] ?? 1.0,
                $subtotal = $data['subtotal'],
                $data['taxAmount'] ?? 0,
                $data['grandTotal'],
                $data['clientResponsibilities'] ?? '',
                $data['termsAndConditions'] ?? '',
                $data['id']
            ]);
        } else {
            // Restore/Insert logic (Upsert)
            $stmt = $pdo->prepare("INSERT INTO documents (id, customer_id, type, status, issuedDate, dueDate, quotationValidUntil, currency, currencyRate, subtotal, taxAmount, grandTotal, clientResponsibilities, termsAndConditions, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $customerId,
                $data['type'], // Ensure 'type' is sent in PUT payload or fallback? NewInvoice seems to send full object for editing.
                $data['status'] ?? 'draft',
                $data['issuedDate'],
                (!empty($data['dueDate'])) ? $data['dueDate'] : null,
                (!empty($data['quotationValidUntil'])) ? $data['quotationValidUntil'] : null,
                $data['currency'] ?? 'Ksh',
                $data['currencyRate'] ?? 1.0,
                $data['subtotal'],
                $data['taxAmount'] ?? 0,
                $data['grandTotal'],
                $data['clientResponsibilities'] ?? '',
                $data['termsAndConditions'] ?? '',
                $userId
            ]);
        }

        // Clear old items (if any, though 'exists' check implies none if insert, but safer to just delete in case of partial orphans)
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
        echo json_encode(['success' => true, 'client_updated' => $clientUpdated]);
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
    sendResponse(['success' => true]);
}
