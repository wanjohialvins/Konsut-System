<?php
ob_start();

// =========================================================================
//  ENVIRONMENT SETTINGS (Edit this section for Production)
// =========================================================================

// Set to false for Production
define('DEBUG_MODE', false);

// Database Configuration
// 1. Try to load production config (if exists on server)
if (file_exists(__DIR__ . '/config.production.php')) {
    include_once __DIR__ . '/config.production.php';
}

// 2. Fallback Defaults (if not set in production config)
if (!defined('DB_HOST'))
    define('DB_HOST', 'localhost');
if (!defined('DB_NAME'))
    define('DB_NAME', 'invoice_system');
if (!defined('DB_USER'))
    define('DB_USER', 'root');
if (!defined('DB_PASS'))
    define('DB_PASS', '');
if (!defined('ENCRYPTION_KEY'))
    define('ENCRYPTION_KEY', '75b5a26c8418041c2e42152862d295c25091d3c0500196230f8705307b508f7d');

// =========================================================================
//  CORE SETUP
// =========================================================================

// Core Security & Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Role, X-User-Permissions, X-User-Id, X-Action");
header("Access-Control-Expose-Headers: X-Action, X-User-Permissions");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('UTC');

// Error Handling
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    ini_set('log_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    ini_set('log_errors', 1);
    if (!is_dir(__DIR__ . '/../logs')) {
        @mkdir(__DIR__ . '/../logs', 0755, true);
    }
    ini_set('error_log', __DIR__ . '/../logs/php_errors.txt');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
}


/**
 * Send a standardized JSON response
 */
function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

/**
 * Send a standardized error response
 */
function sendError($message, $code = 500)
{
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

function getDbConnection()
{
    $host = DB_HOST;
    $db = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (\PDOException $e) {
        // Log the actual error for the developer (essential for cPanel debugging)
        error_log("Database Connection Failed: " . $e->getMessage());

        http_response_code(500);
        if (DEBUG_MODE) {
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        } else {
            die(json_encode(['error' => 'Database connection failed. Check server logs.']));
        }
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
 * Centralized Session & Activity Tracker
 * Runs on every request to ensure 'last_active' is accurate
 * and detects permission changes for real-time frontend refresh.
 */
function initSession()
{
    $userId = getRequestHeader('X-User-Id');
    if (!$userId)
        return;

    try {
        $db = getDbConnection();
        // 1. Update Activity Timestamp (Use UTC)
        $db->prepare("UPDATE users SET last_active = UTC_TIMESTAMP() WHERE id = ?")->execute([$userId]);

        // 2. Cross-check Permissions with Frontend
        $stmt = $db->prepare("SELECT role, permissions FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $u = $stmt->fetch();

        if ($u) {
            $dbPerms = $u['permissions'] ?? '[]';
            $fePerms = getRequestHeader('X-User-Permissions') ?? '[]';

            // Normalize JSON for comparison
            $dbPermsArray = json_decode($dbPerms, true) ?? [];
            $fePermsArray = json_decode($fePerms, true) ?? [];

            // If mismatch detected, signal the frontend to refresh its auth state
            if (count(array_diff($dbPermsArray, $fePermsArray)) > 0 || count(array_diff($fePermsArray, $dbPermsArray)) > 0) {
                header('X-Action: refresh-auth');
            }

            // Cache for subsequent checkPermission calls in this request
            $GLOBALS['CURRENT_USER_SESSION'] = $u;
        }
    } catch (\Exception $e) {
        // Fail silently to prevent system hang on DB issues
    }
}

// Session Initialization
initSession();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Map Backend Actions -> Frontend Route Permissions
 */
function getPermissionRouteMap()
{
    return [
        'view_profile' => ['*', '/settings/profile'],
        'get_self' => ['*'],
        'view_preferences' => ['*', '/settings/preferences'],
        'view_support' => ['*'],
        'view_tickets' => ['*', '/tickets', '/tickets/new', '/tickets/:id'],
        'manage_tickets' => ['/tickets', '/tickets/new', '/tickets/:id'],
        'view_dashboard' => ['*', '/', '/dashboard'],
        'view_reports' => ['/analytics'],
        'view_accountability' => ['/accountability'],
        'view_audit_logs' => ['/audit-logs'],
        'view_system_logs' => ['/system-logs'],
        'view_system_vitals' => ['/system/vitals'],
        'view_system_data' => ['/system/data'],
        'view_system_security' => ['/system/security'],
        'view_system_broadcast' => ['/system/broadcast'],
        'view_invoices' => ['/invoices', '/new-invoice', '/clients'],
        'manage_invoices' => ['/new-invoice'],
        'delete_invoice' => ['delete_invoice'], // Explicit only
        'view_clients' => ['/clients', '/new-invoice', '/invoices'],
        'manage_clients' => ['manage_clients'], // Decoupled from page view
        'view_stock' => ['*', '/stock/inventory', '/new-invoice', '/stock/add'],
        'manage_stock' => ['/stock/add'], // Removed /stock/inventory to separate View from Edit
        'view_suppliers' => ['*', '/suppliers', '/stock/inventory'],
        'manage_suppliers' => ['manage_suppliers'], // Explicit
        'view_documents' => ['*', '/documents'],
        'manage_documents' => ['manage_documents'], // Explicit
        'view_tasks' => ['*', '/tasks', '/dashboard'],
        'manage_tasks' => ['manage_tasks'], // Explicit
        'view_memos' => ['*', '/memos', '/dashboard'],
        'manage_memos' => ['manage_memos'], // Explicit
        'view_notifications' => ['*', '/', '/dashboard', '/notifications'],
        'manage_notifications' => ['/', '/dashboard', '/notifications'],
        'view_users' => ['/users'],
        'manage_users' => ['manage_users'], // Explicit
        'manage_settings' => ['/settings/company', '/settings/invoice'], // Removed profile/preferences
        'view_settings' => ['/settings/profile', '/settings/company', '/settings/invoice', '/settings/preferences', '/', '/dashboard'],
    ];
}

/**
 * RBAC Helper: Check if current user has permission
 */
function checkPermission($action)
{
    $userId = getRequestHeader('X-User-Id');
    $role = 'viewer';
    $permissions = [];

    // Use cached session if available
    if (isset($GLOBALS['CURRENT_USER_SESSION'])) {
        $u = $GLOBALS['CURRENT_USER_SESSION'];
        $role = $u['role'] ?? 'viewer';
        $permissions = json_decode($u['permissions'] ?? '[]', true) ?? [];
    } elseif ($userId) {
        // Fallback for requests that might have missed initSession
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT role, permissions FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $u = $stmt->fetch();
        if ($u) {
            $role = $u['role'] ?? 'viewer';
            $permissions = json_decode($u['permissions'] ?? '[]', true) ?? [];
        }
    }

    $r = strtolower($role);
    // Allow 'admin' and 'ceo' to bypass permissions
    if ($r === 'admin' || $r === 'ceo')
        return true;

    $permissionMap = getPermissionRouteMap();

    $r = strtolower($role);
    $isNotViewer = $r !== 'viewer' && !empty($r);

    // If the action is in the map, check for the mapped route
    if (isset($permissionMap[$action])) {
        $allowedRoutes = $permissionMap[$action];
        $hasPermission = false;

        // 1. Check if the original action itself is explicitly in permissions (Slug check)
        if (in_array($action, $permissions)) {
            $hasPermission = true;
        } else {
            // 2. Check if user has ANY of the allowed routes (Route check)
            foreach ($allowedRoutes as $route) {
                // Universal access for non-viewers (if route is '*')
                if ($route === '*') {
                    if ($isNotViewer || $action === 'view_profile' || $action === 'view_preferences' || $action === 'get_self') {
                        $hasPermission = true;
                        break;
                    }
                }
                if (in_array($route, $permissions)) {
                    $hasPermission = true;
                    break;
                }
            }
        }

        // DEBUG LOGGING - Only in Debug Mode
        if (DEBUG_MODE) {
            $logData = date('Y-m-d H:i:s') . " | Action: $action | Required: " . json_encode($allowedRoutes) . " | Role: $role | Perms: " . json_encode($permissions) . " | Result: " . ($hasPermission ? 'PASS' : 'FAIL') . "\n";
            file_put_contents(__DIR__ . '/../logs/debug_auth.txt', $logData, FILE_APPEND);
        }

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

/**
 * Helper: Get all available system permissions
 * Centralized list matching the frontend UI
 */
function getAllPermissions()
{
    return [
        // Intelligence
        ['id' => '/', 'label' => 'Overview', 'desc' => 'Main business dashboard', 'category' => 'Intelligence'],
        [
            'id' => '/analytics',
            'label' => 'Analytics & Reports',
            'desc' => 'Revenue & accounting reports',
            'category' =>
                'Intelligence'
        ],

        // Resource Hub (Stock)
        [
            'id' => 'view_stock',
            'label' => 'View Inventory',
            'desc' => 'Can see stock levels and items',
            'category' => 'Resource Hub'
        ],
        [
            'id' => 'manage_stock',
            'label' => 'Manage Inventory',
            'desc' => 'Can add, edit, and delete stock',
            'category' =>
                'Resource Hub'
        ],
        [
            'id' => '/stock/inventory',
            'label' => 'Inventory Page',
            'desc' => 'Access to inventory route',
            'category' => 'Resource
Hub'
        ],

        // Sales & Operations (Invoices)
        [
            'id' => 'view_orders',
            'label' => 'View Orders',
            'desc' => 'Can see order history',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => 'create_order',
            'label' => 'Create Order',
            'desc' => 'Can generate new invoices and quotes',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => 'manage_invoices',
            'label' => 'Manage Invoices',
            'desc' => 'Can create and modify orders',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => 'delete_invoice',
            'label' => 'Delete Invoices',
            'desc' => 'Can permanently remove records',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => '/invoices',
            'label' => 'Invoices Page',
            'desc' => 'Access to invoices route',
            'category' => 'Sales & Operations'
        ],

        // Clients
        [
            'id' => 'view_clients',
            'label' => 'View Clients',
            'desc' => 'Can see customer records',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => 'manage_clients',
            'label' => 'Manage Clients',
            'desc' => 'Can modify customer records',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => 'delete_client',
            'label' => 'Delete Clients',
            'desc' => 'Can remove customer records',
            'category' => 'Sales & Operations'
        ],
        [
            'id' => '/clients',
            'label' => 'Clients Page',
            'desc' => 'Access to clients route',
            'category' => 'Sales & Operations'
        ],

        // Suppliers
        [
            'id' => 'view_suppliers',
            'label' => 'View Suppliers',
            'desc' => 'Can see vendor relations',
            'category' => 'Resource
Hub'
        ],
        [
            'id' => 'manage_suppliers',
            'label' => 'Manage Suppliers',
            'desc' => 'Can modify vendor records',
            'category' =>
                'Resource Hub'
        ],
        [
            'id' => '/suppliers',
            'label' => 'Suppliers Page',
            'desc' => 'Access to suppliers route',
            'category' => 'Resource Hub'
        ],

        // Other modules...
        [
            'id' => '/new-invoice',
            'label' => 'Create Order',
            'desc' => 'Generate invoices & quotes',
            'category' => 'Sales & Operations'
        ],
        ['id' => '/documents', 'label' => 'Document Vault', 'desc' => 'Secure document storage', 'category' => 'Resource Hub'],
        ['id' => 'manage_documents', 'label' => 'Manage Documents', 'desc' => 'Upload and delete documents', 'category' => 'Resource Hub'],
        ['id' => '/tasks', 'label' => 'Task Board', 'desc' => 'Operational task management', 'category' => 'Team & Tasks'],
        ['id' => 'manage_tasks', 'label' => 'Manage Tasks', 'desc' => 'Create and edit tasks', 'category' => 'Team & Tasks'],
        ['id' => '/memos', 'label' => 'Internal Memos', 'desc' => 'Company-wide communication', 'category' => 'Team & Tasks'],
        ['id' => 'manage_memos', 'label' => 'Manage Memos', 'desc' => 'Post and delete memos', 'category' => 'Team & Tasks'],
        [
            'id' => '/notifications',
            'label' => 'Notifications',
            'desc' => 'System and alert center',
            'category' => 'Team & Tasks'
        ],
        [
            'id' => 'view_users',
            'label' => 'View Personnel',
            'desc' => 'Can see the list of system users',
            'category' => 'Governance'
        ],
        [
            'id' => 'manage_users',
            'label' => 'Manage Personnel',
            'desc' => 'Can create, edit, and reset user accounts',
            'category' => 'Governance'
        ],
        ['id' => '/users', 'label' => 'User Management Page', 'desc' => 'Access to users route', 'category' => 'Governance'],
        [
            'id' => '/audit-logs',
            'label' => 'Security Logs',
            'desc' => 'Audit trails & activity history',
            'category' => 'Governance'
        ],
        [
            'id' => '/system-logs',
            'label' => 'System Diagnostics',
            'desc' => 'View frontend error captures',
            'category' =>
                'Governance'
        ],
        [
            'id' => '/accountability',
            'label' => 'Accountability',
            'desc' => 'System accountability reports',
            'category' =>
                'Governance'
        ],
        [
            'id' => '/system/vitals',
            'label' => 'System Vitals',
            'desc' => 'Diagnostic & Environment info',
            'category' => 'Core Intelligence'
        ],
        [
            'id' => '/system/data',
            'label' => 'Data Core',
            'desc' => 'Backups, Sync & Cleanup',
            'category' => 'Core Intelligence'
        ],
        [
            'id' => '/system/security',
            'label' => 'Security Protocols',
            'desc' => 'Maintenance & Emergency Reset',
            'category' =>
                'Core Intelligence'
        ],
        [
            'id' => '/system/broadcast',
            'label' => 'Command Center',
            'desc' => 'System-wide announcements',
            'category' => 'Core Intelligence'
        ],
        [
            'id' => '/settings/profile',
            'label' => 'My Account',
            'desc' => 'Personal account settings',
            'category' =>
                'Configuration'
        ],
        [
            'id' => '/settings/company',
            'label' => 'Business Identity',
            'desc' => 'Global organization settings',
            'category' =>
                'Configuration'
        ],
        [
            'id' => '/settings/invoice',
            'label' => 'Invoice Engine',
            'desc' => 'PDF & layout configuration',
            'category' =>
                'Configuration'
        ],
        [
            'id' => '/settings/preferences',
            'label' => 'UI Preferences',
            'desc' => 'Personal UI/UX settings',
            'category' =>
                'Configuration'
        ],
        ['id' => '/support', 'label' => 'Help Center', 'desc' => 'Main support dashboard', 'category' => 'Resources & Support'],
        [
            'id' => '/support/guide',
            'label' => 'System Manual',
            'desc' => 'Complete operation guide',
            'category' => 'Resources & Support'
        ],
        [
            'id' => '/tickets',
            'label' => 'Support History',
            'desc' => 'View past support tickets',
            'category' => 'Resources & Support'
        ],
        [
            'id' => '/tickets/new',
            'label' => 'New Ticket Request',
            'desc' => 'Submit new support requests',
            'category' =>
                'Resources & Support'
        ],
    ];
}

/**
 * Helper: Get default role presets
 */
function getRolePresets()
{
    return [
        'admin' => ['/'],
        'ceo' => ['/'],
        'manager' => [
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
            '/settings/preferences',
            'view_stock',
            'manage_stock',
            'view_orders',
            'create_order',
            'manage_invoices',
            'view_clients',
            'manage_clients',
            'view_suppliers',
            'manage_suppliers'
        ],
        'sales' => [
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
            '/settings/preferences',
            'view_stock',
            'view_orders',
            'create_order',
            'manage_invoices',
            'view_clients',
            'manage_clients'
        ],
        'storekeeper' => [
            '/',
            '/stock/inventory',
            '/suppliers',
            '/invoices',
            '/tasks',
            '/memos',
            '/notifications',
            '/support',
            '/settings/profile',
            '/settings/preferences',
            '/tickets',
            'view_stock',
            'manage_stock',
            'view_suppliers',
            'manage_suppliers',
            'view_orders'
        ],
        'accountant' => [
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
            '/settings/preferences',
            '/tickets',
            'view_orders',
            'view_clients',
            'view_stock'
        ],
        'staff' => [
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
            '/settings/preferences',
            '/tickets',
            'view_stock',
            'view_orders',
            'create_order',
            'view_clients',
            'view_suppliers'
        ],
        'viewer' => [
            '/',
            '/invoices',
            '/clients',
            '/settings/profile',
            'view_orders',
            'view_clients',
            'view_stock'
        ],
        'it' => [
            '/',
            '/users',
            '/audit-logs',
            '/settings/profile',
            '/settings/company',
            '/settings/invoice',
            '/settings/preferences',
            '/settings/system',
            '/notifications',
            '/support',
            '/documents',
            '/tickets',
            'view_users',
            'manage_users'
        ]
    ];
}

/**
 * Helper: Get default permissions for a role
 * Used when creating/updating users if specific permissions aren't provided
 */
function getDefaultPermissions($role)
{
    $r = strtolower($role);
    $presets = getRolePresets();

    // Return preset if exists
    if (isset($presets[$r])) {
        return $presets[$r];
    }

    // Default Fallback
    return ['/', '/settings/profile'];
}