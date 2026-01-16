# KONSUT System - Professional User Manual

**Version 2.1.0** | **Last Updated**: January 2026

Welcome to the KONSUT System - your comprehensive business management platform. This manual provides complete guidance for all user roles, from basic operations to advanced administration.

---

## 📑 Table of Contents

1. [Getting Started](#1-getting-started)
2. [Understanding Your Role](#2-understanding-your-role)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Invoice & Document Management](#4-invoice--document-management)
5. [Inventory Control](#5-inventory-control)
6. [Client Management](#6-client-management)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [System Administration](#8-system-administration)
9. [Security & Permissions](#9-security--permissions)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### First Login
1. Navigate to your KONSUT instance (e.g., `http://localhost:5173`)
2. Enter your credentials provided by your administrator
3. The system will redirect you to your role-appropriate dashboard

### Interface Overview
- **Sidebar**: Main navigation (collapses on mobile)
- **Topbar**: Search, notifications, and user profile
- **Theme Toggle**: Switch between Light/Dark modes
- **Command Palette**: Press `Ctrl+K` (Windows) or `Cmd+K` (Mac) for quick navigation

### Your First Steps
1. **Update Your Profile**: Go to Settings > My Account
2. **Set Preferences**: Configure your theme and notification settings
3. **Explore Your Dashboard**: Familiarize yourself with available features

---

## 2. Understanding Your Role

KONSUT uses an 8-tier role system. Your role determines what you can see and do.

### Role Capabilities

| Role | Primary Focus | Key Permissions |
|------|---------------|-----------------|
| **Admin** | System management | Full access to all features including user management |
| **CEO** | Strategic oversight | Analytics, reports, all business data |
| **Manager** | Operations | Team management, analytics, inventory, invoices |
| **Sales** | Revenue generation | Create invoices, manage clients, view inventory |
| **Storekeeper** | Inventory | Full inventory control, suppliers, order tracking |
| **Accountant** | Financials | Analytics, invoices, client financial data |
| **Staff** | General operations | Basic invoice and inventory operations |
| **Viewer** | Read-only access | View invoices and client information only |

### Permission Updates
- Changes to your role apply **instantly** - no need to log out
- When permissions change, you'll see features appear/disappear automatically
- If you lose access mid-task, you'll be redirected to an "Access Denied" page

---

## 3. Dashboard Overview

Your dashboard provides a real-time snapshot of business operations.

### Key Metrics (varies by role)
- **Total Revenue**: Sum of all paid invoices
- **Pending Invoices**: Outstanding amounts
- **Stock Value**: Current inventory valuation
- **Active Clients**: Total customer count

### Quick Actions
- **Create Invoice**: Jump directly to document creation
- **View Recent**: Access latest invoices and clients
- **Analytics**: Deep-dive into business metrics

---

## 4. Invoice & Document Management

### Document Types
1. **Quotation**: Price estimate with validity period
2. **Proforma Invoice**: Preliminary bill before delivery
3. **Tax Invoice**: Final invoice with VAT

### Creating an Invoice

#### Step 1: Basic Information
1. Navigate to **New Invoice** from sidebar
2. Select **Document Type** (Quotation/Proforma/Invoice)
3. Choose or create a **Client**:
   - Select from dropdown for existing clients
   - Type new name to create on-the-fly
   - For Tax Invoices, KRA PIN is mandatory

#### Step 2: Adding Items
1. **Select Category**: Products, Services, or Mobilization
2. **Choose Items**: Use search or dropdown
3. **Set Quantity**: Enter amount needed
4. **Review Pricing**: System calculates automatically
   - Subtotal
   - VAT (16% if enabled)
   - Freight (for products)
   - Grand Total

#### Step 3: Finalization
- **Save Draft**: Stores locally for later
- **Save to Cloud**: Persists to database
- **Generate PDF**: Creates professional document
- **Convert**: Transform Quotation → Proforma → Invoice

### Managing Existing Invoices
**Location**: Invoices page

- **Search**: Filter by client name, invoice ID, or status
- **Status Update**: Mark as Paid/Pending/Overdue
- **Actions**:
  - View details
  - Download PDF
  - Edit (if permitted)
  - Delete (Admin only)
  - Duplicate

### PDF Features
Generated PDFs include:
- Company logo and branding
- QR code for verification
- Watermark (for drafts)
- Itemized breakdown
- VAT calculations
- Bank details and payment terms

---

## 5. Inventory Control

**Location**: Stock > Inventory

### Adding Stock Items

#### Manual Entry
1. Click **Add New Item**
2. Fill in details:
   - Name and description
   - Category (Product/Service/Mobilization)
   - Quantity
   - Unit price (KES)
   - Weight (for freight calculation)
3. **Save**

#### Bulk Import
1. Click **Import CSV/Excel**
2. Select your file
3. System auto-parses and adds items
4. Review imported items

### Managing Inventory
- **Edit**: Update quantities, prices, descriptions
- **Delete**: Remove items (with confirmation)
- **Search**: Find items quickly by name or category
- **Filter**: View by category or low stock

### Smart Tools
- **Merge Duplicates**: Consolidate items with identical names
- **Export CSV**: Download inventory for backup
- **Low Stock Alerts**: Items with quantity ≤ 5 are flagged

### Currency Handling
- Prices display in KES by default
- Toggle to USD (conversion rate set in Settings)
- Both currencies sync automatically

---

## 6. Client Management

**Location**: Clients page

### Client Profiles
Each client record includes:
- Name, phone, email, address
- Company name
- KRA PIN (for tax invoices)
- Notes
- Purchase history
- Lifetime value

### Adding Clients

#### Manual Creation
1. Click **Add Client**
2. Fill in contact details
3. **Save**

#### Automatic Creation
- Clients are created automatically when you invoice a new name
- You can edit their details later

### Client Statistics
View for each client:
- **Total Spent**: Lifetime revenue
- **Invoice Count**: Number of transactions
- **Last Purchase**: Most recent order date
- **Status**: Active/Inactive

### Client Actions
- **Edit**: Update contact information
- **View Invoices**: See all transactions
- **Export**: Download client data as CSV
- **Delete**: Remove client (Admin only)

---

## 7. Analytics & Reporting

**Location**: Analytics page

### Available Reports

#### Revenue Analysis
- **Trends**: Line charts showing revenue over time
- **Growth**: Month-over-month comparisons
- **Forecasting**: Predicted revenue based on trends

#### Category Breakdown
- **Sales by Category**: Products vs Services vs Mobilization
- **Top Products**: Best-selling items
- **Stock Value**: Inventory valuation by category

#### Client Insights
- **Top Customers**: Highest revenue contributors
- **Client Lifetime Value**: Total spending per client
- **Purchase Frequency**: Transaction patterns

#### Payment Status
- **Paid vs Pending**: Visual distribution
- **Overdue Tracking**: Late payment monitoring
- **Collection Efficiency**: Payment rate percentage

### Exporting Data
- Click **Export CSV** on any report
- Data downloads in Excel-compatible format
- Includes all visible metrics and filters

---

## 8. System Administration

*Available to Admin and CEO roles only*

### User Management
**Location**: Users page

#### Creating Users
1. Click **Add User**
2. Enter username, email, password
3. **Select Role**: Choose from 8 options
4. **Set Permissions** (optional):
   - Use role presets (recommended)
   - Or customize individual permissions
5. **Save**

#### Managing Users
- **Edit**: Update role or permissions
- **View Activity**: See last login and active status
- **Deactivate**: Disable account without deletion
- **Delete**: Permanently remove user

#### Permission System
- Each role has preset permissions
- Permissions are routes (e.g., `/invoices`, `/analytics`)
- Custom permissions override role presets
- Changes apply instantly to active sessions

### System Settings
**Location**: Settings > System Control

#### Company Profile
- Name, address, phone, email
- KRA PIN
- Logo upload (max 2MB, square/landscape)

#### Invoice Configuration
- Default currency (KES/USD)
- Exchange rate
- VAT toggle (16%)
- Freight rate
- PDF customization:
  - Watermark text
  - Header/footer visibility
  - Barcode inclusion

#### Data Management
- **Backup**: Export all data
- **Restore**: Import previous backup
- **Reset**: Clear all data (irreversible)

### System Health
**Location**: System Health page

Monitor:
- Server status
- Database size
- API response times
- Error logs
- Active users

---

## 9. Security & Permissions

### Session Management
- Sessions refresh automatically every 5 minutes
- Switching browser tabs triggers permission sync
- Inactive sessions expire after 2 hours

### Permission Enforcement
- **Frontend**: Routes are hidden if you lack permission
- **Backend**: Every API request validates your role
- **Live Updates**: Permission changes apply without logout

### Security Best Practices
1. **Use Strong Passwords**: Minimum 8 characters
2. **Don't Share Credentials**: Each user should have their own account
3. **Review Permissions Regularly**: Ensure users have appropriate access
4. **Monitor Activity**: Check audit logs for suspicious behavior

### Access Denied
If you see an "Access Denied" page:
1. Your permissions may have changed
2. Contact your administrator
3. Try refreshing the page
4. Log out and back in if issue persists

---

## 10. Troubleshooting

### Common Issues

#### "No Role" Displayed
- **Cause**: Database role field was empty
- **Solution**: Contact admin to assign you a role

#### Can't See Expected Features
- **Cause**: Insufficient permissions
- **Solution**: Check with admin about your role

#### PDF Not Generating
- **Cause**: Missing company logo or invalid format
- **Solution**: Upload a valid logo in Settings

#### Data Not Saving
- **Cause**: Database connection issue
- **Solution**: Check XAMPP is running, contact IT support

#### White Screen
- **Cause**: JavaScript error
- **Solution**: Hard refresh (Ctrl+F5), clear browser cache

### Getting Help

#### In-App Support
1. Navigate to **Support** page
2. Click **Contact Support**
3. Fill in your issue details
4. Submit ticket

#### Direct Contact
- **Email**: info@konsutltd.co.ke
- **Phone**: +254 700 420 897
- **Hours**: Monday-Friday, 8AM-5PM EAT

---

## Appendix: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `Ctrl+S` / `Cmd+S` | Save current document |
| `Esc` | Close modal/dialog |
| `Ctrl+F` / `Cmd+F` | Focus search bar |

---

**KONSUT Ltd** - Professional Business Management  
*Ruiru, Kenya*

© 2024-2025 KONSUT Ltd. All rights reserved.
