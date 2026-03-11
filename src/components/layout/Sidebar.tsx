import { NavLink } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { FiFileText, FiUsers, FiPackage, FiBarChart2, FiX, FiShield, FiActivity, FiCheckSquare, FiFolder, FiMessageSquare, FiTruck, FiBriefcase, FiPlus, FiBell, FiSliders, FiGrid, FiSettings, FiLock, FiLifeBuoy, FiAward, FiBook, FiUser, FiTerminal, FiDatabase } from "react-icons/fi";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { api, resolveLogoPath } from "../../services/api";

import logoUrl from "../../assets/logo.jpg";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { user, companyBranding } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const data = await api.admin.getNotificationsCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // console.error(e);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);



  const { can, hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const isCEO = hasRole('ceo');

  const getLinkClasses = (path: string, isActive: boolean) => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden font-medium text-sm";

    if (isActive) {
      const activeBg = "bg-brand-600 dark:bg-brand-600 shadow-lg shadow-brand-900/20";

      return `${baseClasses} ${activeBg} text-white translate-x-1`;
    }

    return `${baseClasses} text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200`;
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 mt-8 mb-2">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</h3>
    </div>
  );

  const sections: SidebarSection[] = useMemo(() => [
    {
      title: "Intelligence",
      items: [
        { path: '/', label: 'Command Center', icon: <FiGrid size={18} />, exact: true },
        { path: '/analytics', label: 'Financial Suite', icon: <FiBarChart2 size={18} /> },
      ]
    },
    {
      title: "Sales & Operations",
      items: [
        { path: '/new-invoice', label: 'Create Document', icon: <FiPlus size={18} /> },
        { path: '/invoices', label: 'Orders & Sales', icon: <FiFileText size={18} /> },
        { path: '/clients', label: 'Clients', icon: <FiUsers size={18} /> },
      ]
    },
    {
      title: "Resource Hub",
      items: [
        { path: '/stock/inventory', label: 'Inventory Control', icon: <FiPackage size={18} /> },
        { path: '/suppliers', label: 'Vendor & Suppliers', icon: <FiTruck size={18} /> },
        { path: '/documents', label: 'Company Doc Vault', icon: <FiFolder size={18} /> },
      ]
    },
    {
      title: "Team & Tasks",
      items: [
        { path: '/tasks', label: 'Team Task Board', icon: <FiCheckSquare size={18} /> },
        { path: '/memos', label: 'Internal Communications', icon: <FiMessageSquare size={18} /> },
        {
          path: '/notifications',
          label: 'Inbound Notifications',
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
        { path: '/audit-logs', label: 'Security Audit Tracker', icon: <FiShield size={18} /> },
        { path: '/admin-toolbox', label: 'Admin Toolbox', icon: <FiTerminal size={18} /> },
        { path: '/accountability', label: 'Accountability Reports', icon: <FiAward size={18} /> },
      ]
    },
    {
      title: "Configuration",
      items: [
        { path: '/settings/profile', label: 'Account Profile', icon: <FiUser size={18} /> },
        { path: '/settings/company', label: 'Company Profile', icon: <FiBriefcase size={18} /> },
        { path: '/settings/invoice', label: 'Invoice Engine', icon: <FiSliders size={18} /> },
        { path: '/settings/preferences', label: 'Interface Experience', icon: <FiSettings size={18} /> },
      ]
    },
    {
      title: "Core Intelligence",
      items: [
        { path: '/system/vitals', label: 'System Vitals', icon: <FiActivity size={18} /> },
        { path: '/system/data', label: 'Data Core', icon: <FiDatabase size={18} /> },
        { path: '/system/security', label: 'Security Protocols', icon: <FiLock size={18} /> },
        { path: '/system/broadcast', label: 'Command Center', icon: <FiMessageSquare size={18} /> },
      ]
    },
    {
      title: "Resources & Support",
      items: [
        { path: '/support', label: 'Help Center', icon: <FiLifeBuoy size={18} />, exact: true },
        { path: '/support/guide', label: 'System Manual', icon: <FiBook size={18} /> },
        { path: '/tickets', label: 'Support History', icon: <FiMessageSquare size={18} /> },
        { path: '/tickets/new', label: 'New Ticket Request', icon: <FiPlus size={18} /> },
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
          : 'sticky top-0 h-screen md:h-[100dvh]'
        }
      `}
    >
      <div className="h-24 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-4 group cursor-pointer w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <img
              src={resolveLogoPath(companyBranding?.logo) || logoUrl}
              alt="Konsut Logo"
              className="h-10 w-10 object-cover rounded-xl shadow-sm relative z-10"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-brand-600 transition-colors">{companyBranding?.name || 'KONSUT LTD'}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Konsut System</span>
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
          const visibleItems = section.items.filter(item => can(item.path));

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
        <div className="flex items-center gap-3" id="user-menu-trigger">
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
