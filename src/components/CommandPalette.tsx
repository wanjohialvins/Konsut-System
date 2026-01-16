import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFileText, FiUsers, FiBox, FiSettings, FiActivity, FiX, FiTruck, FiBarChart2, FiCheckSquare, FiBell, FiHeart, FiShield, FiFilePlus } from 'react-icons/fi';
import { usePermissions } from '../hooks/usePermissions';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { can } = usePermissions();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const actions = [
        // Creation
        { id: 'new-inv', label: 'Create New Invoice', path: '/new-invoice', icon: FiFilePlus, perm: '/' },
        { id: 'new-quote', label: 'Create New Quotation', path: '/new-invoice?type=quotation', icon: FiFileText, perm: '/' },
        { id: 'new-prof', label: 'Create New Proforma', path: '/new-invoice?type=proforma', icon: FiFileText, perm: '/' },

        // Core Modules
        { id: 'clients', label: 'Manage Clients', path: '/clients', icon: FiUsers, perm: '/clients' },
        { id: 'stock', label: 'Check Inventory', path: '/stock/inventory', icon: FiBox, perm: '/stock/inventory' },
        { id: 'suppliers', label: 'Manage Suppliers', path: '/suppliers', icon: FiTruck, perm: '/suppliers' },
        { id: 'analytics', label: 'View Analytics & Reports', path: '/analytics', icon: FiBarChart2, perm: '/analytics' },
        { id: 'tasks', label: 'My Tasks', path: '/tasks', icon: FiCheckSquare, perm: '/tasks' },

        // Admin & System
        { id: 'notifs', label: 'Notifications', path: '/notifications', icon: FiBell, perm: '/notifications' },
        { id: 'users', label: 'Manage Users', path: '/users', icon: FiUsers, perm: '/users' },
        { id: 'audit', label: 'Security Audit Logs', path: '/audit-logs', icon: FiActivity, perm: '/audit-logs' },
        { id: 'health', label: 'System Health Status', path: '/system-health', icon: FiHeart, perm: '/system-health' },
        { id: 'accountability', label: 'Accountability Reports', path: '/accountability', icon: FiShield, perm: '/accountability' },
        { id: 'settings', label: 'System Settings', path: '/settings/system', icon: FiSettings, perm: '/settings/system' },
    ].filter(a => can(a.perm));

    const filteredActions = actions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

            <div className="relative w-full max-w-xl bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-midnight-700 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-midnight-800 flex items-center gap-3">
                    <FiSearch className="text-gray-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-lg font-medium"
                    />
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-full transition-colors">
                        <FiX className="text-gray-400" />
                    </button>
                    <div className="hidden md:block px-2 py-1 bg-gray-100 dark:bg-midnight-800 rounded text-[10px] font-bold text-gray-500 uppercase">ESC</div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredActions.length > 0 ? (
                        filteredActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    navigate(action.path);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-900/20 text-gray-700 dark:text-midnight-text-primary transition-all group hover:translate-x-1"
                            >
                                <div className="p-2.5 bg-gray-100 dark:bg-midnight-800 group-hover:bg-brand-600 group-hover:text-white rounded-xl transition-colors">
                                    <action.icon size={18} />
                                </div>
                                <span className="font-bold flex-1 text-left">{action.label}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="px-2 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-md text-[10px] font-black tracking-widest uppercase">Select</div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <p className="font-medium italic">No matches for "{query}"</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-gray-50 dark:bg-midnight-950 border-t border-gray-100 dark:border-midnight-800 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex gap-4">
                        <span>↑↓ to navigate</span>
                        <span>↵ to select</span>
                    </div>
                    <span>KONSUT OS v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
