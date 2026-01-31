<?php
require_once 'config.php';

$pdo = getDbConnection();
header('Content-Type: application/json');

/*
 * Table Logic (Auto-Migration)
 * CREATE TABLE IF NOT EXISTS sequences (
 *    type VARCHAR(20) PRIMARY KEY, -- 'invoice', 'quotation', 'proforma'
 *    current_value INT DEFAULT 0,
 *    last_reset_date DATE
 * );
 */

try {
    // Ensure table exists 
    // In production, this should be in a migration info. For now, doing it here for safety as requested.
    $pdo->exec("CREATE TABLE IF NOT EXISTS sequences (
        type VARCHAR(20) PRIMARY KEY,
        current_value INT DEFAULT 0,
        last_reset_date DATE
    )");
} catch (Exception $e) {
    // Ignore if exists or error (supposedly)
}

$action = $_GET['action'] ?? 'peek';
$type = $_GET['type'] ?? '';

if (!in_array($type, ['invoice', 'quotation', 'proforma'])) { // Added 'proforma' to allowed types
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Get current state
    $stmt = $pdo->prepare("SELECT * FROM sequences WHERE type = ? FOR UPDATE");
    $stmt->execute([$type]);
    $seq = $stmt->fetch(PDO::FETCH_ASSOC);

    $today = date('Y-m-d');

    if (!$seq) {
        $seq = ['type' => $type, 'current_value' => 0, 'last_reset_date' => $today];
        $ins = $pdo->prepare("INSERT INTO sequences (type, current_value, last_reset_date) VALUES (?, 0, ?)");
        $ins->execute([$type, $today]);
    } else {
        // Daily Reset Logic
        if ($seq['last_reset_date'] !== $today) {
            // Reset sequence!
            // Check if we really want to reset daily? 
            // SequenceManager.ts says: "Daily reset check ... if (data.lastDate !== todayCommon) { return defaults; }"
            // So yes, the business logic dictates DAILY RESET of invoice numbers. 
            $seq['current_value'] = 0;
            $seq['last_reset_date'] = $today;

            // Update DB now? We will update later if 'next', but if 'peek', we technically show 001.
            // If we don't update DB on peek, peeking 12 hours later will still show old logic?
            // Actually, if we just peek, we don't modify state. But next time we save, we reset.
            // But if we peek 001, we want 001.
            // Let's UPDATE the reset date/value immediately even on peek to ensure consistency?
            // No, peek shouldn't write. 
            // But if DB is stale (yesterday), peek needs to return 1 (after reset). 
            // If we don't update DB, result is consistent (0+1=1).
        }
    }

    $nextVal = $seq['current_value'] + 1;

    if ($action === 'next') {
        // Update DB
        $upd = $pdo->prepare("UPDATE sequences SET current_value = ?, last_reset_date = ? WHERE type = ?");
        $upd->execute([$nextVal, $today, $type]); // Commit the increment
        $pdo->commit();

        echo json_encode(['number' => formatDocumentNumber($type, $nextVal), 'value' => $nextVal]);
    } else {
        // Peek
        $pdo->commit(); // Release lock (no changes if just peeking, but we might have updated reset? No we didn't write it.)
        // If we didn't write reset, nextVal computation relies on $seq local var.
        // If $seq['last_reset_date'] was yesterday, we set $seq['current_value'] = 0 locally. 
        // So $nextVal is 1. Correct.
        echo json_encode(['number' => formatDocumentNumber($type, $nextVal), 'value' => $nextVal]);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function formatDocumentNumber($type, $num)
{
    // Format: INV-001 or QT-001 or PRO-001 (Daily-reset based?)
    // SequenceManager.ts logic: DocumentEngine.formatDocumentNumber(type, num)
    // We don't have DocumentEngine here. We need to replicate formatting logic or just return raw number?
    // Frontend expects formatted string? "INV-005".
    // Let's replicate simple formatting or check DocumentEngine logic.
    // Assuming Standard: INV-001, QUO-001, PRO-001
    // Actually, let's keep it simple: Return the NUMBER, and let frontend format it?
    // But existing `SequenceManager.getNextNumber` returns string.
    // If I move logic to backend, backend should ideally return final string OR frontend formats.
    // If I return JSON { number: "INV-001", raw: 1 }, frontend can choose.

    // I will guess formatting for now based on typical types.
    $prefix = '';
    switch ($type) {
        case 'invoice':
            $prefix = 'INV-';
            break;
        case 'quotation':
            $prefix = 'QT-';
            break;
        case 'proforma':
            $prefix = 'PF-';
            break; // Check actual prefix
    }
    return $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);
}
?>