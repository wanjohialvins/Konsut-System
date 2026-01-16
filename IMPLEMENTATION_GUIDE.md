# KONSUT System - Implementation Guide

**For Developers** | **Version 2.1.0**

This guide provides technical details for developers working on the KONSUT System codebase.

---

## 🏗️ Architecture Overview

### System Design
- **Frontend**: Single Page Application (SPA) built with React 19
- **Backend**: RESTful API built with PHP 8.x
- **Database**: MariaDB with normalized schema
- **Authentication**: Header-based with role validation
- **State Management**: React Context API

### Request Flow
```
User Action → React Component → API Service → PHP Endpoint → Database
                                      ↓
                                 Permission Check (config.php)
                                      ↓
                                 Response → State Update → UI Render
```

---

## 📂 Codebase Structure

### Frontend (`/src`)

#### Components (`/src/components`)
- **Layout.tsx**: Main application wrapper with sidebar and topbar
- **Sidebar.tsx**: Navigation with role-based filtering
- **ProtectedRoute.tsx**: Route-level permission enforcement
- **UserAvatar.tsx**: User profile display component
- **ErrorBoundary.tsx**: Global error handling

#### Contexts (`/src/contexts`)
- **AuthContext.tsx**: User session, login/logout, permission refresh
- **ThemeContext.tsx**: Dark/Light mode management
- **ToastContext.tsx**: Notification system
- **ModalContext.tsx**: Confirmation dialogs

#### Pages (`/src/pages`)
All 26 application pages including:
- Dashboard, Analytics, Invoices, Clients
- Inventory, Suppliers, Documents
- Users, Tasks, Memos, Notifications
- Settings (Profile, Company, Invoice, Preferences, System)
- Support (Help Center, Guide, Contact)

#### Services (`/src/services`)
- **api.ts**: Centralized API client with:
  - Request interceptor (adds auth headers)
  - Response interceptor (handles 403 errors)
  - Typed endpoints for all resources

### Backend (`/public_html/api`)

#### Core Files
- **config.php**: Database connection, RBAC engine, permission mapping
- **database.sql**: Complete schema with all tables

#### API Endpoints
Each endpoint follows RESTful conventions:
- `users.php`: User CRUD + `get_self` for session refresh
- `invoices.php`: Invoice management + item handling
- `clients.php`: Client CRUD operations
- `stock.php`: Inventory control
- `suppliers.php`: Supplier management
- `tasks.php`: Task tracking
- `memos.php`: Internal communications
- `notifications.php`: Notification system
- `vault.php`: Document storage
- `settings.php`: Configuration management

---

## 🔐 Security Implementation

### Permission System

#### Backend (`config.php`)
```php
function checkPermission($action) {
    // 1. Get user ID from X-User-Id header
    // 2. Fetch latest role & permissions from database
    // 3. Admin/CEO bypass all checks
    // 4. Map action to required routes via $permissionMap
    // 5. Check if user has ANY required route
    // 6. Return true/false
}
```

#### Frontend (`ProtectedRoute.tsx`)
```typescript
// 1. Check if user is authenticated
// 2. Admin/CEO bypass permission checks
// 3. Check if current route is in user.permissions array
// 4. Redirect to AccessDenied if unauthorized
```

### Session Management (`AuthContext.tsx`)
- Stores user data in localStorage
- Refreshes permissions on:
  - Window focus event
  - Every 5 minutes (setInterval)
  - 403 response from API (custom event)
- Uses `api.users.getSelf()` to fetch latest user data

### API Request Headers
```typescript
{
  'X-User-Id': user.id,
  'X-User-Role': user.role,
  'X-User-Permissions': JSON.stringify(user.permissions)
}
```

---

## 💾 Database Schema

### Key Tables

#### `users`
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(50) DEFAULT 'staff',  -- Changed from ENUM to VARCHAR
    permissions JSON,
    last_login TIMESTAMP,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `documents` (Invoices)
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('invoice', 'quotation', 'proforma'),
    client_id VARCHAR(50),
    client_name VARCHAR(255),
    subtotal DECIMAL(15,2),
    vat DECIMAL(15,2),
    total DECIMAL(15,2),
    status ENUM('paid', 'pending', 'overdue'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `document_items`
```sql
CREATE TABLE document_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(50),
    product_id VARCHAR(50),
    name VARCHAR(255),
    quantity INT,
    unitPrice DECIMAL(15,2),
    total DECIMAL(15,2),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

---

## 🛠️ Development Workflow

### Setting Up Development Environment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API URL**
   Update `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://localhost/public_html/api';
   ```

3. **Start XAMPP**
   - Ensure Apache and MySQL are running
   - Database `invoice_system` exists
   - Schema is imported

4. **Run development server**
   ```bash
   npm run dev
   ```

### Adding a New Feature

#### 1. Create Backend Endpoint
```php
// public_html/api/myfeature.php
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'GET':
        requirePermission('view_myfeature');
        // Implementation
        break;
    case 'POST':
        requirePermission('manage_myfeature');
        // Implementation
        break;
}
```

#### 2. Add Permission Mapping
In `config.php`:
```php
$permissionMap = [
    // ...existing mappings
    'view_myfeature' => ['/myfeature'],
    'manage_myfeature' => ['/myfeature'],
];
```

#### 3. Create Frontend Page
```typescript
// src/pages/MyFeature.tsx
import React from 'react';

const MyFeature = () => {
    // Implementation
    return <div>My Feature</div>;
};

export default MyFeature;
```

#### 4. Add Route
In `src/App.tsx`:
```typescript
<Route path="myfeature" element={<MyFeature />} />
```

#### 5. Add to Sidebar
In `src/components/Sidebar.tsx`:
```typescript
{
    title: "My Category",
    items: [
        { path: '/myfeature', label: 'My Feature', icon: <FiIcon /> }
    ]
}
```

#### 6. Update Permissions
In `src/pages/Users.tsx` and `public_html/api/config.php`:
- Add `/myfeature` to `ALL_PERMISSIONS`
- Add to relevant `ROLE_PRESETS`
- Add to `getDefaultPermissions()`

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Test with each of the 8 roles
- [ ] Verify permission enforcement (frontend + backend)
- [ ] Test live permission updates
- [ ] Check mobile responsiveness
- [ ] Validate PDF generation
- [ ] Test CSV import/export

### Common Test Scenarios
1. **Permission Changes**: Update user role, verify instant UI update
2. **Session Refresh**: Switch tabs, verify permission sync
3. **403 Handling**: Revoke access, verify redirect to AccessDenied
4. **Data Persistence**: Create/edit/delete, verify database changes

---

## 🚀 Deployment

### Production Build
```bash
npm run build
```
Output: `dist/` directory

### Deployment Steps
1. Build frontend: `npm run build`
2. Copy `dist/` contents to server
3. Ensure `public_html/api/` is accessible
4. Update `config.php` with production database credentials
5. Set proper file permissions (755 for directories, 644 for files)
6. Configure Apache virtual host
7. Enable HTTPS (recommended)

### Environment Variables
Update in production:
- Database credentials (`config.php`)
- API base URL (`api.ts`)
- CORS allowed origins (`config.php`)

---

## 📊 Performance Optimization

### Frontend
- Lazy load routes with `React.lazy()`
- Memoize expensive computations with `useMemo()`
- Debounce search inputs
- Virtualize long lists

### Backend
- Use prepared statements (already implemented)
- Index frequently queried columns
- Cache permission checks (consider Redis)
- Optimize JOIN queries

### Database
- Regular VACUUM/OPTIMIZE TABLE
- Monitor slow query log
- Add indexes on foreign keys

---

## 🐛 Debugging

### Frontend Debugging
```typescript
// Enable debug mode in api.ts
const DEBUG = true;
if (DEBUG) console.log('API Request:', endpoint, options);
```

### Backend Debugging
```php
// Check debug_auth.txt for permission logs
// Check php_errors.txt for PHP errors
```

### Common Issues
- **403 Errors**: Check permission mapping in `config.php`
- **Empty Responses**: Verify database connection
- **CORS Errors**: Check headers in `config.php`

---

## 📝 Code Style

### TypeScript
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript types (avoid `any`)
- Follow React naming conventions

### PHP
- Use PSR-12 coding standard
- Always use prepared statements
- Validate all inputs
- Return JSON responses

---

## 🔄 Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes

### Commit Messages
```
feat: add new analytics chart
fix: resolve permission check bug
docs: update README with new features
chore: update dependencies
```

---

## 📚 Additional Resources

- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **PHP Manual**: https://www.php.net/manual
- **MariaDB Docs**: https://mariadb.com/kb

---

**KONSUT Development Team**  
For technical support: dev@konsutltd.co.ke
