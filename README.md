# KONSUT System - Enterprise Business Management Platform

![Version](https://img.shields.io/badge/version-2.3.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production-green.svg)

A professional-grade, full-stack business management system built with React 19, TypeScript, and PHP/MariaDB. KONSUT provides comprehensive tools for invoice management, inventory control, client relationship management, and enterprise-level security with role-based access control.

---

## 🎯 Core Capabilities

### 📄 Document Management
- **Multi-Format Invoicing**: Create Quotations, Proforma Invoices, and Tax Invoices
- **Inline Quick Edit**: Edit documents directly from the list view with a modern modal interface (New in v2.3)
- **Professional PDF Generation**: Export documents with company branding, QR codes, and watermarks
- **Smart Conversion**: Convert quotations to invoices with preserved numbering
- **Auto-Save Drafts**: Never lose work with automatic local and cloud persistence
- **Sticky Editor**: Modern, split-pane interface with real-time sticky summary

### 📦 Inventory Control
- **Multi-Category System**: Products, Services, and Mobilization equipment
- **Dual Currency Support**: KES and USD with automatic conversion
- **CSV Import/Export**: Bulk operations for inventory management
- **Low Stock Alerts**: Automatic flagging of items below threshold
- **Smart Merge**: Intelligent duplicate detection and consolidation

### 👥 Client Relationship Management
- **Comprehensive Profiles**: Store contact details, company info, and KRA PINs
- **Purchase History**: Track lifetime value and transaction count
- **Auto-Generation**: Client profiles created automatically from invoices
- **Advanced Search**: Filter by name, phone, email, or PIN
- **Export Capabilities**: CSV export with complete statistics

### 📊 Analytics & Reporting (Enhanced v2.3)
- **Financial Pulse AI**: Real-time intelligence and growth projections
- **Dynamic Date Filtering**: 7-day, 30-day, 90-day, and annual views with live data refresh
- **Glassmorphic UI**: Premium, modern interface with translucent elements
- **Visual Analytics**: Gradient-enhanced charts for revenue and status
- **Category Comparison**: Interactive liquidity breakdown
- **Live Ledger**: Searchable financial transaction history

### 🔐 Enterprise Security & Access Control

#### 8-Tier Role System
1. **Admin** - Full system access, configuration, and user management
2. **CEO** - Business intelligence, analytics, and strategic oversight
3. **Manager** - Operations, team management, and comprehensive reporting
4. **Sales** - Invoice creation, client management, and basic inventory
5. **Storekeeper** - Inventory control, suppliers, and order tracking
6. **Accountant** - Financial analytics, invoices, and client financials
7. **Staff** - General operations and support tasks
8. **Viewer** - Read-only access to invoices and clients

#### Advanced Security Features
- **Live Permission Updates**: Changes apply instantly without re-login
- **Session Management**: Secure refresh with automatic synchronization
- **Granular Permissions**: Fine-tune access at the route level
- **Activity Tracking**: Monitor user actions and last active timestamps
- **Instant Enforcement**: Backend validates permissions on every request

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7 with SWC
- **Styling**: Tailwind CSS 3.4.13
- **Routing**: React Router DOM 7.9.4
- **State Management**: Context API with custom hooks
- **Animations**: Framer Motion 12.24.7
- **Charts**: Recharts 3.2.1
- **PDF Generation**: jsPDF 2.5.2 + jspdf-autotable 5.0.2
- **Icons**: React Icons 5.5.0, Lucide React 0.546.0

### Backend
- **Server**: PHP 8.x with Apache/XAMPP
- **Database**: MariaDB 10.x
- **API**: RESTful architecture with CORS support
- **Security**: Role-based access control with header-based authentication

---

## 📁 Project Structure

```
konsut-system/
├── public_html/
│   └── api/                    # PHP Backend
│       ├── config.php          # Database & RBAC engine
│       ├── users.php           # User management endpoints
│       ├── invoices.php        # Invoice CRUD operations
│       ├── clients.php         # Client management
│       ├── stock.php           # Inventory control
│       ├── suppliers.php       # Supplier management
│       ├── tasks.php           # Task tracking
│       ├── memos.php           # Internal communications
│       ├── notifications.php   # Notification system
│       ├── vault.php           # Document storage
│       └── database.sql        # Schema definition
├── src/
│   ├── components/             # Reusable React components
│   │   ├── Layout.tsx          # Main application layout
│   │   ├── Sidebar.tsx         # Navigation with role filtering
│   │   ├── ProtectedRoute.tsx  # Route-level security
│   │   └── ...
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication & session
│   │   ├── ThemeContext.tsx    # Dark/Light mode
│   │   ├── ToastContext.tsx    # Notifications
│   │   └── ModalContext.tsx    # Modal dialogs
│   ├── pages/                  # Application pages (26 pages)
│   │   ├── Dashboard.tsx       # Main overview
│   │   ├── NewInvoice.tsx      # Document creator
│   │   ├── Invoices.tsx        # Invoice management
│   │   ├── Clients.tsx         # CRM interface
│   │   ├── Inventory.tsx       # Stock control
│   │   ├── Analytics.tsx       # Advanced reporting
│   │   ├── Users.tsx           # User management (Admin)
│   │   ├── SystemHealth.tsx    # Server monitoring
│   │   └── ...
│   ├── services/
│   │   └── api.ts              # Centralized API client
│   ├── types/
│   │   └── types.ts            # TypeScript definitions
│   └── hooks/                  # Custom React hooks
└── docs/                       # Documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18.0+ and npm 9.0+
- **XAMPP** (Apache + MariaDB) or equivalent
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/wanjohialvins/Konsut-System.git
   cd Konsut-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the database**
   - Start XAMPP and ensure Apache + MySQL are running
   - Create database: `invoice_system`
   - Import schema: `public_html/api/database.sql`
   - Update `public_html/api/config.php` with your database credentials

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost/public_html/api`

### Default Login
- **Username**: `eragondevs`
- **Password**: `Drottastar21`
- **Role**: Admin

---

## 📖 Key Features Explained

### Live Permission System
When an admin updates a user's role or permissions:
1. Changes are saved to the database immediately
2. The affected user's session refreshes automatically on:
   - Window focus (switching back to the tab)
   - Every 5 minutes (background sync)
   - Any 403 Forbidden response from the API
3. The UI updates instantly to show/hide restricted features

### Database Schema Highlights
- **Consolidated Schema**: All table definitions in single `database.sql` file for easy deployment
- **Users Table**: Stores roles as `VARCHAR(50)` to support all 8 role types
- **Permissions**: JSON array of allowed routes per user
- **Activity Tracking**: `last_active` timestamp updated on every request
- **Invoice Items**: Separate table for cloud sync compatibility
- **Document Vault**: Encrypted storage with user tracking and initialization vectors

### PDF Generation
- Company logo and branding
- QR codes for invoice verification
- Watermarks for draft documents
- Customizable headers and footers
- VAT calculations (16%)
- Bank details and payment terms

---

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server with host access
npm run build    # TypeScript compilation + Vite production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Environment Configuration
Update `src/services/api.ts` to change the API base URL:
```typescript
const API_BASE_URL = 'http://localhost/public_html/api';
```

---

## 📝 Documentation

- **[USER_MANUAL.md](USER_MANUAL.md)** - Comprehensive operator guide
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Developer reference
- **[CORE_PRINCIPLES.md](CORE_PRINCIPLES.md)** - Architecture philosophy

---

## 🔒 Security Notes

- All API endpoints validate permissions via `config.php`
- User sessions include `X-User-Id`, `X-User-Role`, and `X-User-Permissions` headers
- Admin and CEO roles bypass granular permission checks
- Debug logs are excluded from version control (`.gitignore`)
- Database credentials should never be committed

---

## 📊 System Requirements

### Production
- **Server**: Apache 2.4+ with PHP 8.0+
- **Database**: MariaDB 10.5+ or MySQL 8.0+
- **Storage**: 500MB minimum
- **RAM**: 2GB minimum

### Development
- **Node.js**: 18.0+
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+

---

## 🤝 Support

**KONSUT Ltd**  
Ruiru, Kenya

- **Email**: info@konsutltd.co.ke
- **Phone**: +254 700 420 897
- **Website**: [konsutltd.co.ke](https://konsutltd.co.ke)

---

## 📜 License

Proprietary software © 2024-2025 KONSUT Ltd. All rights reserved.

---

**Version**: 2.3.0  
**Last Updated**: January 31, 2026  
**Maintained by**: KONSUT Development Team
