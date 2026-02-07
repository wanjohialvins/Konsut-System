<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $pdo = getDbConnection();

    // 1. Check if table exists and has data
    $count = $pdo->query("SELECT COUNT(*) FROM clients")->fetchColumn();
    echo "Total clients in DB: " . $count . "\n";

    if ($count == 0) {
        echo "Table is empty.\n";
        exit;
    }

    // 2. Run the actual query from clients.php
    $query = "
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND d.deleted_at IS NULL) as totalInvoices,
            (SELECT COALESCE(SUM(d.grandTotal), 0) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) != 'cancelled' AND d.deleted_at IS NULL) as totalRevenue,
            (SELECT MAX(d.issuedDate) FROM documents d WHERE d.customer_id = c.id AND d.deleted_at IS NULL) as lastActive,
            (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) IN ('pending', 'sent', 'draft') AND d.deleted_at IS NULL) as pendingCount,
            (SELECT COUNT(*) FROM documents d WHERE d.customer_id = c.id AND LOWER(d.type) = 'invoice' AND LOWER(d.status) = 'overdue' AND d.deleted_at IS NULL) as overdueCount
        FROM clients c
        WHERE c.deleted_at IS NULL
        ORDER BY c.name ASC
    ";

    $stmt = $pdo->query($query);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Query returned " . count($results) . " rows.\n";
    echo "Sample row: " . json_encode($results[0] ?? []) . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
