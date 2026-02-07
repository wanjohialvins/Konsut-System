<?php
require_once '../config.php';
requirePermission('view_system_logs'); // Ensure strict admin access

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$sql = trim($input['query'] ?? '');

if (empty($sql)) {
    sendError('Query is empty', 400);
}

$isDestructive = $input['destructive'] ?? false;

// Security: Read-Only Enforcement
$forbiddenKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'CREATE', 'REPLACE'];
$upperSql = strtoupper($sql);

if ($isDestructive) {
    // High-level permission check for destructive actions
    requirePermission('system_control');

    // Audit execution
    $userId = getRequestHeader('X-User-Id');
    if ($userId) {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$userId, 'SQL_EXEC_DESTRUCTIVE', "Query: $sql"]);
    }
} else {
    // Normal Read-Only check
    foreach ($forbiddenKeywords as $keyword) {
        // Check for keyword surrounded by word boundaries to avoid false positives (e.g. "UPDATE_DATE" column)
        if (preg_match('/\b' . $keyword . '\b/', $upperSql)) {
            sendError("Security Alert: Command '$keyword' is not allowed in Read-Only mode. Enable Destructive Mode to execute.", 403);
        }
    }
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    // Check if query returns columns
    if ($stmt->columnCount() > 0) {
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'results' => $results, 'count' => count($results)]);
    } else {
        echo json_encode(['success' => true, 'message' => 'Query executed successfully (no results returned).']);
    }

} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
