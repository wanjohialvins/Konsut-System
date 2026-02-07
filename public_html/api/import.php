<?php
// backend/import.php
require_once 'config.php';
require_once 'auth.php';
require_once 'utils/client_utils.php';

// Only admin allowed
requirePermission('system_control');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!isset($_FILES['file'])) {
        sendError('No file uploaded', 400);
    }

    $file = $_FILES['file'];
    $dryRun = ($_POST['dryRun'] ?? 'true') === 'true';

    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendError('File upload failed', 400);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'csv') {
        sendError('Only CSV files are allowed', 400);
    }

    // Process CSV
    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) {
        sendError('Could not open file', 500);
    }

    $headers = fgetcsv($handle);
    if (!$headers) {
        sendError('Empty file', 400);
    }

    // Normalize headers
    $headers = array_map(function ($h) {
        return strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $h)));
    }, $headers);

    $results = [
        'success' => true,
        'total' => 0,
        'imported' => 0,
        'duplicates' => 0,
        'errors' => [],
        'logs' => []
    ];

    $pdo = getDbConnection();
    if (!$dryRun)
        $pdo->beginTransaction();

    try {
        while (($row = fgetcsv($handle)) !== false) {
            $results['total']++;
            if (count($row) !== count($headers))
                continue;

            $data = array_combine($headers, $row);

            // Detect Type (Client or Stock) based on columns
            $type = isset($data['email']) || isset($data['company']) ? 'client' : 'stock';

            if ($type === 'client') {
                $name = $data['name'] ?? null;
                if (!$name)
                    continue;

                // Check duplicate
                $stmt = $pdo->prepare("SELECT id FROM clients WHERE name = ? OR (email = ? AND email != '')");
                $stmt->execute([$name, $data['email'] ?? '']);
                if ($stmt->fetch()) {
                    $results['duplicates']++;
                    $results['logs'][] = "Duplicate Client skipped: $name";
                    continue;
                }

                if (!$dryRun) {
                    // Sanitization pipeline (trim, etc is mostly implicit in usage but let's be explicit)
                    $insert = $pdo->prepare("INSERT INTO clients (id, name, email, phone, address, company, kraPin) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $insert->execute([
                        'CUST-' . uniqid(),
                        trim($name),
                        strtolower(trim($data['email'] ?? '')),
                        trim($data['phone'] ?? ''),
                        trim($data['address'] ?? ''),
                        trim($data['company'] ?? ''),
                        strtoupper(trim($data['krapin'] ?? ''))
                    ]);
                }
                $results['imported']++;

            } else {
                // Stock
                $name = $data['name'] ?? null;
                if (!$name)
                    continue;

                $stmt = $pdo->prepare("SELECT id FROM stock WHERE name = ?");
                $stmt->execute([$name]);
                if ($stmt->fetch()) {
                    $results['duplicates']++;
                    $results['logs'][] = "Duplicate Stock skipped: $name";
                    continue;
                }

                if (!$dryRun) {
                    $insert = $pdo->prepare("INSERT INTO stock (id, name, description, quantity, unitPrice, category) VALUES (?, ?, ?, ?, ?, ?)");
                    $insert->execute([
                        'ITM-' . uniqid(),
                        trim($name),
                        trim($data['description'] ?? ''),
                        (float) ($data['quantity'] ?? 0),
                        (float) ($data['unitprice'] ?? 0),
                        strtolower(trim($data['category'] ?? 'products'))
                    ]);
                }
                $results['imported']++;
            }
        }

        if (!$dryRun)
            $pdo->commit();

        fclose($handle);
        echo json_encode($results);

    } catch (Exception $e) {
        if (!$dryRun)
            $pdo->rollBack();
        sendError('Import failed: ' . $e->getMessage(), 500);
    }

} else {
    sendError('Method not allowed', 405);
}
