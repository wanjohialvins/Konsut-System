<?php
// public_html/debug_data_link.php
require_once 'api/config.php';
$pdo = getDbConnection();

echo "<h1>Debug Data Linkage</h1>";

// 1. Check Clients
$stmt = $pdo->query("SELECT id, name FROM clients LIMIT 5");
$clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<h2>Clients (Limit 5)</h2><pre>" . print_r($clients, true) . "</pre>";

// 2. Check Documents
$stmt = $pdo->query("SELECT id, customer_id, type, grandTotal, status FROM documents LIMIT 5");
$docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<h2>Documents (Limit 5)</h2><pre>" . print_r($docs, true) . "</pre>";

// 3. Check for Orphaned Documents (Documents with customer_id that don't exist in clients)
if (!empty($docs)) {
    $stmt = $pdo->query("SELECT d.id, d.customer_id FROM documents d LEFT JOIN clients c ON d.customer_id = c.id WHERE c.id IS NULL AND d.customer_id IS NOT NULL AND d.customer_id != '' LIMIT 5");
    $orphans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h2>Orphaned Documents (Client ID not found in Clients table)</h2><pre>" . print_r($orphans, true) . "</pre>";
}

// 4. Check Type Casing
$stmt = $pdo->query("SELECT DISTINCT type, status FROM documents");
$types = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<h2>Document Types & Statuses Found</h2><pre>" . print_r($types, true) . "</pre>";
?>