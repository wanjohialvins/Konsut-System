<?php
require_once 'config.php';
$pdo = getDbConnection();
$stmt = $pdo->query("SHOW COLUMNS FROM documents");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($columns);
