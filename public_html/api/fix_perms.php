<?php
/**
 * FTP Permission Fixer
 * This script attempts to fix directory and file permissions that might be 
 * causing "553 Permission denied" errors during FTP deployment.
 */

// Basic security - you may want to delete this after use or add a password check
define('AUTHORIZED', true);

if (!AUTHORIZED) {
    die("Unauthorized.");
}

$paths = [
    __DIR__,
    __DIR__ . '/admin',
    __DIR__ . '/admin/config_editor.php',
    __DIR__ . '/config.php'
];

echo "<h1>Permission Fixer</h1>";

foreach ($paths as $path) {
    if (file_exists($path)) {
        $isDir = is_dir($path);
        $targetPerms = $isDir ? 0755 : 0644;

        echo "Checking: " . htmlspecialchars($path) . " ... ";

        if (chmod($path, $targetPerms)) {
            echo "<b style='color:green;'>SUCCESS</b> (Set to " . decoct($targetPerms) . ")<br>";
        } else {
            echo "<b style='color:red;'>FAILED</b> (Current perms: " . substr(sprintf('%o', fileperms($path)), -4) . ")<br>";
            echo "<i>Try fixing this manually in cPanel File Manager.</i><br>";
        }
    } else {
        echo "Path not found: " . htmlspecialchars($path) . "<br>";
    }
}

echo "<p>After running this, try re-running the GitHub Action.</p>";
?>