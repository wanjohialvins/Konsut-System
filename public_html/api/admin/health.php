<?php
// backend/admin/health.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control');

try {
    // 1. DB Size
    $stmt = $pdo->query("SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
                         FROM information_schema.TABLES 
                         WHERE table_schema = DATABASE() 
                         GROUP BY table_schema");
    $dbStat = $stmt->fetch();
    $dbSize = $dbStat ? round($dbStat['size_mb'], 2) . ' MB' : 'Unknown';

    // 2. Disk Usage
    // Note: On some shared hosting, this might return the whole partition size
    $diskFree = @disk_free_space(__DIR__);
    $diskTotal = @disk_total_space(__DIR__);
    $diskUsage = 'Unknown';
    if ($diskFree !== false && $diskTotal !== false) {
        $used = $diskTotal - $diskFree;
        $percent = round(($used / $diskTotal) * 100);
        $diskUsage = "{$percent}% (" . round($diskFree / 1024 / 1024 / 1024, 2) . " GB free)";
    }

    // 3. PHP & Server
    $phpVersion = PHP_VERSION;
    $serverSoftware = $_SERVER['SERVER_SOFTWARE'];

    // 3b. PHP Environment (New)
    $phpConfig = [
        'memory_limit' => ini_get('memory_limit'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'extensions' => array_values(array_intersect(['gd', 'curl', 'mbstring', 'pdo_mysql', 'zip', 'openssl'], get_loaded_extensions()))
    ];

    // 1b. DB Performance (New)
    $start = microtime(true);
    $pdo->query("SELECT 1");
    $latency = round((microtime(true) - $start) * 1000, 2) . ' ms';

    // 1c. Table Health (New)
    $tables = [];
    foreach (['users', 'documents', 'audit_logs'] as $tbl) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $tbl");
        $tables[$tbl] = $stmt->fetchColumn();
    }

    // 4. PHP Error Log (Tail last 20 lines)
    $logFile = ini_get('error_log');
    $phpLogs = [];
    if ($logFile && file_exists($logFile) && is_readable($logFile)) {
        // Read last 4KB
        $fp = fopen($logFile, 'r');
        if ($fp) {
            $fsize = filesize($logFile);
            $offset = max(0, $fsize - 4096);
            fseek($fp, $offset);
            $data = fread($fp, 4096);
            fclose($fp);
            if ($data) {
                $lines = explode("\n", $data);
                $phpLogs = array_slice($lines, -20); // Take last 20
            }
        }
    } else {
        $phpLogs = ["Log file inaccessible or not defined in php.ini", "Path: " . ($logFile ?: 'Unknown')];
    }

    echo json_encode([
        'dbSize' => $dbSize,
        'diskUsage' => $diskUsage,
        'phpVersion' => $phpVersion,
        'serverSoftware' => $serverSoftware,
        'status' => 'Operational',
        'config' => $phpConfig,
        'dbLatency' => $latency,
        'tableCounts' => $tables,
        'logs' => $phpLogs
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>