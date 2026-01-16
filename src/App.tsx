import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewInvoice from "./pages/NewInvoice";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Accountability from "./pages/Accountability";
import SystemHealth from "./pages/SystemHealth";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import Memos from "./pages/Memos";
import Suppliers from "./pages/Suppliers";
import Support from "./pages/Support"; // Keeping legacy ref if needed but prefer new ones
import HelpCenter from "./pages/support/HelpCenter";
import SystemGuide from "./pages/support/SystemGuide";
import ContactSupport from "./pages/support/ContactSupport";
import Notifications from "./pages/Notifications";

// Granular Stock & Settings
import Inventory from "./pages/Inventory";
import AddStock from "./pages/AddStock";
import UserProfile from "./pages/UserProfile";
import CompanyProfile from "./pages/CompanyProfile";
import InvoiceSettings from "./pages/InvoiceSettings";
import Preferences from "./pages/Preferences";
import SystemControl from "./pages/SystemControl";
import Maintenance from "./pages/Maintenance";
import CommandPalette from "./components/CommandPalette";
import GlobalSearch from "./components/GlobalSearch";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ModalProvider } from "./contexts/ModalContext";
import ErrorBoundary from "./components/ErrorBoundary";

import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Main App Component
 * Initializes theme, provides global context (Toast, Error, Auth)
 * and sets up routing for all pages
 */
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <ModalProvider>
              <Router>
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
                    <Route path="settings/system" element={<SystemControl />} />

                    <Route path="analytics" element={<Analytics />} />
                    <Route path="users" element={<Users />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="accountability" element={<Accountability />} />
                    <Route path="system-health" element={<SystemHealth />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="memos" element={<Memos />} />
                    <Route path="suppliers" element={<Suppliers />} />
                    <Route path="notifications" element={<Notifications />} />

                    {/* Support Module */}
                    <Route path="support" element={<HelpCenter />} />
                    <Route path="support/guide" element={<SystemGuide />} />
                    <Route path="support/contact" element={<ContactSupport />} />
                  </Route>
                </Routes>
              </Router>
            </ModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;


