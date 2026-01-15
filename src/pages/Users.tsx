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
    ];

    const ROLE_PRESETS: Record<string, string[]> = {
        admin: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory', '/stock/add', '/analytics', '/audit-logs', '/system-health', '/settings/profile', '/settings/invoice', '/settings/preferences', '/settings/system', '/users'],
        ceo: ['/', '/invoices', '/clients', '/analytics', '/audit-logs', '/settings/profile', '/settings/preferences'],
        manager: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory', '/stock/add', '/analytics'],
        sales: ['/', '/new-invoice', '/invoices', '/clients', '/stock/inventory'],
        storekeeper: ['/', '/stock/inventory', '/stock/add', '/invoices'],
        accountant: ['/', '/invoices', '/analytics', '/settings/invoice'],
        staff: ['/', '/new-invoice', '/invoices', '/clients'],
        viewer: ['/', '/invoices', '/clients'],
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

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-midnight-950/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 scale-up-center">
                        <div className="p-8 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gray-50/50 dark:bg-midnight-800/50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Modify Profile' : 'New Security Account'}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{isEditing ? 'Updating existing access' : 'Enter details for the new operator'}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-midnight-700 transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Identity */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-2">Identification</h4>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                        <input
                                            type="text"
                                            required
                                            readOnly={isEditing}
                                            className={`w - full px - 5 py - 3.5 rounded - 2xl border bg - gray - 50 dark: bg - midnight - 950 text - gray - 900 dark: text - white focus: ring - 4 focus: ring - brand - 500 / 20 focus: border - brand - 500 outline - none transition - all font - medium
                      ${isEditing ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-midnight-800' : 'border-gray-200 dark:border-midnight-700'} `}
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            required={!isEditing}
                                            placeholder={isEditing ? "(Leave blank to keep current)" : "Minimum 8 characters"}
                                            className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-midnight-700 bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-2 mt-8">Clearance Level</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['admin', 'ceo', 'manager', 'sales', 'storekeeper', 'accountant', 'staff', 'viewer'].map((role) => (
                                            <button
                                                type="button"
                                                key={role}
                                                onClick={() => applyPreset(role)}
                                                className={`px - 4 py - 3 rounded - 2xl text - sm font - bold capitalize border transition - all flex items - center justify - between
                          ${formData.role === role
                                                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg'
                                                        : 'bg-white dark:bg-midnight-950 border-gray-200 dark:border-midnight-800 text-gray-500 dark:text-gray-400'
                                                    } `}
                                            >
                                                {role}
                                                {formData.role === role && <FiCheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Permissions */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-2">Page Access Control</h4>
                                    <div className="space-y-3">
                                        {ALL_PERMISSIONS.map((perm) => (
                                            <label key={perm.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-midnight-800 hover:bg-gray-50 dark:hover:bg-midnight-950 transition-colors cursor-pointer group">
                                                <div className="mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{perm.label}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{perm.desc}</div>
                                                </div>
                                                {formData.permissions.includes(perm.id) && <FiShield className="text-brand-500" size={16} />}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4 sticky bottom-0 bg-white dark:bg-midnight-900 pb-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-all font-bold shadow-xl shadow-brand-900/30 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FiPlus size={20} />
                                    <span>{isEditing ? 'Save Security Changes' : 'Initialize New Account'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
