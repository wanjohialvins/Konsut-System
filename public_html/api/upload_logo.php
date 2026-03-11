<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if ($method === 'POST') {
    requirePermission('manage_settings');

    if (!isset($_FILES['logo_file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['logo_file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
        ];
        $msg = $uploadErrors[$file['error']] ?? 'Unknown upload error';
        echo json_encode(['error' => $msg]);
        exit;
    }

    // Validate type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.']);
        exit;
    }

    // Max 2MB
    if ($file['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 2MB limit.']);
        exit;
    }

    // Ensure uploads directory exists
    // Path relative to this script (e.g. public_html/api/upload_logo.php)
    $uploadDir = '../uploads/logos/';
    if (!is_dir($uploadDir)) {
        if (!@mkdir($uploadDir, 0755, true)) {
            $error = error_get_last();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create uploads directory: ' . ($error['message'] ?? 'Unknown error')]);
            exit;
        }
    }

    // Generate unique name
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid('logo_') . '.' . $ext;
    $targetPath = $uploadDir . $newFileName;

    // Move file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Return front-end accessible path. 
        // Relative to the public_html root, the path is 'uploads/logos/filename'
        // Since React accesses it via domain.com/uploads/logos/...
        $relativePath = 'uploads/logos/' . $newFileName;
        
        echo json_encode(['success' => true, 'path' => $relativePath, 'message' => 'Logo uploaded successfully']);
        
        // Audit log
        $userId = getRequestHeader('X-User-Id');
        if ($userId) {
            $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())")
                ->execute([$userId, 'UPDATE_SETTINGS', "Uploaded new company logo: $newFileName"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file. Check folder permissions.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
