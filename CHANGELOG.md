# Changelog

All notable changes to this project will be documented in this file.

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
