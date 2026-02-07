<?php
// backend/admin/revert_audit.php
require_once '../config.php';

$pdo = getDbConnection();
requirePermission('system_control'); // High privilege

$data = json_decode(file_get_contents('php://input'), true);
$auditId = $data['audit_id'] ?? 0;

if (!$auditId) {
    http_response_code(400);
    echo json_encode(['error' => 'Audit ID required']);
    exit;
}

// In a real system, reverting is complex. 
// We will just mark it as reverted in the log for this simple implementation.
try {
    // Fetch the audit log to understand what to reverse
    $fetchStmt = $pdo->prepare("SELECT * FROM audit_logs WHERE id = ?");
    $fetchStmt->execute([$auditId]);
    $log = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if (!$log) {
        throw new Exception("Audit log entry not found");
    }

    if (!$log['entity_type'] || !$log['entity_id']) {
        throw new Exception("Cannot reverse: Missing entity information");
    }

    // Begin Transaction
    $pdo->beginTransaction();

    $reversed = false;
    $entityId = $log['entity_id'];
    $table = '';

    // Map entity_type to table name (Safe-list)
    $tableMap = [
        'INVOICE' => 'documents',
        'CLIENT' => 'clients',
        'USER' => 'users',
        'PRODUCT' => 'stock',
        'SUPPLIER' => 'suppliers',
        'SETTING' => 'settings'
    ];

    // Normalize entity type to find table
    foreach ($tableMap as $type => $tbl) {
        if (strpos(strtoupper($log['entity_type']), $type) !== false) {
            $table = $tbl;
            break;
        }
    }

    if (!$table) {
        throw new Exception("Cannot reverse: Unknown entity type '{$log['entity_type']}'");
    }

    $action = strtoupper($log['action']);

    if (strpos($action, 'CREATE') !== false || strpos($action, 'INSERT') !== false) {
        // Reverse Creation = Delete
        $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
        $stmt->execute([$entityId]);
        $reversed = true;

    } elseif (strpos($action, 'UPDATE') !== false) {
        // Reverse Update = Restore data_before
        $dataBefore = json_decode($log['data_before'], true);
        if (!$dataBefore) {
            throw new Exception("Cannot reverse: No 'Before' snapshot available");
        }

        // Construct Update Query
        $setParts = [];
        $params = [];
        foreach ($dataBefore as $col => $val) {
            if ($col === 'id' || $col === 'created_at' || $col === 'updated_at')
                continue; // Skip immutable keys
            $setParts[] = "$col = ?";
            $params[] = $val;
        }

        if (empty($setParts)) {
            throw new Exception("Nothing to reverse in snapshot");
        }

        $params[] = $entityId;
        $sql = "UPDATE $table SET " . implode(', ', $setParts) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reversed = true;

    } elseif (strpos($action, 'DELETE') !== false) {
        // Reverse Delete = Restore (Insert) data_before
        $dataBefore = json_decode($log['data_before'], true);
        if (!$dataBefore) {
            throw new Exception("Cannot reverse: No 'Before' snapshot available");
        }

        $cols = array_keys($dataBefore);
        $placeholders = array_fill(0, count($cols), '?');
        $values = array_values($dataBefore);

        $sql = "INSERT INTO $table (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        $reversed = true;
    }

    if ($reversed) {
        // Log the Reversal
        $userId = getRequestHeader('X-User-Id');
        $logStmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, timestamp) VALUES (?, 'REVERT', ?, ?, ?, NOW())");
        $logStmt->execute([$userId, $log['entity_type'], $entityId, "Reverted Action #{$auditId}"]);

        // Mark original as reverted
        $updateLog = $pdo->prepare("UPDATE audit_logs SET details = CONCAT(details, ' [REVERTED]') WHERE id = ?");
        $updateLog->execute([$auditId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Action successfully reverted']);
    } else {
        $pdo->rollBack();
        throw new Exception("No reversible action identified");
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>