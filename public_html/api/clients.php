<?php
// backend/clients.php
require_once 'config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        requirePermission('view_clients');
        // Initialize empty in case of failure
        $clients = [];
        try {
            $query = "
                SELECT 
                    c.*,
                    COUNT(CASE WHEN LOWER(d.type) = 'invoice' THEN 1 END) as totalInvoices,
                    SUM(CASE WHEN LOWER(d.type) = 'invoice' AND LOWER(d.status) != 'cancelled' THEN d.grandTotal ELSE 0 END) as totalRevenue,
                    MAX(d.issuedDate) as lastActive,
                    SUM(CASE WHEN LOWER(d.type) = 'invoice' AND LOWER(d.status) IN ('pending', 'sent', 'draft') THEN 1 ELSE 0 END) as pendingCount,
                    SUM(CASE WHEN LOWER(d.type) = 'invoice' AND LOWER(d.status) = 'overdue' THEN 1 ELSE 0 END) as overdueCount
                FROM clients c
                LEFT JOIN documents d ON c.id = d.customer_id AND d.deleted_at IS NULL
                WHERE c.deleted_at IS NULL
                GROUP BY c.id
                ORDER BY c.name ASC
            ";
            $stmt = $pdo->query($query);
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Log error silently or handle
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
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO clients (id, name, company, email, phone, address, kraPin) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['name'],
            $data['company'] ?? '',
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['address'] ?? '',
            $data['kraPin'] ?? ''
        ]);
        sendResponse(['success' => true]);
        break;

    case 'PUT':
        requirePermission('manage_clients');
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE clients SET name=?, company=?, email=?, phone=?, address=?, kraPin=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['company'] ?? '',
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['address'] ?? '',
            $data['kraPin'] ?? '',
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
