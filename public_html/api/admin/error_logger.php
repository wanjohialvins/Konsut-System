<?php
// api/admin/error_logger.php
require_once '../config.php';

// Allow any logged-in user to report errors, or at least public if it's a critical failure?
// Ideally, we want to capture errors even if auth fails, but for now let's keep it open or key-protected?
// We'll just headers-check for JSON.

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$error = $input['error'] ?? 'Unknown Error';
$stack = $input['stack'] ?? '';
$component = $input['component'] ?? 'Unknown Component';
$url = $input['url'] ?? '';
$user = $input['user'] ?? 'Guest';
$timestamp = date('Y-m-d H:i:s');

// Format the log entry
$logEntry = "[$timestamp] [USER: $user] [URL: $url]\nERROR: $error\nSTACK: $stack\nCOMPONENT: $component\n----------------------------------------\n";

// Log to file 'frontend_errors.log' in the api directory
$logFile = __DIR__ . '/../../logs/frontend_errors.log';

// Append to file
file_put_contents($logFile, $logEntry, FILE_APPEND);

// Also valid to insert into 'audit_logs' if we wanted, but a separate log file is often cleaner for raw stack traces.
// Let's ALSO insert a summary into audit_logs so IT sees it in the feed.
try {
    $db = getDbConnection();
    $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)");
    // limits
    $details = substr("Frontend Error: $error", 0, 255);
    // We might not have a user ID if the frontend crashed before auth context loaded, but we try:
    // This is optional.
    // $stmt->execute([null, 'SYSTEM_ERROR', $details, $_SERVER['REMOTE_ADDR']]);
} catch (Exception $e) {
    // Ignore DB errors during error logging
}

echo json_encode(['status' => 'logged']);
?>