import { FiBell, FiMenu, FiLogOut, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import logoUrl from "../assets/logo.jpg";

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-midnight-900/80 backdrop-blur-md border-b border-gray-100 dark:border-midnight-700 sticky top-0 z-20 px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300">
      {/* Left Section: Menu & Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu for Mobile */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} className="text-gray-700 dark:text-midnight-text-primary icon-hover-scale" />
          </button>
        )}

        {/* Title */}
        <div className="flex items-center gap-3 select-none">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 w-8 rounded-full object-contain bg-white shadow-sm"
          />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-midnight-text-primary">KONSUT</h1>
          <span className="hidden md:inline-block px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-full">
            Enterprise Plan
          </span>
        </div>
      </div>

      {/* Right Section: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Mobile Command Palette Trigger */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors md:hidden"
          aria-label="Search items"
        >
          <FiSearch size={20} className="text-gray-600 dark:text-midnight-text-secondary" />
        </button>

        <Link to="/notifications" className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors relative">
          <FiBell size={20} className="text-gray-600 dark:text-midnight-text-secondary icon-hover-shake icon-pulse-continuous" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-midnight-700">
          <Link to="/settings/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="hidden md:block text-right transition-transform group-hover:-translate-x-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || user?.username || "Guest User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.displayRole || user?.role || "Viewer"}</p>
            </div>
            <UserAvatar user={user} size={36} className="group-hover:ring-4 group-hover:ring-brand-500/10 transition-all" />
          </Link>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-midnight-800 rounded-lg transition-colors ml-1"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
