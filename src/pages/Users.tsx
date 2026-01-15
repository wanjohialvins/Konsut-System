import React, { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiTrash2, FiShield, FiUser, FiActivity, FiKey, FiMail, FiEdit2, FiX, FiCheckCircle, FiPlus } from "react-icons/fi";
import { useModal } from "../contexts/ModalContext";
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';

import type { User } from "../types/types";

const Users = () => {
    const { showConfirm } = useModal();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        role: 'staff',
        permissions: [] as string[]
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [revealedPassword, setRevealedPassword] = useState<string | null>(null); // New state for modal

    const handleResetPassword = async (id: number) => {
        const confirmed = await showConfirm('Override this user\'s password? This action will be logged and alerted to the CEO.');
        if (!confirmed) return;

        try {
            const res = await api.users.resetPassword(id.toString());
            if (res.success) {
                setRevealedPassword(res.newPassword);
                showMessage('success', 'Password reset successfully');
            }
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to reset password');
        }
    };

    const ALL_PERMISSIONS = [
        { id: '/', label: 'Overview', desc: 'Main business dashboard' },
        { id: '/new-invoice', label: 'Create Order', desc: 'Generate invoices & quotes' },
        { id: '/invoices', label: 'Order History', desc: 'View and manage all documents' },
        { id: '/clients', label: 'Client Base', desc: 'Manage customer records' },
        { id: '/stock/inventory', label: 'Inventory', desc: 'View and manage stock items' },
        { id: '/stock/add', label: 'Add Stock', desc: 'Initialize new resources' },
        { id: '/analytics', label: 'Financials', desc: 'Revenue & accounting reports' },
        { id: '/audit-logs', label: 'Security Logs', desc: 'Audit trails & activity history' },
        { id: '/system-health', label: 'Server Health', desc: 'System monitoring (Admin Only)' },
        { id: '/settings/profile', label: 'Company Profile', desc: 'Business identity settings' },
        { id: '/settings/invoice', label: 'Invoice Engine', desc: 'PDF & layout configuration' },
        { id: '/settings/preferences', label: 'Preferences', desc: 'User UI/UX settings' },
        { id: '/settings/system', label: 'System Control', desc: 'Administrative state management' },
        { id: '/users', label: 'User Control', desc: 'Manage accounts & permissions' },
        { id: '/support', label: 'Support Center', desc: 'Access Help Center & Manuals' },
    ];

    const ROLE_PRESETS: Record<string, string[]> = {
        admin: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory', '/stock/add', '/analytics', '/audit-logs', '/system-health', '/settings/profile', '/settings/invoice', '/settings/preferences', '/settings/system', '/users', '/support'],
        ceo: ['/', '/invoices', '/clients', '/analytics', '/audit-logs', '/settings/profile', '/settings/preferences', '/support'],
        manager: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory', '/stock/add', '/analytics', '/support'],
        sales: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory', '/support'],
        storekeeper: ['/', '/stock/inventory', '/stock/add', '/invoices'],
        accountant: ['/', '/invoices', '/analytics', '/settings/invoice', '/support'],
        staff: ['/', '/new-invoice', '/invoices', '/clients', '/support'],
        viewer: ['/', '/invoices', '/clients', '/support'],
    };

    const showMessage = useCallback((type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.users.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
            showMessage('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const resetForm = () => {
        setFormData({ username: '', password: '', email: '', role: 'staff', permissions: ROLE_PRESETS['staff'] });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (user: User) => {
        let perms = [];
        try {
            perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || []);
        } catch (e) {
            perms = [];
        }

        setFormData({
            username: user.username,
            password: '', // Don't show old password
            email: user.email || '',
            role: user.role,
            permissions: perms
        });
        setEditingId(user.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const togglePermission = (permId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    const applyPreset = (role: string) => {
        setFormData(prev => ({
            ...prev,
            role,
            permissions: ROLE_PRESETS[role] || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingId) {
                await api.users.update({ ...formData, id: editingId } as any);
                showMessage('success', 'User updated successfully');
            } else {
                await api.users.create(formData as any);
                showMessage('success', 'User created successfully');
            }
            setShowModal(false);
            resetForm();
            loadUsers();
        } catch (error: any) {
            showMessage('error', error.message || 'Action failed');
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm('Are you sure you want to delete this user?');
        if (!confirmed) return;
        try {
            await api.users.delete(id.toString());
            showMessage('success', 'User deleted');
            loadUsers();
        } catch (error: any) {
            showMessage('error', error.message || 'Failed to delete user');
        }
    };

    if (loading && users.length === 0) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Create and manage access for your team</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-95"
                >
                    <FiPlus size={20} />
                    <span className="font-semibold">Add User</span>
                </button>
            </div>

            {message && (
                <div className={`p - 4 rounded - xl flex items - center gap - 3 animate -in slide -in -from - top duration - 300 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'} `}>
                    <FiCheckCircle />
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="bg-white dark:bg-midnight-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-midnight-700">
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-midnight-800/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-100 dark:border-midnight-800">
                                <th className="p-5">System Identity</th>
                                <th className="p-5 text-center">Security Role</th>
                                <th className="p-5 text-center">Status</th>
                                <th className="p-5 text-center">History</th>
                                <th className="p-5 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-midnight-800/50">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-midnight-800/20 transition-all group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <UserAvatar user={u as any} size={48} className="rounded-2xl" />
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-base">{u.username}</div>
                                                <div className="text-gray-500 dark:text-gray-400 font-medium">{u.email || 'No secondary contact'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`px - 3 py - 1.5 rounded - xl font - bold border
                      ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' :
                                                u.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                                                    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-midnight-800 dark:text-midnight-text-secondary dark:border-midnight-700'
                                            } `}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`w - 2 h - 2 rounded - full shadow - sm ${u.is_active ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300'} `}></span>
                                            <span className={`font - bold ${u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} `}>
                                                {u.is_active ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-900 dark:text-white font-bold">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'New Account'}</span>
                                            {u.last_login && <span className="text-[10px] text-gray-400 uppercase font-black">{new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleResetPassword(u.id)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-midnight-800 rounded-lg transition-all"
                                                title="Reset & Reveal Password"
                                            >
                                                <FiKey size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-midnight-800 rounded-lg transition-all"
                                                title="Edit User"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                disabled={u.username === currentUser?.username}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-midnight-800 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                                title="Delete User"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Reveal Modal */}
            {revealedPassword && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRevealedPassword(null)}></div>
                    <div className="relative bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 dark:border-midnight-800 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center">
                            <FiKey size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Security Alert</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                The password has been reset. This is the <strong>ONLY</strong> time you will see this credentials.
                                <br />An alert has been sent to the CEO.
                            </p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-midnight-950 rounded-xl border border-gray-200 dark:border-midnight-800">
                            <code className="text-2xl font-mono font-black text-brand-600 dark:text-brand-400 tracking-wider select-all">
                                {revealedPassword}
                            </code>
                        </div>
                        <button
                            onClick={() => setRevealedPassword(null)}
                            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold transition-all hover:opacity-90"
                        >
                            I have copied it
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-midnight-800 animate-modal-enter">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-white/50 dark:bg-midnight-900/50 backdrop-blur-xl z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{isEditing ? 'Modify Access' : 'New User'}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mt-1">{isEditing ? 'Update security privileges' : 'Onboard a new team member'}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-midnight-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    {/* Identity Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-midnight-800">
                                            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600">
                                                <FiUser size={18} />
                                            </div>
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Identity & Credentials</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Username</label>
                                                <input
                                                    type="text"
                                                    required
                                                    readOnly={isEditing}
                                                    placeholder="e.g. jdoe"
                                                    className={`w-full px-5 py-4 rounded-xl border bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm
                                                        ${isEditing ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-midnight-800' : 'border-gray-200 dark:border-midnight-800'}`}
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    placeholder="john@konsut.com"
                                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-midnight-800 bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Password</label>
                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        required={!isEditing}
                                                        placeholder={isEditing ? "•••••••••••• (Unchanged)" : "Create a strong password"}
                                                        className="w-full px-5 py-4 pl-12 rounded-xl border border-gray-200 dark:border-midnight-800 bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm"
                                                        value={formData.password}
                                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    />
                                                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2 ml-1">Must be at least 8 characters long.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-midnight-800">
                                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                                <FiShield size={18} />
                                            </div>
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Access Control</h4>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Role Presets</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {['admin', 'ceo', 'manager', 'sales', 'storekeeper', 'accountant', 'staff', 'viewer'].map((role) => (
                                                    <button
                                                        type="button"
                                                        key={role}
                                                        onClick={() => applyPreset(role)}
                                                        className={`px-3 py-3 rounded-xl text-xs font-bold capitalize border transition-all flex flex-col items-center justify-center gap-2 group
                                                            ${formData.role === role
                                                                ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30 transform scale-[1.02]'
                                                                : 'bg-white dark:bg-midnight-950 border-gray-200 dark:border-midnight-800 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-900/10'
                                                            }`}
                                                    >
                                                        {role}
                                                        {formData.role === role && <FiCheckCircle size={14} className="text-white/90" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Permissions (Collapsible or just listed nicely) */}
                                    <div className="bg-gray-50 dark:bg-midnight-950/50 rounded-2xl p-6 border border-gray-100 dark:border-midnight-800">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Granted Permissions</label>
                                        <div className="flex flex-wrap gap-2">
                                            {ALL_PERMISSIONS.map((perm) => (
                                                <label
                                                    key={perm.id}
                                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all border
                                                        ${formData.permissions.includes(perm.id)
                                                            ? 'bg-white dark:bg-midnight-900 border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300 shadow-sm'
                                                            : 'bg-transparent border-transparent text-gray-400 hover:bg-white dark:hover:bg-midnight-900'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.permissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                    />
                                                    {formData.permissions.includes(perm.id) && <FiCheckCircle size={12} />}
                                                    {perm.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 sticky bottom-0 bg-white dark:bg-midnight-900 z-10">
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-all font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                    >
                                        <FiPlus size={18} />
                                        <span>{isEditing ? 'Save Changes' : 'Create User Account'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
