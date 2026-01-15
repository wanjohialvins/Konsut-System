import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiFileText, FiUsers, FiPackage, FiBarChart2, FiX, FiShield, FiActivity, FiCheckSquare, FiFolder, FiMessageSquare, FiTruck, FiBriefcase, FiPlus, FiBell, FiSliders, FiGrid, FiSettings, FiLock, FiLifeBuoy, FiAward, FiBook } from "react-icons/fi";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

import logoUrl from '../assets/logo.jpg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const notifs = await api.admin.getNotifications();
      if (Array.isArray(notifs)) {
        setUnreadCount(notifs.filter((n: { read: boolean | number }) => !n.read).length);
      }
    } catch {
      // console.error(e);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCEO = user?.role === 'ceo';

  // Base permission check - simplistic for now
  const isAllowed = (path: string) => {
    // Admin and CEO can access everything
    if (isAdmin || isCEO) return true;

    // Default staff restrictions (can be expanded based on user.permissions)
    // For now, restrict system control and audit logs
    if (path.includes('audit') || path.includes('system-control')) return false;

    return true;
  };

  const getLinkClasses = (path: string, isActive: boolean) => {
    const allowed = isAllowed(path);
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden font-medium text-sm";

    if (!allowed) {
      return `${baseClasses} opacity-40 cursor-not-allowed grayscale pointer-events-none hidden`; // Hide restricted items for cleanliness
    }

    if (isActive) {
      const activeBg = isAdmin
        ? "bg-gradient-to-r from-red-600 to-red-800 shadow-lg shadow-red-900/30"
        : isCEO
          ? "bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-900/30"
          : "bg-brand-600 dark:bg-brand-600 shadow-lg shadow-brand-900/20";

      return `${baseClasses} ${activeBg} text-white translate-x-1`;
    }

    return `${baseClasses} text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200`;
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 mt-8 mb-2">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</h3>
    </div>
  );

  return (
    <aside
      className={`
        w-72 flex flex-col shadow-2xl z-50 transition-all duration-300 border-r backdrop-blur-xl
        bg-white/95 dark:bg-[#0B1120]/95 border-slate-100 dark:border-slate-800/50
        ${isMobile
          ? `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'sticky top-0 h-screen'
        }
      `}
    >
      <div className="h-24 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-4 group cursor-pointer w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <img
              src={logoUrl}
              alt="Konsut Logo"
              className="h-10 w-10 object-cover rounded-xl shadow-sm relative z-10"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-brand-600 transition-colors">KONSUT LTD</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Invoice System</span>
          </div>
        </div>

        {/* Close button - only visible on mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto text-slate-500"
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-1">

        {/* Intelligence Hub */}
        <SectionHeader title="Intelligence" />
        <nav className="space-y-1">
          <NavLink to="/" end onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/', isActive)}>
            <FiGrid size={18} /> Dashboard
          </NavLink>
          <NavLink to="/analytics" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/analytics', isActive)}>
            <FiBarChart2 size={18} /> Analytics & Reports
          </NavLink>
        </nav>

        {/* Sales & Clients */}
        <SectionHeader title="Sales & Operations" />
        <nav className="space-y-1">
          <NavLink to="/new-invoice" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/new-invoice', isActive)}>
            <FiPlus size={18} /> Create New
          </NavLink>
          <NavLink to="/invoices" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/invoices', isActive)}>
            <FiFileText size={18} /> Invoices & Quotes
          </NavLink>
          <NavLink to="/clients" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/clients', isActive)}>
            <FiUsers size={18} /> Clients CRM
          </NavLink>
        </nav>

        {/* Resource Hub */}
        <SectionHeader title="Inventory & Supply" />
        <nav className="space-y-1">
          <NavLink to="/stock/inventory" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/stock/inventory', isActive)}>
            <FiPackage size={18} /> Product Inventory
          </NavLink>
          <NavLink to="/suppliers" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/suppliers', isActive)}>
            <FiTruck size={18} /> Suppliers
          </NavLink>
          <NavLink to="/documents" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/documents', isActive)}>
            <FiFolder size={18} /> Document Vault
          </NavLink>
        </nav>

        {/* Collaboration */}
        <SectionHeader title="Team & Tasks" />
        <nav className="space-y-1">
          <NavLink to="/tasks" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/tasks', isActive)}>
            <FiCheckSquare size={18} /> Task Board
          </NavLink>
          <NavLink to="/memos" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/memos', isActive)}>
            <FiMessageSquare size={18} /> Internal Memos
          </NavLink>
          <NavLink to="/notifications" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/notifications', isActive)}>
            <div className="relative">
              <FiBell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-midnight-900"></span>}
            </div>
            Notifications
          </NavLink>
        </nav>

        {/* Governance - Admin Only */}
        {(isAdmin || isCEO) && (
          <>
            <SectionHeader title="Governance" />
            <nav className="space-y-1">
              <NavLink to="/users" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/users', isActive)}>
                <FiUsers size={18} /> User Management
              </NavLink>
              <NavLink to="/audit-logs" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/audit-logs', isActive)}>
                <FiShield size={18} /> Audit Logs
              </NavLink>
              <NavLink to="/accountability" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/accountability', isActive)}>
                <FiAward size={18} /> Accountability Reports
              </NavLink>
              <NavLink to="/system-health" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/system-health', isActive)}>
                <FiActivity size={18} /> System Health
              </NavLink>
            </nav>
          </>
        )}

        {/* Configuration */}
        <SectionHeader title="Configuration" />
        <nav className="space-y-1 mb-10">
          <NavLink to="/settings/profile" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/settings/profile', isActive)}>
            <FiBriefcase size={18} /> Company Profile
          </NavLink>
          <NavLink to="/settings/invoice" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/settings/invoice', isActive)}>
            <FiSliders size={18} /> Invoice Engine
          </NavLink>
          <NavLink to="/settings/preferences" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/settings/preferences', isActive)}>
            <FiSettings size={18} /> Preferences
          </NavLink>
          {(isAdmin || isCEO) && (
            <NavLink to="/settings/system" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/settings/system', isActive)}>
              <FiLock size={18} /> System Control
            </NavLink>
          )}
        </nav>

        {/* Support */}
        <SectionHeader title="Resources & Support" />
        <nav className="space-y-1 mb-10">
          <NavLink to="/support" end onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/support', isActive)}>
            <FiLifeBuoy size={18} /> Help Center
          </NavLink>
          <NavLink to="/support/guide" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/support/guide', isActive)}>
            <FiBook size={18} /> System Manual
          </NavLink>
          <NavLink to="/support/contact" onClick={isMobile ? onClose : undefined} className={({ isActive }) => getLinkClasses('/support/contact', isActive)}>
            <FiMessageSquare size={18} /> Contact Support
          </NavLink>
        </nav>

      </div>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold shrink-0">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username || 'Guest'}</span>
            <span className="text-xs text-slate-500 truncate capitalize">{user?.role || 'Viewer'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
