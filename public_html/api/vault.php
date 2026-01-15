<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_documents');
        try {
            $stmt = $pdo->query("SELECT * FROM vault_documents ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        requirePermission('manage_documents');

        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No file uploaded']);
            exit;
        }

        $file = $_FILES['file'];
        $uploadDir = '../uploads/';

        // Ensure dir exists (backend safety)
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0755, true);

        // Name generation
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $cleanName = pathinfo($file['name'], PATHINFO_FILENAME);
        // Basic sanitization
        $cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $cleanName);

        $newFilename = uniqid('doc_') . '_' . $cleanName . '.' . $ext;
        $targetPath = $uploadDir . $newFilename;
        $publicPath = '/public_html/uploads/' . $newFilename; // For frontend capability

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            try {
                // Calculate size nicely
                $sizeBytes = $file['size'];
                $sizeStr = ($sizeBytes > 1024 * 1024)
                    ? round($sizeBytes / 1024 / 1024, 2) . ' MB'
                    : round($sizeBytes / 1024, 2) . ' KB';

                $id = uniqid(); // Or client generated, but server gen is safer for clean ID

                $stmt = $pdo->prepare("INSERT INTO vault_documents (id, name, type, size, upload_date, path) VALUES (?, ?, ?, ?, NOW(), ?)");
                $stmt->execute([
                    $id,
                    $file['name'], // Original name for display
                    strtoupper($ext),
                    $sizeStr,
                    $publicPath
                ]);
                echo json_encode(['success' => true, 'message' => "File uploaded successfully"]);
            } catch (PDOException $e) {
                // Cleanup file if DB fail
                unlink($targetPath);
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to move uploaded file']);
        }
        break;

    case 'DELETE':
        requirePermission('manage_documents');
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM vault_documents WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
