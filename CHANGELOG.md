# Changelog

All notable changes to this project will be documented in this file.

## [2.4.1] - 2026-02-06 - Phase 1.1: System-wide UX Roll-out and Backend Integration

### Added
- **System-wide UX Improvements**: Integrated auto-save, visual status indicators, and offline detection into Clients, Stock, and Suppliers modules.
- **Improved Data Consistency**: Applied phone and KRA PIN input masking system-wide.
- **Keyboard-First Navigation**: Added "Enter" key support for faster inventory and client management.
- **Backend Core Update**: Added missing `company` field support to the `clients` table and APIs.
- **Data Core Migration**: Added `migrate_clients.php` to synchronize database schema with frontend requirements.

## [2.4.0] - 2026-02-06 - System Audit & Security Hardening

### Added
- **Force Logout Logic**: Added missing `force_refresh` column to `users` table to support real-time session invalidation.
- **Admin Security**: Hardened the SQL Console with read-only enforcement and jailed the File Manager to the `uploads/` directory.
- **Improved Feedback**: Added granular toast notifications to the Auth Debugger and Security Protocols for better administrative UX.

### Fixed
- **Data Core (Merge)**: Patched `cleanup_duplicates.php` to re-link documents/items before deleting primary records, preventing data loss.
- **Auth Debugger**: Resolved property naming mismatch (`debug_info` vs `debugInfo`) through the API camelCase layer and added robust error handling.
- **Global Logout**: Standardized the kill-switch mechanism to both flag users and immediately purge `auth_tokens`.
- **API Resilience**: Wrapped sensitive admin endpoints in `try/catch` blocks to prevent JSON parsing errors on frontend.

### Changed
- **Repository Cleanup**: Removed legacy reports (`CPANEL_DEPLOYMENT.md`, `Handover_Report.md`) and re-ignored `.sql` files to keep the repo lean.

## [2.3.1] - 2026-01-31 - Production Release Candidate

### Added
- **Production Configuration**: Introduced `DEBUG_MODE` in `api/config.php` to toggle error reporting and logging.
- **Environment Overrides**: Added support for `config.production.php` for server-specific credentials.
- **SPA Routing**: Added `.htaccess` rewrite rules to support React Router in production subdirectories.
- **Deployment Guide**: Added `CPANEL_DEPLOYMENT.md` with detailed instructions for cPanel & GitHub Actions.

### Changed
- **Database Connection**: Hardcoded localhost credentials replaced with environment-aware configuration.
- **Error Handling**: `display_errors` disabled in production; errors now logged to `../logs/php_errors.txt`.
- **API Base URL**: `Documents.tsx` updated to use dynamic `API_BASE_URL` constant instead of hardcoded localhost path.
- **Code Cleanup**: Removed all `console.log` debugging artifacts from `backupManager.ts`, `api.ts`, `Invoices.tsx`, and `main.tsx`.

### Removed
- **Debug Files**: Deleted `public_html/api/admin/debug_headers.txt`.
- **Dev Comments**: Cleaned up various `TODO` and `// FIX` comments in source code.

## [2.3.0] - 2026-01-31

### Added
- **Analytics & Reporting**: Financial Pulse AI, Dynamic Date Filtering, and Category Comparison.
- **Design Overhaul**: Glassmorphic UI and Gradient-enhanced charts.
- **Inline Quick Edit**: Modern modal interface for document editing.

### Fixed
- **Invoice Saving**: Resolved 403 Forbidden errors and `created_by` column missing issues.
- **PDF Generation**: Fixed company logo display and layout engine issues.

## [2.2.0] - 2026-01-23

### Changed
- **Multi-User**: Overhauled role-based access control and session management.
- **Onboarding**: Removed legacy onboarding feature.
