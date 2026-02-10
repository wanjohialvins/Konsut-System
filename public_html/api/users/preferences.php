<?php
// backend/api/users/preferences.php
require_once '../config.php';

$pdo = getDbConnection();
$userId = $GLOBALS['CURRENT_USER_SESSION']['id'] ?? getRequestHeader('X-User-Id');

if (!$userId) {
    sendError('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT preferences FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $prefs = $stmt->fetchColumn();

        $data = $prefs ? json_decode($prefs, true) : null;
        // If no user prefs, return empty object (frontend handles defaults/global fallback)
        echo json_encode(['success' => true, 'preferences' => $data ?: new stdClass()]);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $newPrefs = $input['preferences'] ?? null;

    if ($newPrefs === null) {
        sendError('No preferences provided', 400);
    }

    try {
        // Fetch existing first to merge? Or just overwrite?
        // Let's merge to be safe, though usually frontend sends full object
        $stmt = $pdo->prepare("SELECT preferences FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $currentJson = $stmt->fetchColumn();
        $current = $currentJson ? json_decode($currentJson, true) : [];

        $merged = array_merge($current, $newPrefs);

        $stmt = $pdo->prepare("UPDATE users SET preferences = ? WHERE id = ?");
        $stmt->execute([json_encode($merged), $userId]);

        echo json_encode(['success' => true, 'message' => 'Preferences updated', 'preferences' => $merged]);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}
?>