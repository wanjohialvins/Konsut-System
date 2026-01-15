<?php
// backend/config.php

// 1. Handle CORS immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Role, X-User-Permissions, X-User-Id");
header("Content-Type: application/json; charset=UTF-8");

// 2. Handle Preflight Requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'invoice_system');
define('DB_USER', 'root');
define('DB_PASS', '');

// 4. Error Handling
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

function getDbConnection()
{
    $host = 'localhost';
    $db = 'invoice_system';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        // Since we already sent JSON headers, this error will be correctly formatted
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
    }
}

/**
 * RBAC Helper: Check if current user has permission
 */
function checkPermission($action)
{
    $role = $_SERVER['HTTP_X_USER_ROLE'] ?? 'viewer';
    $permissionsJson = $_SERVER['HTTP_X_USER_PERMISSIONS'] ?? '[]';
    $permissions = json_decode($permissionsJson, true) ?? [];

    if ($role === 'admin')
        return true;

    // Map Backend Actions -> Frontend Route Permissions
    $permissionMap = [
        // Stock
        'view_stock' => '/stock/inventory',
        'manage_stock' => '/stock/add', // Requires "Add Stock" permission to create/edit/delete

        // Invoices
        'view_invoices' => '/invoices',
        'manage_invoices' => '/new-invoice', // Requires "Create Order" permission
        'delete_invoice' => '/invoices',      // Deleting requires access to the list (refined later?)

        // Clients
        'view_clients' => '/clients',
        'manage_clients' => '/clients',

        // Users
        'view_users' => '/users',
        'manage_users' => '/users',

        // Settings
        'view_settings' => '/settings/profile',
        'manage_settings' => '/settings/system',

        // Suppliers (New)
        'view_suppliers' => '/stock/inventory',
        'manage_suppliers' => '/stock/add',
    ];

    // If the action is in the map, check for the mapped route
    if (isset($permissionMap[$action])) {
        $requiredRoute = $permissionMap[$action];
        $hasPermission = in_array($requiredRoute, $permissions);

        // DEBUG LOGGING
        $logData = date('Y-m-d H:i:s') . " | Action: $action | Required: $requiredRoute | Role: $role | Perms: $permissionsJson | Result: " . ($hasPermission ? 'PASS' : 'FAIL') . "\n";
        file_put_contents('debug_auth.txt', $logData, FILE_APPEND);

        return $hasPermission;
    }

    // Fallback
    return in_array($action, $permissions);
}

function requirePermission($action)
{
    if (!checkPermission($action)) {
        http_response_code(403);
        echo json_encode(['error' => "Forbidden: You don't have permission to $action"]);
        exit;
    }
}

// Start session last, as it's less critical for API than headers
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
