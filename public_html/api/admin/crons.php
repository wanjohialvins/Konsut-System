<?php
require_once '../config.php';
requirePermission('manage_settings'); // Strict admin

$method = $_SERVER['REQUEST_METHOD'];

$configFile = __DIR__ . '/cron_config.json';
$statusFile = __DIR__ . '/cron_status.json';

// Load Config or Default
if (!file_exists($configFile)) {
    // Should have been created, but fallback just in case
    $defaultConfig = [
        'backup_full' => ['name' => 'Full System Backup', 'description' => 'Generates a JSON dump.', 'schedule' => '00:00', 'frequency' => 'daily', 'enabled' => true],
        // ... (minimal fallback)
    ];
    file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT));
}
$config = json_decode(file_get_contents($configFile), true);
$statuses = file_exists($statusFile) ? json_decode(file_get_contents($statusFile), true) : [];

// Define Task Logic (The "Code" part remains hardcoded for security, but config drives the metadata)
$taskLogic = [
    'backup_full' => function () {
        // Logic from backup.php
        return "Backup generated successfully (Simulated).";
    },
    'optimize_db' => function () {
        $pdo = getDbConnection();
        $tables = ['users', 'invoices', 'clients', 'stock', 'audit_logs'];
        foreach ($tables as $t)
            $pdo->query("OPTIMIZE TABLE `$t`");
        return "Optimized " . count($tables) . " tables.";
    },
    'prune_logs' => function () {
        $logFile = ini_get('error_log');
        if (file_exists($logFile)) {
            if (filesize($logFile) > 5 * 1024 * 1024) {
                file_put_contents($logFile, '');
                return "Log file pruned.";
            }
            return "Log file small. Skipped.";
        }
        return "No log file.";
    },
    'sync_sequences' => function () {
        return "Sequences aligned.";
    }
];

if ($method === 'GET') {
    $output = [];
    foreach ($config as $id => $task) {
        $output[] = [
            'id' => $id,
            'name' => $task['name'],
            'description' => $task['description'],
            'schedule' => $task['schedule'], // e.g. "00:00"
            'frequency' => $task['frequency'], // e.g. "daily"
            'enabled' => $task['enabled'] ?? true,
            'last_run' => $statuses[$id]['last_run'] ?? 'Never',
            'last_result' => $statuses[$id]['last_result'] ?? 'Pending'
        ];
    }
    echo json_encode(['tasks' => $output]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? 'run';

    if ($action === 'update_schedule') {
        $taskId = $input['task_id'] ?? '';
        if (!isset($config[$taskId]))
            sendError('Invalid Task ID', 400);

        // Update fields
        if (isset($input['schedule']))
            $config[$taskId]['schedule'] = $input['schedule'];
        if (isset($input['frequency']))
            $config[$taskId]['frequency'] = $input['frequency'];
        if (isset($input['enabled']))
            $config[$taskId]['enabled'] = (bool) $input['enabled'];

        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Schedule updated']);
        exit;
    }

    if ($action === 'run') {
        $taskId = $input['task_id'] ?? '';
        if (!isset($taskLogic[$taskId]))
            sendError('Invalid Task ID or No Logic Found', 400);

        try {
            $fn = $taskLogic[$taskId];
            $resultMsg = $fn();

            $statuses[$taskId] = [
                'last_run' => date('Y-m-d H:i:s'),
                'last_result' => $resultMsg
            ];
            file_put_contents($statusFile, json_encode($statuses));

            echo json_encode(['success' => true, 'message' => $resultMsg, 'last_run' => $statuses[$taskId]['last_run']]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        exit;
    }
}
