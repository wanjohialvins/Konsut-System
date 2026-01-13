<?php
// backend/admin/debug_auth.php
require_once '../config.php';

$pdo = getDbConnection();
$user_id = $_SERVER['HTTP_X_USER_ID'] ?? 0;

// Security check: Only allow admins with 'system_control' permission
requirePermission('system_control');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $check_username = $data['username'] ?? '';
    $check_password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$check_username]);
    $user = $stmt->fetch();

    $result = [
        'username' => $check_username,
        'found' => false,
        'match' => false,
        'stored_hash_preview' => null,
        'input_hash_preview' => null
    ];

    if ($user) {
        $result['found'] = true;
        $result['role'] = $user['role'];
        // Show first 10 chars of hash for debugging
        $result['stored_hash_preview'] = substr($user['password'], 0, 10) . '...';

        if (password_verify($check_password, $user['password'])) {
            $result['match'] = true;
        } else {
            $result['match'] = false;
            // Generate what the hash would be (obviously salt changes, but useful to prove it's doing work)
            $result['input_hash_preview'] = 'Hash mismatch';
        }
    }

    // Log this sensitive action
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$user_id, 'DEBUG_AUTH', "Debugged login for user: $check_username"]);

    echo json_encode(['success' => true, 'debug_info' => $result]);
}
?>