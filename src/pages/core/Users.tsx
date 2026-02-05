import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiEdit2, FiX, FiCheckCircle, FiPlus, FiUser, FiShield, FiKey } from "react-icons/fi";
import { useModal } from "../../contexts/ModalContext";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import UserAvatar from "../../components/ui/UserAvatar";
import RoleBadge from "../../components/ui/RoleBadge";
import { ROLE_DEFINITIONS } from "../../config/permissions";

import type { User } from "../../types/types";

const Users = () => {
    const { showConfirm } = useModal();
    const { user: currentUser, updateUser, refreshUser } = useAuth();
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

    // Dynamic Meta Data
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [rolePresets, setRolePresets] = useState<Record<string, string[]>>({});

    const groupedPermissions = React.useMemo(() => {
        return allPermissions.reduce((acc: any, perm: any) => {
            const cat = perm.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(perm);
            return acc;
        }, {});
    }, [allPermissions]);

    const showMessage = useCallback((type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const loadUsers = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [usersData, metaData] = await Promise.all([
                api.users.getAll(),
                api.meta.get()
            ]);
            setUsers(usersData);
            if (metaData) {
                setAllPermissions(metaData.permissions || []);
                setRolePresets(metaData.roles || {});
            }
            // Fallback: If roles not loaded from meta, use keys from definitions
            if (!metaData?.roles) {
                // If backend didn't provide roles, we could use keys from config,
                // but config doesn't have the permission arrays. 
                // We'll stick to what was loaded or empty, but the UI loop below accounts for empty.
            }
        } catch (error) {
            console.error('Failed to load users/meta', error);
            showMessage('error', 'Failed to load system data');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        loadUsers();
        // Polling for real-time status updates (every 10 seconds)
        const interval = setInterval(() => {
            loadUsers(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [loadUsers]);

    // Helper to get roles safely
    const getRolePreset = (role: string) => rolePresets[role] || [];

    const resetForm = () => {
        setFormData({ username: '', password: '', email: '', role: 'staff', permissions: getRolePreset('staff') });
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
            permissions: getRolePreset(role)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingId) {
                await api.users.update({ ...formData, id: editingId } as any);
                showMessage('success', 'User updated successfully');

                // Instant reflection: If editing self, refresh from DB
                if (currentUser && currentUser.id === editingId && refreshUser) {
                    await refreshUser();
                }
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
                    id="users-add-btn"
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-95"
                >
                    <FiPlus size={20} />
                    <span className="font-semibold">Add User</span>
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'} `}>
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
                                        <div className="flex justify-center flex-col items-center gap-1">
                                            <RoleBadge
                                                role={u.role}
                                                permissionsCount={u.permissions && Array.isArray(u.permissions) ? u.permissions.length : 0}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`w-2 h-2 rounded-full shadow-sm ${u.isActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300'} `}></span>
                                            <span className={`font-bold ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} `}>
                                                {u.isActive ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-900 dark:text-white font-bold">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'New Account'}</span>
                                            {u.lastLogin && <span className="text-[10px] text-gray-400 uppercase font-black">{new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">

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
                                        <div className="flex justify-between items-center gap-3 pb-2 border-b border-gray-100 dark:border-midnight-800">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 hidden md:block">
                                                    <FiUser size={18} />
                                                </div>
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Identity & Credentials</h4>
                                            </div>

                                            {/* Live Avatar Preview */}
                                            <div className="flex-shrink-0">
                                                <UserAvatar
                                                    user={{ role: formData.role } as any}
                                                    size={48}
                                                    className="rounded-2xl shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Username</label>
                                                <input
                                                    type="text"
                                                    required
                                                    // username is now editable
                                                    placeholder="e.g. jdoe"
                                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-midnight-800 bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm"
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
                                                {(Object.keys(rolePresets).length > 0 ? Object.keys(rolePresets) : Object.keys(ROLE_DEFINITIONS)).map((role) => {
                                                    const def = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS['viewer'];
                                                    const Icon = def.icon;
                                                    const isActive = formData.role === role;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={role}
                                                            onClick={() => applyPreset(role)}
                                                            className={`px-3 py-3 rounded-xl text-xs font-bold capitalize border transition-all flex flex-col items-center justify-center gap-2 group
                                                            ${isActive
                                                                    ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30 transform scale-[1.02]'
                                                                    : 'bg-white dark:bg-midnight-950 border-gray-200 dark:border-midnight-800 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-900/10'
                                                                }`}
                                                        >
                                                            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-brand-500'} />
                                                            {role}
                                                            {isActive && <FiCheckCircle size={14} className="text-white/90" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smart Permission Modules */}
                                    <div className="bg-gray-50 dark:bg-midnight-950/50 rounded-2xl p-6 border border-gray-100 dark:border-midnight-800 space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Access Modules</label>
                                            <span className="text-xs text-brand-600 font-bold">{formData.permissions.length} Permissions Active</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => {
                                                const catPerms = perms as any[];

                                                // 1. Define Logic
                                                const writePerms = catPerms.filter(p =>
                                                    p.id.includes('manage') ||
                                                    p.id.includes('delete') ||
                                                    p.id.includes('create') ||
                                                    p.id.includes('edit') ||
                                                    p.id.includes('new') ||
                                                    p.id.includes('add')
                                                );
                                                const readPerms = catPerms.filter(p => !writePerms.includes(p));

                                                // 2. Determine Current Status
                                                const activeInCat = formData.permissions.filter(id => catPerms.some(p => p.id === id));
                                                const hasAllWrite = writePerms.every(p => activeInCat.includes(p.id));
                                                const hasAllRead = readPerms.every(p => activeInCat.includes(p.id));

                                                let status = 'custom';
                                                if (activeInCat.length === 0) status = 'none';
                                                else if (hasAllRead && activeInCat.length === readPerms.length) status = 'viewer';
                                                else if (hasAllRead && hasAllWrite && activeInCat.length === catPerms.length) status = 'manager';

                                                // 3. Handler
                                                const setLevel = (level: string) => {
                                                    const otherPerms = formData.permissions.filter(id => !catPerms.some(p => p.id === id));
                                                    let newCatPerms: string[] = [];

                                                    if (level === 'viewer' || level === 'manager') {
                                                        newCatPerms = [...newCatPerms, ...readPerms.map(p => p.id)];
                                                    }
                                                    if (level === 'manager') {
                                                        newCatPerms = [...newCatPerms, ...writePerms.map(p => p.id)];
                                                    }

                                                    setFormData(prev => ({ ...prev, permissions: [...otherPerms, ...newCatPerms] }));
                                                };

                                                return (
                                                    <div key={category} className="bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800 rounded-xl p-4 transition-all hover:border-brand-300 dark:hover:border-brand-700/50">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div>
                                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">{category}</h5>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {status === 'none' && 'No access granted'}
                                                                    {status === 'viewer' && 'Read-only access'}
                                                                    {status === 'manager' && 'Full control enabled'}
                                                                    {status === 'custom' && 'Custom configuration'}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {/* Quick Level Selector */}
                                                                <div className="flex bg-gray-100 dark:bg-midnight-800 rounded-lg p-1">
                                                                    {['none', 'viewer', 'manager'].map((lvl) => (
                                                                        <button
                                                                            key={lvl}
                                                                            type="button"
                                                                            onClick={() => setLevel(lvl)}
                                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${status === lvl
                                                                                    ? 'bg-white dark:bg-midnight-700 text-brand-600 shadow-sm'
                                                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                                                }`}
                                                                        >
                                                                            {lvl}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Advanced Expandable (Always visible for now if custom, or just list detail) */}
                                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-midnight-800 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {catPerms.map((perm) => (
                                                                <label
                                                                    key={perm.id}
                                                                    className={`flex items-center gap-2 text-[10px] font-medium cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-midnight-800/50 ${formData.permissions.includes(perm.id) ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className={`rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5`}
                                                                        checked={formData.permissions.includes(perm.id)}
                                                                        onChange={() => togglePermission(perm.id)}
                                                                    />
                                                                    <span className="truncate" title={perm.desc}>{perm.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
