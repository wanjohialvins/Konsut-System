<?php
/**
 * Konsut System - Configuration Template
 * Rename this file to config.php or config.production.php
 */
ob_start();

// =========================================================================
//  ENVIRONMENT SETTINGS (Edit this section for Production)
// =========================================================================

// Set to false for Production
define('DEBUG_MODE', false);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

// Security Keys
define('ENCRYPTION_KEY', 'your_32byte_hex_key'); // Generate with bin2hex(random_bytes(32))
define('ALLOW_EMERGENCY_ACCESS', false);

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
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    if (!is_dir(__DIR__ . '/../logs')) {
        @mkdir(__DIR__ . '/../logs', 0755, true);
    }
    ini_set('error_log', __DIR__ . '/../logs/php_errors.txt');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
}

// =========================================================================
//  FUNCTIONS (Do not edit below this line unless you know what you are doing)
// =========================================================================

function getDbConnection()
{
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        error_log("Database Connection Failed: " . $e->getMessage());
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed.']));
    }
}

function getRequestHeader($name)
{
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if (isset($_SERVER[$key]))
        return $_SERVER[$key];
    if (strtolower($name) === 'authorization') {
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']))
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        if (isset($_SERVER['HTTP_AUTHORIZATION']))
            return $_SERVER['HTTP_AUTHORIZATION'];
    }
    return null;
}

function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function sendError($message, $code = 500)
{
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

// ... Additional core logic (initSession, checkPermission, etc.) should be 
// included here from the live config.php during deployment.
