<?php
// backend/api/admin/restore.php
require_once '../config.php';

// Ensure user has admin/system control permissions
requirePermission('system_control');

$pdo = getDbConnection();
$backupDir = __DIR__ . '/../../logs/backups/';

// Handle GET request to list backups
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $backups = [];
    if (is_dir($backupDir)) {
        $files = scandir($backupDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                $backups[] = [
                    'filename' => $file,
                    'size' => filesize($backupDir . $file),
                    'date' => date('Y-m-d H:i:s', filemtime($backupDir . $file))
                ];
            }
        }
        // Sort by date descending
        usort($backups, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
    }
    sendResponse(['backups' => $backups]);
}

// Handle POST request to restore backup
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $backupData = null;

    if (isset($_FILES['backup_file'])) {
        // Handle file upload
        if ($_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
            sendError('File upload failed');
        }
        $content = file_get_contents($_FILES['backup_file']['tmp_name']);
        $backupData = json_decode($content, true);
    } elseif (isset($data['filename'])) {
        // Handle restore from server file
        $filepath = $backupDir . basename($data['filename']);
        if (!file_exists($filepath)) {
            sendError('Backup file not found');
        }
        $content = file_get_contents($filepath);
        $backupData = json_decode($content, true);
    } elseif (isset($data['restore_latest']) && $data['restore_latest'] === true) {
        // Handle restore latest
        if (is_dir($backupDir)) {
            $files = glob($backupDir . '*.json');
            if (empty($files)) {
                sendError('No backups found on server');
            }
            // Sort by modified time, latest first
            usort($files, function ($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            $latestFile = $files[0];
            $content = file_get_contents($latestFile);
            $backupData = json_decode($content, true);
        } else {
            sendError('Backup directory not found');
        }
    } else {
        sendError('No backup source provided');
    }

    if (!$backupData || !isset($backupData['data'])) {
        sendError('Invalid backup file format');
    }

    try {
        $pdo->beginTransaction();

        // Disable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

        foreach ($backupData['data'] as $table => $rows) {
            // Truncate table
            $pdo->exec("TRUNCATE TABLE `$table`");

            if (!empty($rows)) {
                $columns = array_keys($rows[0]);
                $colsList = implode("`, `", $columns);
                $placeholders = implode(", ", array_fill(0, count($columns), "?"));

                $sql = "INSERT INTO `$table` (`$colsList`) VALUES ($placeholders)";
                $stmt = $pdo->prepare($sql);

                foreach ($rows as $row) {
                    $stmt->execute(array_values($row));
                }
            }
        }

        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        $pdo->commit();

        // Log the action
        $userId = $GLOBALS['CURRENT_USER_SESSION']['id'] ?? 0;
        $username = $GLOBALS['CURRENT_USER_SESSION']['username'] ?? 'System';
        $logStmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)");
        $logStmt->execute([$userId, 'system_restore', "System restored from backup", $_SERVER['REMOTE_ADDR']]);

        sendResponse(['message' => 'System restored successfully']);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Restore failed: " . $e->getMessage());
        sendError('Restore failed: ' . $e->getMessage());
    }
}
?>