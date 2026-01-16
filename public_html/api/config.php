<?php
// backend/config.php

// 1. Handle CORS immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
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
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.txt');
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
 * Helper to get headers compatibly across servers
 */
function getRequestHeader($name)
{
    // 1. Try $_SERVER (Standard Apache/CGI)
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }

    // Fallback: Scan $_SERVER for case-insensitive match (rare edge case)
    foreach ($_SERVER as $k => $v) {
        if (substr($k, 0, 5) === 'HTTP_') {
            $headerKey = str_replace('_', '-', substr($k, 5));
            if (strtolower($headerKey) === strtolower($name)) {
                return $v;
            }
        }
    }

    // 2. Try getallheaders() (Apache mod_php)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        // Case-insensitive check
        $nameLower = strtolower($name);
        foreach ($headers as $k => $v) {
            if (strtolower($k) === $nameLower) {
                return $v;
            }
        }
    }

    return null;
}

/**
 * RBAC Helper: Check if current user has permission
 */
function checkPermission($action)
{
    // PROBE: Dump headers
    $allHeaders = function_exists('getallheaders') ? getallheaders() : $_SERVER;
    file_put_contents('debug_headers.txt', date('Y-m-d H:i:s') . " | " . print_r($allHeaders, true) . "\n", FILE_APPEND);

    $userId = getRequestHeader('X-User-Id');
    $role = 'viewer';
    $permissions = [];

    if ($userId) {
        $db = getDbConnection();
        try {
            // Track Activity
            $db->prepare("UPDATE users SET last_active = NOW() WHERE id = ?")->execute([$userId]);

            // Fetch LATEST role and permissions for instant reflection
            $stmt = $db->prepare("SELECT role, permissions FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $u = $stmt->fetch();
            if ($u) {
                $role = $u['role'] ?? 'viewer';
                $permissionsJson = $u['permissions'] ?? '[]';
                $permissions = json_decode($permissionsJson, true) ?? [];
            }
        } catch (Exception $e) {
            // Fallback to headers if DB fails or ignore activity update errors
            $role = getRequestHeader('X-User-Role') ?? 'viewer';
            $permissionsJson = getRequestHeader('X-User-Permissions') ?? '[]';
            $permissions = json_decode($permissionsJson, true) ?? [];
        }
    } else {
        // Not logged in or no ID sent
        $role = 'viewer';
        $permissions = [];
    }

    $r = strtolower($role);
    // Allow 'admin' and 'ceo' to bypass permissions
    if ($r === 'admin' || $r === 'ceo')
        return true;

    // Root permission wildcard check - REMOVED to allow granular dashboard access
    /*
    if (in_array('/', $permissions)) {
        return true;
    }
    */

    // Map Backend Actions -> Frontend Route Permissions
    // Key = Backend Action
    // Value = Array of Frontend Routes that allow this action (Logical OR)
    $permissionMap = [
        // Personal Settings (Always Allowed)
        'view_profile' => ['*'],
        'view_preferences' => ['*'],

        // Support (Always Allowed)
        'view_support' => ['*'],

        // Stock (Universal for non-viewers)
        'view_stock' => ['*', '/stock/inventory', '/new-invoice', '/stock/add'],
        'manage_stock' => ['/stock/add', '/stock/inventory'],

        // Invoices
        'view_invoices' => ['/invoices', '/new-invoice', '/clients'],
        'manage_invoices' => ['/new-invoice'],
        'delete_invoice' => ['/invoices'],

        // Clients
        'view_clients' => ['/clients', '/new-invoice', '/invoices'],
        'manage_clients' => ['/clients', '/new-invoice'],

        // Users
        'view_users' => ['/users'],
        'manage_users' => ['/users'],

        // Settings
        'view_settings' => ['/settings/profile', '/settings/invoice', '/settings/preferences', '/settings/system', '/', '/dashboard'],
        'manage_settings' => ['/settings/system'],

        // Suppliers
        'view_suppliers' => ['*', '/stock/inventory', '/stock/add'],
        'manage_suppliers' => ['/stock/add'],

        // Dashboard & Notifications (Everyone with dashboard access)
        'view_dashboard' => ['*', '/', '/dashboard'],
        'view_notifications' => ['*', '/', '/dashboard', '/notifications'],
        'manage_notifications' => ['/', '/dashboard', '/notifications'],

        // Tasks
        'view_tasks' => ['*', '/tasks', '/dashboard'],
        'manage_tasks' => ['/tasks'],

        // Memos
        'view_memos' => ['*', '/memos', '/dashboard'],
        'manage_memos' => ['/memos'],

        // Vault / Documents
        'view_documents' => ['*', '/documents'],
        'manage_documents' => ['/documents'],
    ];

    $r = strtolower($role);
    $isNotViewer = $r !== 'viewer' && !empty($r);

    // If the action is in the map, check for the mapped route
    if (isset($permissionMap[$action])) {
        $allowedRoutes = $permissionMap[$action];
        $hasPermission = false;

        // Check if user has ANY of the allowed routes
        foreach ($allowedRoutes as $route) {
            // Universal access for non-viewers (if route is '*')
            if ($route === '*') {
                if ($isNotViewer || $action === 'view_profile' || $action === 'view_preferences') {
                    $hasPermission = true;
                    break;
                }
            }
            if (in_array($route, $permissions)) {
                $hasPermission = true;
                break;
            }
        }

        // DEBUG LOGGING
        $logData = date('Y-m-d H:i:s') . " | Action: $action | Required: " . json_encode($allowedRoutes) . " | Role: $role | Perms: $permissionsJson | Result: " . ($hasPermission ? 'PASS' : 'FAIL') . "\n";
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

/**
 * Helper: Get default permissions for a role
 * Used when creating/updating users if specific permissions aren't provided
 */
function getDefaultPermissions($role)
{
    $r = strtolower($role);

    // Admin/CEO: Full Access Root
    if ($r === 'admin' || $r === 'ceo') {
        return ['/'];
    }

    // Manager: High operational access + Analytics
    if ($r === 'manager') {
        return [
            '/',
            '/analytics',
            '/new-invoice',
            '/invoices',
            '/clients',
            '/stock/inventory',
            '/suppliers',
            '/documents',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/support/guide',
            '/support/contact',
            '/settings/profile',
            '/settings/company',
            '/settings/invoice',
            '/settings/preferences'
        ];
    }

    // Sales: Focused on Invoices and Clients
    if ($r === 'sales') {
        return [
            '/',
            '/new-invoice',
            '/invoices',
            '/clients',
            '/stock/inventory',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/settings/profile',
            '/settings/preferences'
        ];
    }

    // Storekeeper: Focused on Stock and Suppliers
    if ($r === 'storekeeper') {
        return [
            '/',
            '/stock/inventory',
            '/suppliers',
            '/invoices',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/settings/profile',
            '/settings/preferences'
        ];
    }

    // Accountant: Focused on Financials and Reporting
    if ($r === 'accountant') {
        return [
            '/',
            '/analytics',
            '/invoices',
            '/clients',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/settings/profile',
            '/settings/company',
            '/settings/invoice',
            '/settings/preferences'
        ];
    }

    // Staff: General Operational access
    if ($r === 'staff') {
        return [
            '/',
            '/new-invoice',
            '/invoices',
            '/clients',
            '/stock/inventory',
            '/suppliers',
            '/documents',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/support/guide',
            '/support/contact',
            '/settings/profile',
            '/settings/preferences'
        ];
    }

    // Viewer: Read-only access to basic data
    if ($r === 'viewer') {
        return ['/', '/invoices', '/clients', '/settings/profile'];
    }

    // Default Fallback
    return ['/', '/settings/profile'];
}
