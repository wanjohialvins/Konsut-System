<?php
// api/admin/get_error_logs.php
require_once '../config.php';

// Only Admin/IT/CEO should see this
requirePermission('view_system_logs');

header('Content-Type: application/json');

$logFile = __DIR__ . '/../../logs/frontend_errors.log';

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Wipe the log file
    if (file_exists($logFile)) {
        file_put_contents($logFile, "");
    }
    echo json_encode(['success' => true, 'message' => 'Logs purged successfully']);
    exit;
}

if (!file_exists($logFile)) {
    echo json_encode(['logs' => ""]);
    exit;
}

// Read the file properly
$content = file_get_contents($logFile);

echo json_encode(['logs' => $content]);
?>