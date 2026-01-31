<?php
require_once '../config.php';
requirePermission('manage_settings');

$method = $_SERVER['REQUEST_METHOD'];
$configFile = '../config.php'; // Path relative to api/admin/

if ($method === 'GET') {
    $content = file_get_contents($configFile);
    $config = [];

    // Regex to find define('KEY', 'VALUE');
    // Note: This is simple and assumes standard formatting.
    preg_match_all("/define\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\);/", $content, $matches);

    foreach ($matches[1] as $index => $key) {
        // Filter out sensitive DB creds if you want, or show them.
        // For admin tool, we probably want to see them but maybe mask them in UI (handled in Frontend).
        $config[$key] = $matches[2][$index];
    }

    echo json_encode(['config' => $config]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $newConfig = $input['config'] ?? [];

    if (empty($newConfig)) {
        echo json_encode(['success' => false, 'message' => 'No config provided']);
        exit;
    }

    $content = file_get_contents($configFile);
    $backupFile = $configFile . '.bak.' . time();
    copy($configFile, $backupFile); // Backup first

    foreach ($newConfig as $key => $value) {
        // Sanitize value: escape single quotes
        $safeValue = str_replace("'", "\'", $value);

        // Regex replace
        $pattern = "/define\(\s*['\"]" . preg_quote($key, '/') . "['\"]\s*,\s*['\"][^'\"]*['\"]\s*\);/";
        $replacement = "define('$key', '$safeValue');";

        $content = preg_replace($pattern, $replacement, $content);
    }

    file_put_contents($configFile, $content);

    // Log it
    $userId = getRequestHeader('X-User-Id');
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$userId, 'CONFIG_UPDATE', "Updated system configuration. Backup: $backupFile"]);

    echo json_encode(['success' => true, 'message' => 'Configuration updated successfully']);
    exit;
}
