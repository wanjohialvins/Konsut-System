<?php
// api/meta.php
require_once 'config.php';

// Check auth (optional - but good for security info)
// requirePermission('view_settings'); // Or public if needed for login context, but usually roles are need after login.

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $permissions = getAllPermissions();
    $roles = getRolePresets();
    $routeMap = getPermissionRouteMap();

    sendResponse([
        'permissions' => $permissions,
        'roles' => $roles,
        'routeMap' => $routeMap
    ]);
}
