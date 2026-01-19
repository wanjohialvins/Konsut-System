<?php
// backend/admin/accountability.php
require_once '../config.php';
require_once '../auth.php';

requirePermission('view_accountability');

$pdo = getDbConnection();

try {
    // Aggregate sales data per user
    // We join users with documents on created_by
    $query = "
        SELECT 
            u.username,
            u.role,
            COUNT(d.id) as total_invoices,
            COALESCE(SUM(d.grandTotal), 0) as total_revenue
        FROM users u
        LEFT JOIN documents d ON u.id = d.created_by AND d.deleted_at IS NULL
        GROUP BY u.id, u.username, u.role
        ORDER BY total_revenue DESC
    ";

    $stmt = $pdo->query($query);
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
