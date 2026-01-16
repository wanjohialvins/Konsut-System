import { NavLink } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { FiFileText, FiUsers, FiPackage, FiBarChart2, FiX, FiShield, FiActivity, FiCheckSquare, FiFolder, FiMessageSquare, FiTruck, FiBriefcase, FiPlus, FiBell, FiSliders, FiGrid, FiSettings, FiLock, FiLifeBuoy, FiAward, FiBook, FiUser } from "react-icons/fi";
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

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isCEO = userRole === 'ceo';

  const isAllowed = (path: string) => {
    // Always allow personal settings
    if (path === '/settings/profile' || path === '/settings/preferences') return true;

    // Admin and CEO bypass
    if (isAdmin || isCEO) return true;

    const role = (user?.role || '').toLowerCase();
    const isNotViewer = role !== 'viewer' && role !== '';

    // Universal access for non-viewers
    const universalPaths = [
      '/stock/inventory', '/suppliers', '/documents',
      '/tasks', '/memos', '/notifications',
      '/support', '/support/guide', '/support/contact'
    ];

    if (isNotViewer && universalPaths.some(p => path === p || path.startsWith(p + '/'))) {
      return true;
    }

    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(path);
    }
    return false;
  };

  const getLinkClasses = (path: string, isActive: boolean) => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden font-medium text-sm";

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

  const sections = useMemo(() => [
    {
      title: "Intelligence",
      items: [
        { path: '/', label: 'Dashboard', icon: <FiGrid size={18} />, exact: true },
        { path: '/analytics', label: 'Analytics & Reports', icon: <FiBarChart2 size={18} /> },
      ]
    },
    {
      title: "Sales & Operations",
      items: [
        { path: '/new-invoice', label: 'Create New', icon: <FiPlus size={18} /> },
        { path: '/invoices', label: 'Invoices & Quotes', icon: <FiFileText size={18} /> },
        { path: '/clients', label: 'Clients CRM', icon: <FiUsers size={18} /> },
      ]
    },
    {
      title: "Resource Hub",
      items: [
        { path: '/stock/inventory', label: 'Product Inventory', icon: <FiPackage size={18} /> },
        { path: '/suppliers', label: 'Suppliers', icon: <FiTruck size={18} /> },
        { path: '/documents', label: 'Document Vault', icon: <FiFolder size={18} /> },
      ]
    },
    {
      title: "Team & Tasks",
      items: [
        { path: '/tasks', label: 'Task Board', icon: <FiCheckSquare size={18} /> },
        { path: '/memos', label: 'Internal Memos', icon: <FiMessageSquare size={18} /> },
        {
          path: '/notifications',
          label: 'Notifications',
          icon: (
            <div className="relative">
              <FiBell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-midnight-900"></span>}
            </div>
          )
        },
      ]
    },
    {
      title: "Governance",
      items: [
        { path: '/users', label: 'User Management', icon: <FiUsers size={18} /> },
        { path: '/audit-logs', label: 'Audit Logs', icon: <FiShield size={18} /> },
        { path: '/accountability', label: 'Accountability Reports', icon: <FiAward size={18} /> },
        { path: '/system-health', label: 'System Health', icon: <FiActivity size={18} /> },
      ]
    },
    {
      title: "Configuration",
      items: [
        { path: '/settings/profile', label: 'My Account', icon: <FiUser size={18} /> },
        { path: '/settings/company', label: 'Business Identity', icon: <FiBriefcase size={18} /> },
        { path: '/settings/invoice', label: 'Invoice Engine', icon: <FiSliders size={18} /> },
        { path: '/settings/preferences', label: 'Preferences', icon: <FiSettings size={18} /> },
        { path: '/settings/system', label: 'System Control', icon: <FiLock size={18} /> },
      ]
    },
    {
      title: "Resources & Support",
      items: [
        { path: '/support', label: 'Help Center', icon: <FiLifeBuoy size={18} />, exact: true },
        { path: '/support/guide', label: 'System Manual', icon: <FiBook size={18} /> },
        { path: '/support/contact', label: 'Contact Support', icon: <FiMessageSquare size={18} /> },
      ]
    }
  ], [unreadCount]);

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
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter(item => isAllowed(item.path));

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="pb-4">
              <SectionHeader title={section.title} />
              <nav className="space-y-1">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) => getLinkClasses(item.path, isActive)}
                  >
                    {item.icon} {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
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
