import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiLock, FiShield, FiSave, FiAward, FiInfo, FiKey, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import UserAvatar from "../components/UserAvatar";

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                username: formData.username,
                name: formData.name,
                email: formData.email,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            // Sync with backend
            const response = await api.users.updateSelf(payload);

            if (response.success) {
                // Update local auth context
                if (updateUser) {
                    updateUser({
                        ...user!,
                        username: formData.username,
                        name: formData.name,
                        email: formData.email
                    });
                }
                showToast('success', 'Profile identity synchronized');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            }
        } catch (error: any) {
            showToast('error', error.message || 'Synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/20">
                            <FiUser size={32} />
                        </div>
                        Account Profile
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Manage your personal identity and security credentials</p>
                </div>
                <div className="flex items-center gap-4 px-6 py-3 bg-white dark:bg-midnight-900 rounded-2xl border border-gray-100 dark:border-midnight-800 shadow-xl">
                    <UserAvatar user={user} size={48} />
                    <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{user?.role || 'Viewer'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Security Level</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Personal Identity */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 dark:border-midnight-800">
                            <FiInfo className="text-indigo-600" size={20} />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Personal Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Username</label>
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 pl-14 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security & Password */}
                    <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 dark:border-midnight-800">
                            <FiLock className="text-rose-500" size={20} />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Security Credentials</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/10 transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Confirm Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">* Leave password fields blank if you don't wish to change it.</p>
                    </div>
                </div>

                {/* Sidebar Stats/Info */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                        <FiAward className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 transform group-hover:scale-110 transition-transform duration-700" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-80">Operational Access</h4>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Designation</p>
                                <p className="text-2xl font-black capitalize">{user?.role || 'Viewer'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">System ID</p>
                                <p className="text-xl font-bold tracking-tighter">USR-{user?.id?.toString().padStart(4, '0')}</p>
                            </div>
                            <div className="pt-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <FiShield size={12} /> Account Active
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-midnight-800 shadow-xl">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-midnight-800 pb-2">Quick Actions</h4>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => window.location.href = '/settings/preferences'}
                                className="w-full p-4 bg-gray-50 dark:bg-midnight-950 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-2xl text-left transition-all border border-transparent hover:border-indigo-100 group"
                            >
                                <p className="text-xs font-black text-gray-700 dark:text-gray-200 group-hover:text-indigo-600">Interface Settings</p>
                                <p className="text-[10px] text-gray-400 font-bold">Theme and density control</p>
                            </button>
                            <button
                                type="button"
                                className="w-full p-4 bg-gray-50 dark:bg-midnight-950 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl text-left transition-all border border-transparent hover:border-rose-100 group"
                            >
                                <p className="text-xs font-black text-gray-700 dark:text-gray-200 group-hover:text-rose-600">Security Audit</p>
                                <p className="text-[10px] text-gray-400 font-bold">Review recent access logs</p>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 bg-slate-950 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white rounded-3xl font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                        <FiSave /> {loading ? 'SAVING...' : 'SYNC ACCOUNT'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
