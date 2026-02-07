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
        $pdo = getDbConnection();
        $tables = [
            'users',
            'clients', // or customers
            'stock',
            'suppliers',
            'vault_documents',
            'tasks',
            'memos',
            'notifications',
            'documents',
            'document_items',
            'invoice_items',
            'settings',
            'audit_logs',
            'login_history',
            'sequences'
        ];

        $backup = [
            'metadata' => [
                'generated_at' => date('Y-m-d H:i:s'),
                'version' => '2.0',
                'mode' => 'cron'
            ],
            'data' => []
        ];

        foreach ($tables as $table) {
            try {
                $check = $pdo->query("SHOW TABLES LIKE '$table'");
                if ($check->rowCount() > 0) {
                    $stmt = $pdo->query("SELECT * FROM `$table`"); // strict backticks
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $backup['data'][$table] = $rows;
                }
            } catch (Exception $e) {
                // Ignore missing tables
            }
        }

        $backupDir = __DIR__ . '/../../backups';
        if (!is_dir($backupDir))
            mkdir($backupDir, 0755, true);

        $filename = 'system_backup_' . date('Y-m-d_H-i-s') . '.json';
        $path = $backupDir . '/' . $filename;

        if (file_put_contents($path, json_encode($backup, JSON_PRETTY_PRINT))) {
            // cleanup old backups (keep last 7 days)
            $files = glob($backupDir . '/*.json');
            $now = time();
            foreach ($files as $file) {
                if ($now - filemtime($file) > 7 * 24 * 60 * 60) {
                    unlink($file);
                }
            }
            return "Backup created: $filename";
        }
        throw new Exception("Failed to write backup file.");
    },
    'optimize_db' => function () {
        $pdo = getDbConnection();
        $tables = [
            'users',
            'documents',
            'document_items',
            'clients',
            'stock',
            'audit_logs',
            'tasks',
            'tickets',
            'ticket_messages',
            'login_history',
            'notifications',
            'settings',
            'sequences'
        ];
        $optimized = [];
        foreach ($tables as $t) {
            try {
                $check = $pdo->query("SHOW TABLES LIKE '$t'");
                if ($check->rowCount() > 0) {
                    $pdo->query("OPTIMIZE TABLE `$t`");
                    $optimized[] = $t;
                }
            } catch (Exception $e) {
            }
        }
        return "Optimized " . count($optimized) . " tables.";
    },
    'prune_logs' => function () {
        $logFile = ini_get('error_log');
        if ($logFile && file_exists($logFile)) {
            if (filesize($logFile) > 5 * 1024 * 1024) {
                file_put_contents($logFile, '');
                return "Log file pruned.";
            }
            return "Log file small. Skipped.";
        }
        return "No log file configuration found.";
    },
    'sync_sequences' => function () {
        $pdo = getDbConnection();
        $types = ['invoice' => 'INV', 'quotation' => 'QUO', 'proforma' => 'PRO'];
        $todaysDatePart = date('md'); // e.g., 0207
        $updates = [];

        foreach ($types as $type => $prefix) {
            // pattern: PREFIX-MMDD-SEQ
            // We want the max sequence for TODAY
            $sql = "SELECT id FROM documents WHERE type = ? AND id LIKE ? ORDER BY id DESC LIMIT 1";
            $like = "{$prefix}-{$todaysDatePart}-%";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([$type, $like]);
            $lastId = $stmt->fetchColumn();

            if ($lastId) {
                // Parse "INV-0207-05" -> 5
                $parts = explode('-', $lastId);
                if (count($parts) === 3) {
                    $maxSeq = (int) $parts[2];

                    // Update sequences table if needed
                    $seqStmt = $pdo->prepare("SELECT current_value FROM sequences WHERE type = ?");
                    $seqStmt->execute([$type]);
                    $curr = $seqStmt->fetchColumn();

                    if ($curr !== false && $maxSeq > $curr) {
                        $upd = $pdo->prepare("UPDATE sequences SET current_value = ? WHERE type = ?");
                        $upd->execute([$maxSeq, $type]);
                        $updates[] = "$type set to $maxSeq";
                    }
                }
            }
        }
        return empty($updates) ? "Sequences aligned." : "Syned: " . implode(', ', $updates);
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

            // Audit Log
            $userId = getRequestHeader('X-User-Id') ?? 0;
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$userId, 'CRON_RUN', "Manually executed task: $taskId"]);

            echo json_encode(['success' => true, 'message' => $resultMsg, 'last_run' => $statuses[$taskId]['last_run']]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        exit;
    }
}
