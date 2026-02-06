<?php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control');

header('Content-Type: application/json');

$type = $_GET['type'] ?? 'all';
$mode = $_GET['mode'] ?? 'commit'; // 'commit' or 'dry_run'

$results = [
    'stock' => 0,
    'clients' => 0,
    'invoices' => 0,
    'mode' => $mode
];

try {
    $pdo->beginTransaction();

    // --- 1. Stock Cleanup ---
    if ($type === 'all' || $type === 'stock') {
        $stmt = $pdo->query("SELECT * FROM stock ORDER BY name ASC, id ASC");
        $stockItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stockMap = [];
        foreach ($stockItems as $item) {
            $key = strtolower(trim($item['name']));
            if (!isset($stockMap[$key])) {
                $stockMap[$key] = [];
            }
            $stockMap[$key][] = $item;
        }

        foreach ($stockMap as $key => $items) {
            if (count($items) > 1) {
                $primary = $items[0];
                $totalQty = 0;
                $idsToDelete = [];

                foreach ($items as $index => $item) {
                    $totalQty += floatval($item['quantity'] ?? 0);
                    if ($index > 0) {
                        $idsToDelete[] = $item['id'];
                    }
                }

                if (!empty($idsToDelete)) {
                    $results['stock'] += count($idsToDelete);
                    if ($mode === 'commit') {
                        // Update primary
                        $upd = $pdo->prepare("UPDATE stock SET quantity = ? WHERE id = ?");
                        $upd->execute([$totalQty, $primary['id']]);

                        // Re-link existing document items to the primary product
                        $relink = $pdo->prepare("UPDATE document_items SET product_id = ? WHERE product_id IN ($placeholders)");
                        $relink->execute(array_merge([$primary['id']], $idsToDelete));

                        // Delete duplicates
                        $del = $pdo->prepare("DELETE FROM stock WHERE id IN ($placeholders)");
                        $del->execute($idsToDelete);
                    }
                }
            }
        }
    }

    // --- 2. Clients Cleanup ---
    if ($type === 'all' || $type === 'clients') {
        $stmt = $pdo->query("SELECT * FROM clients ORDER BY name ASC, id ASC");
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $clientMap = [];
        foreach ($clients as $client) {
            $key = strtolower(trim($client['name']));
            if (!isset($clientMap[$key])) {
                $clientMap[$key] = [];
            }
            $clientMap[$key][] = $client;
        }

        foreach ($clientMap as $key => $items) {
            if (count($items) > 1) {
                $idsToDelete = [];
                for ($i = 1; $i < count($items); $i++) {
                    $idsToDelete[] = $items[$i]['id'];
                }

                if (!empty($idsToDelete)) {
                    $results['clients'] += count($idsToDelete);
                    if ($mode === 'commit') {
                        $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));

                        // Re-link existing documents to the primary client
                        $relink = $pdo->prepare("UPDATE documents SET customer_id = ? WHERE customer_id IN ($placeholders)");
                        $relink->execute(array_merge([$items[0]['id']], $idsToDelete));

                        $del = $pdo->prepare("DELETE FROM clients WHERE id IN ($placeholders)");
                        $del->execute($idsToDelete);
                    }
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'merged' => $results]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>