# Maintenance Protocol: "The Final Polish"

**Trigger Phrase:** "it's time"

## Purpose
This protocol defines the sequence of actions the AI Agent (Senior Developer) must execute immediately upon receiving the trigger code. It represents the transition from "Active Development" to "Production Readiness/Handover".

## Execution Sequence

### 1. Pre-Deployment Audit & cPanel Prep
*   **Action**: Comprehensive System Scan.
    *   Review all logical flows and file interactions.
    *   Identify hardcoded local paths or development-only configurations.
*   **Action**: cPanel Optimization Strategy.
    *   **Outline**: Generate a `CPANEL_PREP_REPORT.md` listing specific modifications required for the live environment.
    *   **Execute**: Apply necessary file transformations:
        *   Update `api/config.php` to support production credential injection.
        *   Generate production-ready `.htaccess` files for API and Frontend.
        *   Optimize `package.json` and build scripts for cPanel Node.js environment (if applicable) or static hosting.

### 2. The Final Cleanup (Code Hygiene)
*   **Action**: Scan `src` and `public_html` for:
    *   `console.log` / `var_dump` debugging artifacts.
    *   Temporary comments (`// TODO`, `// FIX THIS`).
    *   Unused imports or dead files.
*   **Result**: A pristine, professional codebase with no development debris.

### 2. Documentation Upgrade
*   **Action**: Ensure `README.md` is updated with:
    *   Final installation instructions.
    *   Production deployment credentials (placeholders).
    *   Architecture summary.
*   **Action**: Compile a `CHANGELOG.md` summary of the session's achievements.

### 3. Security Lockdown
*   **Action**:
    *   Run a static analysis on `api/*.php` for SQL injection vulnerabilities.
    *   Verify `config.php` permissions advice is visible.
    *   Set `debug_mode` to `false` in frontend/backend constants.

### 4. Handover Artifacts
*   **Action**: Create a final "Handover_Report.md" summarizing:
    *   System State.
    *   Known limitations (if any).
    *   Future roadmap recommendations.

## Trigger Instructions
When the user types **"it's time"**, the Agent shall:
1.  Acknowledge the command with: *"Initiating Final Production Protocol."*
2.  Execute the above 4 steps sequentially.
3.  Conclude with a final confirmation: *"System shows green across all boards. Ready for deployment."*
