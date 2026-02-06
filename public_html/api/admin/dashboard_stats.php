<?php
/**
 * Dashboard Intelligence Service
 * 
 * Aggregates high-level metrics for the entire system.
 * Refactored for modularity, robustness, and performance.
 */

require_once '../config.php';

class DashboardStats
{
    private $pdo;
    private $response = [];

    public function __construct()
    {
        $this->pdo = getDbConnection();
        $this->ensureAuth();
    }

    /**
     * Security Check: Ensure valid session exists
     */
    private function ensureAuth()
    {
        if (!isset($GLOBALS['CURRENT_USER_SESSION'])) {
            $this->sendError('Unauthorized access', 401);
        }
    }

    /**
     * Main Execution Method
     */
    public function execute()
    {
        try {
            $this->response = [
                'metrics' => $this->getMetrics(),
                'chartData' => $this->getRevenueChart(),
                'recentActivity' => $this->getRecentActivity(),
                'auditLogs' => $this->getAuditLogs(),
                'ticketStats' => $this->getTicketStats(),
                'recentMemos' => $this->getRecentMemos(),
                'categories' => $this->getCategories(),
                'topCustomers' => $this->getTopCustomers(),
                'databaseStatus' => $this->getSystemHealth(),
                'generated_at' => date('c') // Upgrade: Timestamp
            ];

            $this->sendJson($this->response);

        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    /**
     * 1. Core Metrics Aggregation
     */
    private function getMetrics()
    {
        // Revenue & Invoice Counts
        $invStats = $this->queryOne("SELECT 
            SUM(grandTotal) as total_revenue,
            COUNT(*) as total_count, 
            SUM(CASE WHEN LOWER(status) = 'paid' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN LOWER(status) IN ('pending', 'sent', 'draft') THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN LOWER(status) = 'overdue' THEN 1 ELSE 0 END) as overdue_count
            FROM documents 
            WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND deleted_at IS NULL");

        // Stock Stats
        $stockStats = $this->queryOne("SELECT 
            SUM(quantity * unitPrice) as stock_value,
            SUM(CASE WHEN quantity < 5 THEN 1 ELSE 0 END) as low_stock_count 
            FROM stock WHERE deleted_at IS NULL");

        // User Stats
        $userStats = $this->queryOne("SELECT COUNT(*) as user_count FROM users");

        // Task Stats (Safe)
        $taskStats = $this->safeQueryOne("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
            FROM tasks", ['total' => 0, 'pending_count' => 0]);

        // Ticket Stats (Safe)
        $ticketStats = $this->safeQueryOne("SELECT 
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
            SUM(CASE WHEN status = 'urgent' THEN 1 ELSE 0 END) as urgent_count
            FROM tickets", ['open_count' => 0, 'urgent_count' => 0]);

        return [
            'totalRevenue' => round($invStats['total_revenue'] ?? 0),
            'totalInvoices' => (int) ($invStats['total_count'] ?? 0),
            'paidCount' => (int) ($invStats['paid_count'] ?? 0),
            'pendingInvoicesCount' => (int) ($invStats['pending_count'] ?? 0),
            'overdueCount' => (int) ($invStats['overdue_count'] ?? 0),
            'averageOrderValue' => ($invStats['total_count'] > 0)
                ? round($invStats['total_revenue'] / $invStats['total_count'])
                : 0,
            'stockValue' => round($stockStats['stock_value'] ?? 0),
            'lowStockCount' => (int) ($stockStats['low_stock_count'] ?? 0),
            'activeUsers' => (int) ($userStats['user_count'] ?? 0),
            'openTickets' => (int) ($ticketStats['open_count'] ?? 0),
            'urgentTickets' => (int) ($ticketStats['urgent_count'] ?? 0),
            'pendingTasks' => (int) ($taskStats['pending_count'] ?? 0),
            'revenueGrowth' => $this->calculateGrowth()
        ];
    }

    /**
     * 1b. Revenue Growth Calculation
     */
    private function calculateGrowth()
    {
        try {
            $lastMonthStart = date('Y-m-01', strtotime('last month'));
            $lastMonthEnd = date('Y-m-t', strtotime('last month'));
            $prev = $this->queryValue("SELECT SUM(grandTotal) FROM documents 
                WHERE type = 'invoice' AND LOWER(status) != 'cancelled' 
                AND issuedDate BETWEEN ? AND ? AND deleted_at IS NULL",
                [$lastMonthStart, $lastMonthEnd]
            );

            $thisMonthStart = date('Y-m-01');
            $curr = $this->queryValue("SELECT SUM(grandTotal) FROM documents 
                WHERE type = 'invoice' AND LOWER(status) != 'cancelled' 
                AND issuedDate >= ? AND deleted_at IS NULL",
                [$thisMonthStart]
            );

            $prev = $prev ?? 0;
            $curr = $curr ?? 0;

            return ($prev > 0) ? round((($curr - $prev) / $prev) * 100, 1) : 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * 2. Revenue Chart Data (Last 6 Months)
     */
    private function getRevenueChart()
    {
        $sixMonthsAgo = date('Y-m-01', strtotime('-5 months'));
        return $this->queryAll("SELECT 
            DATE_FORMAT(issuedDate, '%b') as name,
            MONTH(issuedDate) as month,
            YEAR(issuedDate) as year, 
            SUM(grandTotal) as revenue
            FROM documents
            WHERE type = 'invoice' AND LOWER(status) != 'cancelled' 
            AND issuedDate >= ? AND deleted_at IS NULL
            GROUP BY YEAR(issuedDate), MONTH(issuedDate)
            ORDER BY year ASC, month ASC", [$sixMonthsAgo]);
    }

    /**
     * 3. Recent Documents Activity
     */
    private function getRecentActivity()
    {
        return $this->queryAll("SELECT d.id, c.name as customer_name, d.issuedDate as date, d.grandTotal as amount
            FROM documents d
            LEFT JOIN clients c ON d.customer_id = c.id
            WHERE d.deleted_at IS NULL
            ORDER BY d.created_at DESC 
            LIMIT 5");
    }

    /**
     * 4. Audit Logs (Security Feed)
     */
    private function getAuditLogs()
    {
        return $this->safeQueryAll("SELECT action, details, timestamp 
            FROM audit_logs 
            ORDER BY timestamp DESC 
            LIMIT 10");
    }

    /**
     * 5. Helper Stats Aggregations
     */
    private function getTicketStats()
    {
        return $this->safeQueryOne("SELECT 
            COUNT(*) as total, 
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
            SUM(CASE WHEN status = 'urgent' THEN 1 ELSE 0 END) as urgent_count
            FROM tickets", ['total' => 0, 'open_count' => 0, 'urgent_count' => 0]);
    }

    private function getRecentMemos()
    {
        return $this->safeQueryAll("SELECT title, content, date, urgent 
            FROM memos 
            ORDER BY created_at DESC 
            LIMIT 3");
    }

    private function getCategories()
    {
        return $this->safeQueryAll("SELECT category as name, SUM(total) as total 
            FROM document_items 
            GROUP BY category");
    }

    private function getTopCustomers()
    {
        return $this->queryAll("SELECT c.name, SUM(d.grandTotal) as total, COUNT(d.id) as count, MAX(d.issuedDate) as lastOrder
            FROM documents d
            JOIN clients c ON d.customer_id = c.id
            WHERE d.type = 'invoice' AND d.deleted_at IS NULL
            GROUP BY d.customer_id
            ORDER BY total DESC
            LIMIT 10");
    }

    /**
     * Upgrade: Dynamic System Health Check
     */
    private function getSystemHealth()
    {
        try {
            $start = microtime(true);
            $this->pdo->query("SELECT 1");
            $duration = (microtime(true) - $start) * 1000; // ms
            return $duration < 200 ? 'Stable' : 'Slow Response';
        } catch (Exception $e) {
            return 'Connection Error';
        }
    }

    // --- Helpers ---

    private function queryOne($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    private function queryValue($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn();
    }

    private function queryAll($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function safeQueryOne($sql, $default = [])
    {
        try {
            return $this->queryOne($sql);
        } catch (Exception $e) {
            return $default;
        }
    }

    private function safeQueryAll($sql, $default = [])
    {
        try {
            return $this->queryAll($sql);
        } catch (Exception $e) {
            return $default;
        }
    }

    private function sendJson($data)
    {
        ob_clean(); // Safety Fix
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    private function sendError($message, $code = 500)
    {
        ob_clean(); // Safety Fix
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit;
    }
}

// Instantiate and Run
$dashboard = new DashboardStats();
$dashboard->execute();