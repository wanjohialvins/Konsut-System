import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/core/Dashboard";
import NewInvoice from "./pages/sales/NewInvoice";
import Invoices from "./pages/sales/Invoices";
import Clients from "./pages/sales/Clients";
import Analytics from "./pages/sales/Analytics";
import Users from "./pages/core/Users"; // Moved to core subfolder
import AuditLogs from "./pages/system/AuditLogs";
import AdminToolbox from "./pages/system/AdminToolbox";
import Accountability from "./pages/intelligence/Accountability";
import SystemVitals from "./pages/system/SystemVitals";
import SystemData from "./pages/system/SystemData";
import Import from "./pages/system/Import";
import SystemSecurity from "./pages/system/SystemSecurity";
import SystemBroadcast from "./pages/system/SystemBroadcast";
import Tasks from "./pages/office/Tasks";
import Documents from "./pages/office/Documents";
import Memos from "./pages/office/Memos";
import Suppliers from "./pages/inventory/Suppliers";

import HelpCenter from "./pages/support/HelpCenter";
import SystemGuide from "./pages/support/SystemGuide";
import Notifications from "./pages/office/Notifications";

// Ticket System
import Tickets from "./pages/tickets/Tickets";
import CreateTicket from "./pages/tickets/CreateTicket";
import TicketDetails from "./pages/tickets/TicketDetails";

// Granular Stock & Settings
import Inventory from "./pages/inventory/Inventory";
import AddStock from "./pages/inventory/AddStock";
import UserProfile from "./pages/settings/UserProfile";
import CompanyProfile from "./pages/settings/CompanyProfile";
import InvoiceSettings from "./pages/settings/InvoiceSettings";
import Preferences from "./pages/settings/Preferences";
import Maintenance from "./pages/system/Maintenance";
import CommandPalette from "./components/common/CommandPalette";
import GlobalSearch from "./components/common/GlobalSearch";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ModalProvider } from "./contexts/ModalContext";
import { NetworkProvider } from "./contexts/NetworkContext";

import ErrorBoundary from "./components/ui/ErrorBoundary";

import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AccessDenied from "./pages/core/AccessDenied";

/**
 * Main App Component
 * Initializes theme, provides global context (Toast, Error, Auth, Network)
 * and sets up routing for all pages
 */
const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <NetworkProvider>
                <ModalProvider>

                  <CommandPalette />
                  <GlobalSearch />
                  <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/maintenance" element={<Maintenance />} />

                    {/* Protected Routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Dashboard />} />
                      <Route path="new-invoice" element={<NewInvoice />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="clients" element={<Clients />} />

                      {/* Stock Module */}
                      <Route path="stock/inventory" element={<Inventory />} />
                      <Route path="stock/add" element={<AddStock />} />

                      {/* Configuration Module */}
                      <Route path="settings/profile" element={<UserProfile />} />
                      <Route path="settings/company" element={<CompanyProfile />} />
                      <Route path="settings/invoice" element={<InvoiceSettings />} />
                      <Route path="settings/preferences" element={<Preferences />} />

                      <Route path="analytics" element={<Analytics />} />
                      <Route path="users" element={<Users />} />
                      <Route path="audit-logs" element={<AuditLogs />} />
                      <Route path="admin-toolbox" element={<AdminToolbox />} />
                      <Route path="accountability" element={<Accountability />} />

                      {/* Core Intelligence Modules */}
                      <Route path="system/vitals" element={<SystemVitals />} />
                      <Route path="system/data" element={<SystemData />} />
                      <Route path="system/import" element={<Import />} />
                      <Route path="system/security" element={<SystemSecurity />} />
                      <Route path="system/broadcast" element={<SystemBroadcast />} />

                      <Route path="tasks" element={<Tasks />} />
                      <Route path="documents" element={<Documents />} />
                      <Route path="memos" element={<Memos />} />
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="notifications" element={<Notifications />} />

                      {/* Support & Ticket Module */}
                      <Route path="support" element={<HelpCenter />} />
                      <Route path="support/guide" element={<SystemGuide />} />
                      <Route path="tickets" element={<Tickets />} />
                      <Route path="tickets/new" element={<CreateTicket />} />
                      <Route path="tickets/:id" element={<TicketDetails />} />
                    </Route>
                  </Routes>

                </ModalProvider>
              </NetworkProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;


