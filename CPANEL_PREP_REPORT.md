# cPanel Preparation Report

## Status Analysis
**Date**: 2026-01-31
**Environment**: Production Preparation

### 1. Database Configuration (`api/config.php`)
*   **Issue**: Hardcoded local credentials (`root`, no password) are present in two places:
    1.  Top-level constants (Lines 19-22).
    2.  Inside `getDbConnection()` function (Lines 54-57).
*   **Risk**: Critical. Uploading this to production will cause immediate database connection failures.
*   **Remediation**: Refactor `getDbConnection` to use the defined constants. Wrap constants in a check to allow for a pre-loaded `production_config.php` or use environment variables.

### 2. Error Handling (`api/config.php`)
*   **Issue**: `display_errors` is set to `1`.
*   **Risk**: Security information leak. Production errors should be logged to a file, not displayed to the user.
*   **Remediation**: Set `display_errors` to `0` for production.

### 3. Server Routing (`.htaccess`)
*   **Issue**: Current `.htaccess` protects sensitive files but lacks the "Catch-All" rewrite rule required for React Single Page Applications (SPA).
*   **Risk**: Refreshing any page other than the homepage (e.g., `yoursite.com/dashboard`) will result in a 404 Not Found error from Apache.
*   **Remediation**: Add standard React/Vite rewrite rules.

### 4. Hardcoded Paths & Debugging
*   **Found**: `src/pages/office/Documents.tsx` (Potential localhost reference).
*   **Found**: `public_html/api/admin/debug_headers.txt` (Log file to be removed).
*   **Remediation**: 
    *   Verify `Documents.tsx`.
    *   Delete debug logs.

## Execution Plan
1.  **Refactor `api/config.php`**: Consolidate database connection logic and add a "Production Mode" switch.
2.  **Update `.htaccess`**: Add SPA routing rules.
3.  **Cleanup**: Remove temporary log files.
