<?php
require_once '../config.php';
requirePermission('manage_system');

$action = $_GET['action'] ?? 'list';
$uploadDir = __DIR__ . '/../../uploads/';

// Ensure upload directory exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($action === 'list') {
    $files = [];
    $scanned = scandir($uploadDir);

    foreach ($scanned as $file) {
        if ($file === '.' || $file === '..')
            continue;

        $path = $uploadDir . $file;
        $files[] = [
            'name' => $file,
            'size' => is_file($path) ? filesize($path) : 0,
            'time' => is_file($path) ? date('Y-m-d H:i:s', filemtime($path)) : null,
            'is_dir' => is_dir($path)
        ];
    }

    echo json_encode(['files' => $files]);
    exit;
}

if ($action === 'delete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        sendError('Method not allowed', 405);
    }

    $filename = $_GET['file'] ?? '';
    if (!$filename)
        sendError('Filename required', 400);

    // Security: Prevent directory traversal
    $filename = basename($filename);
    $path = $uploadDir . $filename;

    if (file_exists($path)) {
        if (unlink($path)) {
            echo json_encode(['success' => true]);
        } else {
            sendError('Failed to delete file', 500);
        }
    } else {
        sendError('File not found', 404);
    }
    exit;
}
