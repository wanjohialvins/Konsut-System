<?php
// backend/admin/analytics_stats.php
require_once '../config.php';
require_once '../auth.php';

$pdo = getDbConnection();

$days = isset($_GET['days']) ? intval($_GET['days']) : 30;
$startDate = date('Y-m-d', strtotime("-$days days"));

try {
    // 1. Status Distribution
    $stmt = $pdo->prepare("SELECT 
        SUM(CASE WHEN LOWER(status) = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN LOWER(status) IN ('pending', 'sent', 'draft') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN LOWER(status) = 'overdue' THEN 1 ELSE 0 END) as overdue,
        COUNT(*) as total_count
        FROM documents 
        WHERE type = 'invoice' AND deleted_at IS NULL AND issuedDate >= ?");
    $stmt->execute([$startDate]);
    $statusMatrix = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Category Liquidity
    $stmt = $pdo->prepare("SELECT di.category as name, SUM(di.total) as total 
                          FROM document_items di
                          JOIN documents d ON di.document_id = d.id
                          WHERE d.deleted_at IS NULL AND d.issuedDate >= ?
                          GROUP BY di.category 
                          ORDER BY total DESC");
    $stmt->execute([$startDate]);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Revenue Trend (Daily or Monthly depending on range)
    $dateFormat = ($days <= 31) ? '%Y-%m-%d' : '%Y-%m';
    $stmt = $pdo->prepare("SELECT DATE_FORMAT(issuedDate, '$dateFormat') as name, SUM(grandTotal) as revenue
                          FROM documents 
                          WHERE type = 'invoice' AND deleted_at IS NULL AND issuedDate >= ?
                          GROUP BY name
                          ORDER BY name ASC");
    $stmt->execute([$startDate]);
    $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Top Customers
    $stmt = $pdo->prepare("SELECT c.name, SUM(d.grandTotal) as total, COUNT(d.id) as count, MAX(d.issuedDate) as lastOrder 
                          FROM documents d 
                          JOIN clients c ON d.customer_id = c.id 
                          WHERE d.type = 'invoice' AND d.deleted_at IS NULL AND d.issuedDate >= ?
                          GROUP BY d.customer_id 
                          ORDER BY total DESC 
                          LIMIT 10");
    $stmt->execute([$startDate]);
    $topCustomers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'statusMatrix' => $statusMatrix,
        'categories' => $categories,
        'trend' => $trend,
        'topCustomers' => $topCustomers,
        'period' => "Last $days Days",
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>