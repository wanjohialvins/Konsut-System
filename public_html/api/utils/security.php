<?php
// backend/utils/security.php

/**
 * Simple File-Based Rate Limiter
 * 
 * @param string $key Identifier (e.g. IP Address)
 * @param int $limit Max requests
 * @param int $windowTimeInSeconds Time window
 * @return bool True if allowed, False if limit exceeded
 */
function checkRateLimit($key, $limit = 60, $windowTimeInSeconds = 60)
{
    // Determine path
    $dir = __DIR__ . '/../../logs/ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    // Hash key for safe filename
    $file = $dir . '/' . md5($key) . '.json';

    // Default state
    $data = ['count' => 0, 'start_time' => time()];

    if (file_exists($file)) {
        $json = @file_get_contents($file);
        if ($json) {
            $data = json_decode($json, true);
        }
    }

    // Reset if window passed
    if (time() - $data['start_time'] > $windowTimeInSeconds) {
        $data['count'] = 0;
        $data['start_time'] = time();
    }

    // Increment
    $data['count']++;

    // Save (using LOCK_EX to prevent race conditions)
    @file_put_contents($file, json_encode($data), LOCK_EX);

    // Check limit
    return $data['count'] <= $limit;
}
