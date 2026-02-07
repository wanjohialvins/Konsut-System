<?php
// backend/clients.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to normalize and trim
function normalizeInput($data)
{
    return [
        'id' => isset($data['id']) ? trim($data['id']) : null,
        'name' => isset($data['name']) ? trim($data['name']) : '',
        'company' => isset($data['company']) ? trim($data['company']) : '',
        'email' => isset($data['email']) ? trim($data['email']) : '',
        'phone' => isset($data['phone']) ? trim($data['phone']) : '',
        'address' => isset($data['address']) ? trim($data['address']) : '',
        'kraPin' => isset($data['kraPin']) ? strtoupper(trim($data['kraPin'])) : ''
    ];
}

switch ($method) {
    case 'GET':
        requirePermission('view_clients');

        // Uniqueness Check requested?
        if (isset($_GET['check_field']) && isset($_GET['check_value'])) {
            $field = $_GET['check_field'];
            $value = trim($_GET['check_value']);
            $excludeId = $_GET['exclude_id'] ?? null;

            if (!in_array($field, ['email', 'phone', 'kraPin'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid check field']);
                exit;
            }

            $query = "SELECT id, name FROM clients WHERE $field = ? AND deleted_at IS NULL";
            $params = [$value];

            if ($excludeId) {
                $query .= " AND id != ?";
                $params[] = $excludeId;
            }

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);

            sendResponse(['exists' => !!$match, 'match' => $match]);
            exit;
        }

        // Initialize empty in case of failure
        $clients = [];
        try {
            $query = "
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND d.deleted_at IS NULL) as totalInvoices,
                    (SELECT COALESCE(SUM(d.grandTotal), 0) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) != 'cancelled' AND d.deleted_at IS NULL) as totalRevenue,
                    (SELECT MAX(d.issuedDate) FROM documents d WHERE d.customer_id = c.id AND d.deleted_at IS NULL) as lastActive,
                    (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) IN ('pending', 'sent', 'draft') AND d.deleted_at IS NULL) as pendingCount,
                    (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) = 'overdue' AND d.deleted_at IS NULL) as overdueCount
                FROM clients c
                WHERE (c.deleted_at IS NULL OR c.deleted_at = '0000-00-00 00:00:00')
                ORDER BY c.name ASC
            ";
            $stmt = $pdo->query($query);
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }

        // Cast numeric strings to appropriate types
        foreach ($clients as &$client) {
            $client['totalInvoices'] = (int) $client['totalInvoices'];
            $client['totalRevenue'] = (float) $client['totalRevenue'];
            $client['pendingCount'] = (int) $client['pendingCount'];
            $client['overdueCount'] = (int) $client['overdueCount'];
        }

        sendResponse($clients);
        break;

    case 'POST':
        requirePermission('manage_clients');
        $raw = json_decode(file_get_contents('php://input'), true);

        // Bulk Sync Action
        if (isset($_GET['action']) && $_GET['action'] === 'bulk_sync') {
            $count = 0;
            $updated = 0;
            $pdo->beginTransaction();
            try {
                $checkStmt = $pdo->prepare("SELECT id FROM clients WHERE (email = ? AND email != '') OR (name = ? AND phone = ?)");
                $updateStmt = $pdo->prepare("UPDATE clients SET name=?, company=?, phone=?, address=?, kraPin=?, updated_at=NOW() WHERE id=?");
                $insertStmt = $pdo->prepare("INSERT INTO clients (id, name, company, email, phone, address, kraPin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");

                foreach ($raw as $client) {
                    $data = normalizeInput($client);

                    // Simple validation
                    if (empty($data['name']))
                        continue;

                    // Check existence (by Email OR Name+Phone composite)
                    $checkStmt->execute([$data['email'], $data['name'], $data['phone']]);
                    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                    if ($existing) {
                        // Update existing (optional: only if provided data is substantial?)
                        // For now, we update to ensure latest info from invoice is captured
                        $updateStmt->execute([
                            $data['name'],
                            $data['company'],
                            $data['phone'],
                            $data['address'],
                            $data['kraPin'],
                            $existing['id']
                        ]);
                        $updated++;
                    } else {
                        // Insert new
                        $id = $data['id'] ?: 'CLI-' . uniqid();
                        $insertStmt->execute([
                            $id,
                            $data['name'],
                            $data['company'],
                            $data['email'],
                            $data['phone'],
                            $data['address'],
                            $data['kraPin']
                        ]);
                        $count++;
                    }
                }
                $pdo->commit();
                sendResponse(['success' => true, 'imported' => $count, 'updated' => $updated]);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                sendResponse(['success' => false, 'error' => $e->getMessage()]);
            }
            break;
        }

        $data = normalizeInput($raw);

        // Critical Validation
        if (empty($data['name'])) {
            http_response_code(400);
            sendResponse(['success' => false, 'message' => 'Name is required']);
            exit;
        }

        // Check duplicates (Server-side Enforcement)
        if (!empty($data['email'])) {
            $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = ? AND deleted_at IS NULL");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                http_response_code(409); // Conflict
                sendResponse(['success' => false, 'message' => 'Email already exists']);
                exit;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO clients (id, name, company, email, phone, address, kraPin) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['name'],
            $data['company'],
            $data['email'],
            $data['phone'],
            $data['address'],
            $data['kraPin']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'PUT':
        requirePermission('manage_clients');
        $raw = json_decode(file_get_contents('php://input'), true);
        $data = normalizeInput($raw);

        // Check duplicates (Server-side Enforcement)
        if (!empty($data['email'])) {
            $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = ? AND id != ? AND deleted_at IS NULL");
            $stmt->execute([$data['email'], $data['id']]);
            if ($stmt->fetch()) {
                http_response_code(409);
                sendResponse(['success' => false, 'message' => 'Email already exists']);
                exit;
            }
        }

        $stmt = $pdo->prepare("UPDATE clients SET name=?, company=?, email=?, phone=?, address=?, kraPin=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['company'],
            $data['email'],
            $data['phone'],
            $data['address'],
            $data['kraPin'],
            $data['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'DELETE':
        requirePermission('manage_clients');
        $id = $_GET['id'] ?? '';
        // Soft Delete
        $stmt = $pdo->prepare("UPDATE clients SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['success' => true]);
        break;
}
