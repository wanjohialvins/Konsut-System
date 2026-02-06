<?php
// backend/admin/debug_auth.php
require_once '../config.php';

$pdo = getDbConnection();
$user_id = getRequestHeader('X-User-Id');

// Security check: Only allow admins with 'system_control' permission
requirePermission('system_control');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
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
        try {
            $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())");
            // If user_id is null/empty, fallback to 0 or something safe if DB requires integer.
            // Assuming DB is lenient or column nullable, but let's be safe:
            $safe_user_id = !empty($user_id) ? $user_id : 0;
            $stmt->execute([$safe_user_id, 'DEBUG_AUTH', "Debugged login for user: $check_username"]);
        } catch (Exception $logEx) {
            // Do not fail the debug request just because logging failed
            error_log("Audit Log Failed in debug_auth.php: " . $logEx->getMessage());
        }

        echo json_encode(['success' => true, 'debug_info' => $result]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>