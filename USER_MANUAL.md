# 📖 KONSUT System - Professional User Manual

Welcome to the **KONSUT Invoice System**, a professional-grade business management suite designed for high-performance teams. This manual provides exhaustive details on every module, ensuring you can leverage the full power of the system.

*(System Version 2.0.1)*

---

## 📑 Table of Contents
1.  [Getting Started](#1-getting-started)
2.  [The Dashboard](#2-the-dashboard)
3.  [Invoicing & Documents](#3-invoicing--documents)
4.  [Inventory Management](#4-inventory-management)
5.  [Client Relationship Management (CRM)](#5-client-relationship-management-crm)
6.  [System Configuration](#6-system-configuration)
7.  [Admin & Data Security](#7-admin--data-security)
8.  [Troubleshooting](#8-troubleshooting)

---

## 1. Getting Started
### Accessing the System
-   **URL**: Navigate to your deployed instance (e.g., `localhost` or `your-domain.com`).
-   **Login**: Use your administrative credentials.
-   **First Run**:
    1.  Go to **Settings > Company Profile**.
    2.  The system will auto-populate defaults (KONSUT LTD). Verify your **PIN**, **Address**, and **Logo**.
    3.  Click **Synchronize Identity** to save.

### The Interface
-   **Sidebar**: Your main navigation hub. On mobile, this collapses into a bottom or side drawer.
-   **Dark Mode**: The system features a "Midnight" dark theme which activates automatically based on your OS settings or can be toggled manually.
-   **Command Palette**: Press `Ctrl + K` (or `Cmd + K`) anywhere to open the global search/command tool.

---

## 2. The Dashboard
Your command center provides a real-time snapshot of business health:
-   **KPI Cards**:
    -   **Total Revenue**: Aggregated sum of all paid invoices.
    -   **Pending Invoices**: Value of work billed but not yet collected.
    -   **Active Projects**: Count of ongoing engagements.
-   **Visual Analytics**:
    -   *Revenue Trends*: Line graph showing income over the last 6 months.
    -   *Category Distribution*: Pie chart breaking down income by Products vs. Services.

---

## 3. Invoicing & Documents
The core engine of the KONSUT system. The document editor (`/new-invoice`) acts as a unified interface for three document types: **Quotations**, **Proforma Invoices**, and **Tax Invoices**.

### Workflow: Creation to Payment
1.  **Drafting**:
    -   Select **Document Type** (Invoice, Quotation, Proforma).
    -   **Client**: Select an existing client from the dropdown or type a new name. *Note: For Tax Invoices, a valid KRA PIN fits is mandatory.*
    -   **Items**: Add items from **Products**, **Services**, or **Mobilization** categories.
        -   *Search*: Use the search bar to find inventory items instantly.
        -   *Math*: VAT (16%) is calculated automatically if enabled in Settings.
2.  **Saving**:
    -   The system **auto-saves** your draft to your local device every few seconds.
    -   Click **Save to Cloud** to persist the document to the database.
3.  **Conversion**:
    -   A **Quotation** can be converted to a **Proforma** or **Invoice** with one click.
    -   *Smart ID*: converting `QUO-001` automatically generates `INV-001` (preserving the sequence number).
4.  **PDF Generation**:
    -   Click the **PDF Icon** to generate a high-resolution print-ready file.
    -   The PDF includes your Logo, Watermark (if draft), QR Code, and Bank Details.

### Advanced Features
-   **Currency Toggle**: Switch the entire view between **KES** and **USD**. The exchange rate is managed in Settings.
-   **Client Responsibilities**: Toggle this section to include legal disclaimers about site access, permits, etc.
-   **Terms & Conditions**: Auto-filled from global settings but editable per-invoice.

---

## 4. Inventory Management
Manage your assets with precision in the **Inventory Control** module (`/stock/inventory`).

### Categories
-   **Products**: Physical goods. Tracks quantity and unit price.
-   **Mobilization**: Logistics, transport, and setup fees.
-   **Services**: Labor, consultancy, and intangible hours.

### Smart Tools
Found in the "Smart Tools" menu:
-   **Merge Duplicates**: Scans your inventory for items with identical names (case-insensitive) and merges them into a single entry, summing their quantities.
-   **Wipe Inventory**: A dangerous tool to clear all data (Admin only).
-   **Export CSV**: Download your stock list for Excel/Backup.

### Low Stock Alerts
-   Items with quantity **5 or less** are flagged.
-   Click the **Low Stock** filter button to see only these critical items.

---

## 5. Client Relationship Management (CRM)
Located at `/clients`, this module builds a profile for every customer you interact with.

-   **Automatic Capture**: When you create an invoice for a new name, a Client Profile is created automatically.
-   **Spending History**: View "Lifetime Value" for each client.
-   **Search**: Filter clients by Name, Phone, or KRA PIN.

---

## 6. System Configuration
Customize the logic of your system at `/settings/system`.

1.  **Company Profile**: Legal entity details appearing on PDFs.
2.  **Invoice Settings**:
    -   **Global VAT**: Toggle 16% tax on/off.
    -   **Exchange Rate**: Set the USD/KES rate (Default: 130).
    -   **Bank Details**: Text area for your payment instructions (M-Pesa, Bank Account).
3.  **System Health**: View server status, database size, and error logs (`/system-health`).

---

## 7. Admin & Data Security
### Data Persistence
-   All core data (Invoices, Clients, Stock) is stored in a **MariaDB Database**.
-   Drafts and UI preferences are stored in **Browser LocalStorage**.

### Document Vault
-   Upload sensitive files (contracts, LPOs) to the secure vault (`/documents`).
-   Files are renamed with a unique hash to prevent overwriting.

### Support & Tasks
-   Use the **Support** section to file tickets.
-   These tickets become actionable items in the **Tasks** module for Admins to track.

---

## 8. Troubleshooting
-   **White Screen?** This usually means a React Error. Check the console (F12) or try a hard refresh (Ctrl+F5).
-   **PDF Layout Issues**: Ensure your Company Logo is a square or landscape image under 2MB.
-   **Missing Data**: If you switched browsers, your "Drafts" won't transfer (they are local), but saved Invoices (Cloud) will appear.

---

*© 2024 KONSUT LTD. Proprietary Software.*
