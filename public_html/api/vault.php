<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

// Ensure Encryption Key is set
if (!defined('ENCRYPTION_KEY') || strlen(ENCRYPTION_KEY) < 32) {
    http_response_code(500);
    echo json_encode(['error' => 'Server Configuration Error: Encryption key missing']);
    exit;
}

switch ($method) {
    case 'GET':
        // ACTION: DOWNLOAD
        if (isset($_GET['action']) && $_GET['action'] === 'download') {
            requirePermission('view_documents');
            $id = $_GET['id'] ?? null;
            if (!$id)
                die('Missing ID');

            try {
                // Verify Ownership
                $userId = getRequestHeader('X-User-Id');

                // Allow admins to download ANY file? Probably yes for audit.
                $userRole = getRequestHeader('X-User-Role') ?? 'viewer';
                $isAdmin = ($userRole === 'admin' || $userRole === 'ceo');

                $query = "SELECT * FROM vault_documents WHERE id = ?";
                if (!$isAdmin) {
                    $query .= " AND user_id = ?";
                }

                $stmt = $pdo->prepare($query);
                if (!$isAdmin) {
                    $stmt->execute([$id, $userId]);
                } else {
                    $stmt->execute([$id]);
                }

                $doc = $stmt->fetch();

                if (!$doc) {
                    http_response_code(403);
                    die('Forbidden or File Not Found');
                }

                $filePath = '../uploads/' . basename($doc['path']); // Security: basename

                if (!file_exists($filePath)) {
                    http_response_code(404);
                    die('File not found on disk');
                }

                if (!empty($doc['iv'])) {
                    // Encrypted File
                    $encryptedContent = file_get_contents($filePath);
                    $iv = hex2bin($doc['iv']);
                    $key = hex2bin(ENCRYPTION_KEY);

                    $decrypted = openssl_decrypt($encryptedContent, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

                    if ($decrypted === false) {
                        http_response_code(500);
                        die('Decryption Failed');
                    }
                } else {
                    // Legacy File (Unencrypted)
                    $decrypted = file_get_contents($filePath);
                }

                // Serve File
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="' . $doc['name'] . '"'); // Original name
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . strlen($decrypted));
                echo $decrypted;
                exit;

            } catch (Exception $e) {
                http_response_code(500);
                die('Error: ' . $e->getMessage());
            }
        }

        // ACTION: LIST
        requirePermission('view_documents');
        try {
            $userId = getRequestHeader('X-User-Id');
            $userRole = getRequestHeader('X-User-Role') ?? 'viewer';
            $isAdmin = ($userRole === 'admin' || $userRole === 'ceo');

            $query = "SELECT id, name, type, size, upload_date, user_id FROM vault_documents"; // details only, no path/iv

            if (!$isAdmin) {
                // Allow seeing own files OR legacy files (NULL owner)
                $query .= " WHERE (user_id = ? OR user_id IS NULL)";
            }

            $query .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($query);

            if (!$isAdmin) {
                $stmt->execute([$userId]);
            } else {
                $stmt->execute();
            }

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

        $userId = getRequestHeader('X-User-Id');
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'User ID required for secure upload']);
            exit;
        }

        $file = $_FILES['file'];
        $uploadDir = '../uploads/';

        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0755, true);

        // Security: Generated Name
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $serverName = uniqid('enc_') . '.bin'; // .bin extension for encrypted files
        $targetPath = $uploadDir . $serverName;

        // Encryption
        $iv = openssl_random_pseudo_bytes(16);
        $key = hex2bin(ENCRYPTION_KEY);
        $content = file_get_contents($file['tmp_name']);

        $encrypted = openssl_encrypt($content, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($encrypted === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Encryption failed']);
            exit;
        }

        if (file_put_contents($targetPath, $encrypted)) {
            try {
                // Calculate size of ORIGINAL file for display
                $sizeBytes = $file['size'];
                $sizeStr = ($sizeBytes > 1024 * 1024)
                    ? round($sizeBytes / 1024 / 1024, 2) . ' MB'
                    : round($sizeBytes / 1024, 2) . ' KB';

                $id = uniqid();

                $stmt = $pdo->prepare("INSERT INTO vault_documents (id, name, type, size, upload_date, path, user_id, iv) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $file['name'], // Original Name
                    'file',
                    $sizeStr,
                    $serverName, // Storing filename only is safer than full path
                    $userId,
                    bin2hex($iv)
                ]);

                echo json_encode(['success' => true, 'message' => "File encrypted and uploaded safely"]);
            } catch (PDOException $e) {
                unlink($targetPath);
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save encrypted file']);
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

        $userId = getRequestHeader('X-User-Id');

        try {
            // Verify Ownership before Delete
            // Admin can delete anything
            $userRole = getRequestHeader('X-User-Role') ?? 'viewer';
            $isAdmin = ($userRole === 'admin' || $userRole === 'ceo');

            $query = "SELECT path FROM vault_documents WHERE id = ?";
            if (!$isAdmin) {
                $query .= " AND user_id = ?";
            }

            $stmt = $pdo->prepare($query);
            if (!$isAdmin) {
                $stmt->execute([$id, $userId]);
            } else {
                $stmt->execute([$id]);
            }

            $doc = $stmt->fetch();

            if (!$doc) {
                http_response_code(403);
                echo json_encode(['error' => 'Permission denied or file not found']);
                exit;
            }

            // Delete from disk
            $filePath = '../uploads/' . basename($doc['path']);
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            // Delete from DB
            $delParams = [$id];
            $delQuery = "DELETE FROM vault_documents WHERE id = ?";
            if (!$isAdmin) {
                $delQuery .= " AND user_id = ?";
                $delParams[] = $userId;
            }

            $delStmt = $pdo->prepare($delQuery);
            $delStmt->execute($delParams);

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
?>