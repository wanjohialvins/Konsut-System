require_once '../config.php';
requirePermission('view_dashboard');

$pdo = getDbConnection();

// Dashboard is accessible to all authenticated users.
// The frontend (Dashboard.tsx) controls what data is displayed based on user roles.
// We return all stats here, and the frontend will filter/hide sensitive information
// based on the user's permissions (e.g., financial data for admin/CEO only).

header('Content-Type: application/json');

try {
// 1. Revenue Metrics
// Revenue = Sum of grandTotal of all INVOICES (excluding Quotations and Cancelled)
$stmt = $pdo->query("SELECT
SUM(grandTotal) as total_revenue,
COUNT(*) as total_count,
SUM(CASE WHEN LOWER(status) = 'paid' THEN 1 ELSE 0 END) as paid_count,
SUM(CASE WHEN LOWER(status) IN ('pending', 'sent', 'draft') THEN 1 ELSE 0 END) as pending_count,
SUM(CASE WHEN LOWER(status) = 'overdue' THEN 1 ELSE 0 END) as overdue_count
FROM documents
WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND deleted_at IS NULL");
$invStats = $stmt->fetch(PDO::FETCH_ASSOC);

// 1b. Previous Month Revenue for Growth
$lastMonthStart = date('Y-m-01', strtotime('last month'));
$lastMonthEnd = date('Y-m-t', strtotime('last month'));
$stmt = $pdo->prepare("SELECT SUM(grandTotal) as last_month_revenue FROM documents WHERE type = 'invoice' AND
LOWER(status) != 'cancelled' AND issuedDate BETWEEN ? AND ? AND deleted_at IS NULL");
$stmt->execute([$lastMonthStart, $lastMonthEnd]);
$prevRev = $stmt->fetch(PDO::FETCH_ASSOC)['last_month_revenue'] ?? 0;

$thisMonthStart = date('Y-m-01');
$stmt = $pdo->prepare("SELECT SUM(grandTotal) as this_month_revenue FROM documents WHERE type = 'invoice' AND
LOWER(status) != 'cancelled' AND issuedDate >= ? AND deleted_at IS NULL");
$stmt->execute([$thisMonthStart]);
$currRev = $stmt->fetch(PDO::FETCH_ASSOC)['this_month_revenue'] ?? 0;

$revenueGrowth = ($prevRev > 0) ? round((($currRev - $prevRev) / $prevRev) * 100, 1) : 0;

// 2. Stock Metrics
// Value = quantity * unitPrice
// Low Stock < 5 $stmt=$pdo->query("SELECT
    SUM(quantity * unitPrice) as stock_value,
    SUM(CASE WHEN quantity < 5 THEN 1 ELSE 0 END) as low_stock_count FROM stock WHERE deleted_at IS NULL");
        $stockStats=$stmt->fetch(PDO::FETCH_ASSOC);

        // 3. User Stats
        $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM users");
        $userStats = $stmt->fetch(PDO::FETCH_ASSOC);

        // 4. Chart Data (Last 6 Months) - ONLY INVOICES
        $sixMonthsAgo = date('Y-m-01', strtotime('-5 months'));
        $stmt = $pdo->prepare("SELECT
        DATE_FORMAT(issuedDate, '%b') as name,
        MONTH(issuedDate) as month,
        YEAR(issuedDate) as year,
        SUM(grandTotal) as revenue
        FROM documents
        WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND issuedDate >= ? AND deleted_at IS NULL
        GROUP BY YEAR(issuedDate), MONTH(issuedDate)
        ORDER BY year ASC, month ASC");
        $stmt->execute([$sixMonthsAgo]);
        $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Recent Activity (Latest 5 Invoices/Quotes)
        $stmt = $pdo->query("SELECT d.id, c.name as customer_name, d.issuedDate as date, d.grandTotal as amount
        FROM documents d
        LEFT JOIN clients c ON d.customer_id = c.id
        WHERE d.deleted_at IS NULL
        ORDER BY d.created_at DESC
        LIMIT 5");
        $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. Recent Logins (Audit Logs) - Renamed to Security Feed for IT
        $stmt = $pdo->query("SELECT action, details, timestamp
        FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT 10");
        $auditLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. Ticket Stats (For IT/Support) - Handle if table doesn't exist
        $ticketStats = ['total' => 0, 'open_count' => 0, 'urgent_count' => 0];
        try {
        $stmt = $pdo->query("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'urgent' THEN 1 ELSE 0 END) as urgent_count
        FROM tickets");
        $ticketStats = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        // Table doesn't exist yet, use defaults
        }

        // 8. Task Stats (For Manager/Staff) - Handle if table doesn't exist
        $taskStats = ['total' => 0, 'pending_count' => 0];
        try {
        $stmt = $pdo->query("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM tasks");
        $taskStats = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        // Table doesn't exist yet, use defaults
        }

        // 9. Recent Memos (For All) - Handle if table doesn't exist
        $recentMemos = [];
        try {
        $stmt = $pdo->query("SELECT title, content, date, urgent FROM memos ORDER BY created_at DESC LIMIT 3");
        $recentMemos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        // Table doesn't exist yet, use empty array
        }

        echo json_encode([
        'metrics' => [
        'totalRevenue' => round($invStats['total_revenue'] ?? 0),
        'totalInvoices' => $invStats['total_count'] ?? 0,
        'paidCount' => $invStats['paid_count'] ?? 0,
        'pendingInvoicesCount' => $invStats['pending_count'] ?? 0,
        'overdueCount' => $invStats['overdue_count'] ?? 0,
        'averageOrderValue' => ($invStats['total_count'] > 0) ? round($invStats['total_revenue'] /
        $invStats['total_count']) : 0,
        'stockValue' => round($stockStats['stock_value'] ?? 0),
        'lowStockCount' => $stockStats['low_stock_count'] ?? 0,
        'activeUsers' => $userStats['user_count'] ?? 0,
        'openTickets' => $ticketStats['open_count'] ?? 0,
        'urgentTickets' => $ticketStats['urgent_count'] ?? 0,
        'pendingTasks' => $taskStats['pending_count'] ?? 0,
        'revenueGrowth' => $revenueGrowth
        ],
        'chartData' => $chartData,
        'recentActivity' => $recentActivity,
        'auditLogs' => $auditLogs, // Renamed from recentLogins to include all
        'ticketStats' => $ticketStats,
        'recentMemos' => $recentMemos,
        'databaseStatus' => 'Stable',
        'categories' => (function () use ($pdo) {
        try {
        return $pdo->query("SELECT category as name, SUM(total) as total FROM document_items GROUP BY
        category")->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        return []; }
        })(),
        'topCustomers' => (function () use ($pdo) {
        try {
        return $pdo->query("SELECT c.name, SUM(d.grandTotal) as total, COUNT(d.id) as count, MAX(d.issuedDate) as
        lastOrder
        FROM documents d
        JOIN clients c ON d.customer_id = c.id
        WHERE d.type = 'invoice' AND d.deleted_at IS NULL
        GROUP BY d.customer_id
        ORDER BY total DESC
        LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        return []; }
        })()
        ]);

        } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        }
        ?>