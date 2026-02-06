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
    private $startDate;
    private $endDate;
    private $isFiltered = false;
    private $cacheFile;
    private $cacheDuration = 300; // 5 minutes

    public function __construct()
    {
        $this->pdo = getDbConnection();
        $this->ensureAuth();

        // Date Filtering Logic
        $this->startDate = $_GET['start'] ?? null;
        $this->endDate = $_GET['end'] ?? null;

        if ($this->startDate && $this->endDate) {
            $this->isFiltered = true;
            // Validate dates
            if (!strtotime($this->startDate) || !strtotime($this->endDate)) {
                $this->startDate = null;
                $this->endDate = null;
                $this->isFiltered = false;
            }
        }

        // Caching Logic (Role + Date Range specific)
        $userRole = $GLOBALS['CURRENT_USER_SESSION']['role'] ?? 'guest';
        $dateKey = $this->isFiltered ? "{$this->startDate}_{$this->endDate}" : 'all_time';
        $this->cacheFile = __DIR__ . "/../../cache/dashboard_{$userRole}_{$dateKey}.json";
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
     * Cache Management
     */
    private function checkCache()
    {
        if (file_exists($this->cacheFile) && (time() - filemtime($this->cacheFile) < $this->cacheDuration)) {
            $data = json_decode(file_get_contents($this->cacheFile), true);
            if ($data) {
                // Add header to indicate cache hit
                header('X-Cache-Status: HIT');
                $this->sendJson($data);
            }
        }
    }

    private function saveCache($data)
    {
        if (!is_dir(dirname($this->cacheFile))) {
            @mkdir(dirname($this->cacheFile), 0755, true);
        }
        file_put_contents($this->cacheFile, json_encode($data));
    }

    /**
     * Main Execution Method
     */
    public function execute()
    {
        try {
            // Check cache first (skip for purely dynamic things if needed, but safe here)
            // Only cache if NO alerts/toasts are pending (simplification: just cache)
            $this->checkCache();

            $this->response = [
                'metrics' => $this->getMetrics(),
                'chartData' => $this->getRevenueChart(),
                'recentActivity' => $this->getRecentActivity(),
                'auditLogs' => $this->getAuditLogs(), // Security logs usually need to be real-time, but 5 min delay is acceptable for dashboard
                'ticketStats' => $this->getTicketStats(),
                'recentMemos' => $this->getRecentMemos(),
                'categories' => $this->getCategories(),
                'topCustomers' => $this->getTopCustomers(),
                'databaseStatus' => $this->getSystemHealth(),
                'greeting' => $this->getPersonalizedGreeting(),
                'generated_at' => date('c'),
                'is_cached' => false
            ];

            // Save to cache
            $this->saveCache($this->response);

            header('X-Cache-Status: MISS');
            $this->sendJson($this->response);

        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    private function getPersonalizedGreeting()
    {
        $hour = (int) date('H');
        $user = $GLOBALS['CURRENT_USER_SESSION']['username'] ?? 'User';

        if ($hour < 12)
            return "Good morning, $user";
        if ($hour < 18)
            return "Good afternoon, $user";
        return "Good evening, $user";
    }

    /**
     * 1. Core Metrics Aggregation
     */
    private function getMetrics()
    {
        // Date Filter Clause
        $dateSql = "";
        $params = [];
        if ($this->isFiltered) {
            $dateSql = " AND issuedDate BETWEEN ? AND ? ";
            $params = [$this->startDate, $this->endDate];
        }

        // Revenue & Invoice Counts
        $invStats = $this->queryOne("SELECT 
            SUM(grandTotal) as total_revenue,
            COUNT(*) as total_count, 
            SUM(CASE WHEN LOWER(status) = 'paid' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN LOWER(status) IN ('pending', 'sent', 'draft') THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN LOWER(status) = 'overdue' THEN 1 ELSE 0 END) as overdue_count
            FROM documents 
            WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND deleted_at IS NULL $dateSql", $params);

        // Stock Stats (Always current state, ignore date filter)
        $stockStats = $this->queryOne("SELECT 
            SUM(quantity * unitPrice) as stock_value,
            SUM(CASE WHEN quantity < 5 THEN 1 ELSE 0 END) as low_stock_count 
            FROM stock WHERE deleted_at IS NULL");

        // User Stats (Always current)
        $userStats = $this->queryOne("SELECT COUNT(*) as user_count FROM users");

        // Task/Ticket Stats (Always current)
        $taskStats = $this->safeQueryOne("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count FROM tasks", ['total' => 0, 'pending_count' => 0]);
        $ticketStats = $this->safeQueryOne("SELECT SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count, SUM(CASE WHEN status = 'urgent' THEN 1 ELSE 0 END) as urgent_count FROM tickets", ['open_count' => 0, 'urgent_count' => 0]);

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
     * Adaptive: If filtered, compares with previous period of same length.
     * If not filtered, compares This Month vs Last Month.
     */
    private function calculateGrowth()
    {
        try {
            if ($this->isFiltered) {
                // Determine length of period
                $start = strtotime($this->startDate);
                $end = strtotime($this->endDate);
                $days = ($end - $start) / (60 * 60 * 24);

                // Previous period
                $prevEnd = date('Y-m-d', $start - 86400); // 1 day before start
                $prevStart = date('Y-m-d', strtotime($prevEnd) - ($days * 86400));

                $currentQuery = [$this->startDate, $this->endDate];
                $prevQuery = [$prevStart, $prevEnd];
            } else {
                // Default: This Month
                $currentQuery = [date('Y-m-01'), date('Y-12-31')]; // To now essentially
                $prevQuery = [date('Y-m-01', strtotime('last month')), date('Y-m-t', strtotime('last month'))];
            }

            $currentVal = $this->queryValue("SELECT SUM(grandTotal) FROM documents 
                WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND deleted_at IS NULL 
                AND issuedDate BETWEEN ? AND ?",
                $currentQuery
            );

            $prevVal = $this->queryValue("SELECT SUM(grandTotal) FROM documents 
                WHERE type = 'invoice' AND LOWER(status) != 'cancelled' AND deleted_at IS NULL 
                AND issuedDate BETWEEN ? AND ?",
                $prevQuery
            );

            $prev = $prevVal ?? 0;
            $curr = $currentVal ?? 0;

            return ($prev > 0) ? round((($curr - $prev) / $prev) * 100, 1) : 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * 2. Revenue Chart Data
     * Adaptive grouping based on period length
     */
    private function getRevenueChart()
    {
        // Define range
        if ($this->isFiltered) {
            $start = $this->startDate;
            $end = $this->endDate;
        } else {
            $start = date('Y-m-01', strtotime('-5 months'));
            $end = date('Y-m-d');
        }

        return $this->queryAll("SELECT 
            DATE_FORMAT(issuedDate, '%b') as name,
            MONTH(issuedDate) as month,
            YEAR(issuedDate) as year, 
            SUM(grandTotal) as revenue
            FROM documents
            WHERE type = 'invoice' AND LOWER(status) != 'cancelled' 
            AND issuedDate BETWEEN ? AND ? AND deleted_at IS NULL
            GROUP BY YEAR(issuedDate), MONTH(issuedDate)
            ORDER BY year ASC, month ASC", [$start, $end]);
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