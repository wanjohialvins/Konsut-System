<?php
// api/meta.php
require_once 'config.php';

// Check auth (optional - but good for security info)
// requirePermission('view_settings'); // Or public if needed for login context, but usually roles are need after login.

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $permissions = getAllPermissions();
    $roles = getRolePresets();
    $routeMap = getPermissionRouteMap();

    // Fetch public company settings for branding
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'company' LIMIT 1");
    $companyData = $stmt->fetchColumn();
    $company = $companyData ? json_decode($companyData, true) : null;

    sendResponse([
        'permissions' => $permissions,
        'roles' => $roles,
        'routeMap' => $routeMap,
        'company' => $company
    ]);
}
