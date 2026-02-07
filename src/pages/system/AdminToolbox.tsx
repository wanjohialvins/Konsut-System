import React, { useState, useMemo } from "react";
import { FiActivity, FiSearch, FiServer, FiCpu, FiDatabase, FiUser, FiShield, FiKey, FiLock, FiTerminal, FiTrash2, FiEye, FiSettings } from "react-icons/fi";
import { AdminToolboxSkeleton } from "../../components/skeletons/PageSkeletons";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalContext";
import UserAvatar from "../../components/ui/UserAvatar";
import RoleBadge from "../../components/ui/RoleBadge";

const AdminToolbox = () => {
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'users' | 'utils' | 'sql' | 'env' | 'scheduler'>('users');

    // User Ops State
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Utils State


    // SQL Console State
    const [sqlQuery, setSqlQuery] = useState("");
    const [sqlResults, setSqlResults] = useState<any[] | null>(null);
    const [sqlMessage, setSqlMessage] = useState("");
    const [sqlError, setSqlError] = useState("");
    const [destructiveMode, setDestructiveMode] = useState(false);

    // Config Editor State
    const [config, setConfig] = useState<Record<string, string>>({});
    const [configLoading, setConfigLoading] = useState(false);

    // File Manager State
    const [files, setFiles] = useState<any[]>([]);
    const [fileLoading, setFileLoading] = useState(false);

    // Advanced Utils State
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [utilsLoading, setUtilsLoading] = useState(false);

    // Scheduler State
    const [tasks, setTasks] = useState<any[]>([]);
    const [schedulerLoading, setSchedulerLoading] = useState(false);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const usersRes = await api.users.getAll();
            setUsers(usersRes);
        } catch (e) {
            console.error("Failed to load admin data");
            showToast('error', "Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };



    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const handleForceLogout = async (user: any) => {
        const confirmed = await showConfirm(
            `Are you sure you want to force logout ${user.username}? They will be kicked out immediately.`,
            { title: "Force Logout", confirmLabel: "Force Logout", cancelLabel: "Cancel" }
        );
        if (!confirmed) return;

        try {
            await api.auth.forceLogout(user.id);
            showToast('success', "User forced logout signal sent.");
        } catch (e: any) {
            showToast('error', e.message || "Failed to force logout");
        }
    };

    const handlePasswordReset = async (user: any) => {
        const confirmed = await showConfirm(
            `Are you sure you want to reset the password for ${user.username}? The user will need to contact support to get the new temporary password.`,
            { title: "Reset Password", confirmLabel: "Reset Now", cancelLabel: "Cancel" }
        );

        if (confirmed) {
            try {
                await api.users.resetPassword(user.id);
                showToast('success', `Password reset for ${user.username}`);
            } catch (e) {
                showToast('error', 'Failed to reset password');
            }
        }
    };



    const handleImpersonate = async (user: any) => {
        const confirmed = await showConfirm(
            `Are you sure you want to login as ${user.username}? You will be redirected to the dashboard as if you were this user.`,
            { title: "Ghost Login", confirmLabel: "Impersonate", cancelLabel: "Cancel" }
        );

        if (confirmed) {
            try {
                const res = await api.auth.impersonate(user.id);
                if (res.success && res.user) {
                    localStorage.setItem('konsut_system_auth', JSON.stringify(res.user));
                    showToast('success', `Impersonating ${user.username}...`);
                    setTimeout(() => window.location.href = '/', 1000); // Reload to reset context
                }
            } catch (e: any) {
                showToast('error', e.message || 'Impersonation failed');
            }
        }
    };



    const handleRunSql = async () => {
        if (!sqlQuery.trim()) return;
        setLoading(true);
        setSqlResults(null);
        setSqlMessage("");
        setSqlError("");
        try {
            const res = await api.admin.executeSql(sqlQuery, destructiveMode);
            if (res.success) {
                if (res.results) {
                    setSqlResults(res.results);
                    setSqlMessage(`Query execution successful. Returned ${res.count} rows.`);
                } else {
                    setSqlMessage(res.message || "Query executed successfully.");
                }
            } else { // Should be caught by catch block if status is error, but just in case
                if (res.error) setSqlError(res.error);
            }
        } catch (e: any) {
            setSqlError(e.message || "Execution error");
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async () => {
        setConfigLoading(true);
        try {
            const res = await api.admin.getConfig();
            if (res && res.config) setConfig(res.config);
        } catch (e) {
            showToast('error', "Failed to load config");
        } finally {
            setConfigLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        const confirmed = await showConfirm(
            "Changing core configuration can break the system. Are you absolutely sure?",
            { title: "Review Changes", confirmLabel: "Save & Restart", cancelLabel: "Cancel" }
        );
        if (!confirmed) return;

        setLoading(true);
        try {
            await api.admin.updateConfig(config);
            showToast('success', "Configuration updated");
        } catch (e: any) {
            showToast('error', e.message || "Failed to update config");
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async () => {
        setFileLoading(true);
        try {
            const res = await api.admin.getFiles();
            if (res && res.files) setFiles(res.files);
        } catch (e) {
            showToast('error', "Failed to load files");
        } finally {
            setFileLoading(false);
        }
    };

    const handleDeleteFile = async (file: any) => {
        const confirmed = await showConfirm(
            `Permanently delete ${file.name}? This cannot be undone.`,
            { title: "Delete File", confirmLabel: "Delete", cancelLabel: "Cancel" }
        );
        if (confirmed) {
            try {
                await api.admin.deleteFile(file.name);
                showToast('success', "File deleted");
                loadFiles();
            } catch (e) {
                showToast('error', "Failed to delete file");
            }
        }
    };

    const loadActiveSessions = async () => {
        setUtilsLoading(true);
        try {
            const res = await api.admin.getActiveUsers();
            if (res.success) setActiveSessions(res.users);
        } catch (e) {
            showToast('error', "Failed to load active sessions");
        } finally {
            setUtilsLoading(false);
        }
    };

    const handleKillSession = async (userId: number, username: string) => {
        const confirmed = await showConfirm(
            `Force logout ${username}? They will be kicked out immediately.`,
            { title: "Kill Session", confirmLabel: "Kill", cancelLabel: "Cancel" }
        );
        if (confirmed) {
            try {
                await api.auth.forceLogout(userId);
                showToast('success', "Session killed");
                loadActiveSessions();
            } catch (e: any) {
                showToast('error', e.message || "Failed to kill session");
            }
        }
    };

    const handleGlobalKillSwitch = async () => {
        const confirmed = await showConfirm(
            "ARE YOU SURE? This will immediately logout ALL users (except you). Use only in emergencies.",
            { title: "GLOBAL KILL SWITCH", confirmLabel: "EXECUTE", cancelLabel: "Cancel" }
        );
        if (confirmed) {
            try {
                const res = await api.admin.killAllSessions();
                showToast('success', res.message);
                loadActiveSessions();
            } catch (e: any) {
                showToast('error', e.message || "Failed to execute kill switch");
            }
        }
    };

    const handleClearCache = async () => {
        setLoading(true);
        try {
            // Backend first (needs auth token)
            await api.admin.clearSystemCache();

            // Then Frontend
            localStorage.clear();
            sessionStorage.clear();

            showToast('success', "Cache cleared! Reloading...");
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            showToast('error', "Failed to clear cache");
            setLoading(false);
        }
    };

    const loadTasks = async () => {
        setSchedulerLoading(true);
        try {
            const res = await api.admin.getCrons();
            if (res.tasks) setTasks(res.tasks);
        } catch (e) {
            showToast('error', "Failed to load scheduled tasks");
        } finally {
            setSchedulerLoading(false);
        }
    };

    const handleRunTask = async (taskId: string) => {
        setSchedulerLoading(true);
        try {
            const res = await api.admin.runCron(taskId);
            showToast('success', res.message);
            loadTasks(); // Refresh for last run
        } catch (e: any) {
            showToast('error', e.message || "Failed to run task");
        } finally {
            setSchedulerLoading(false);
        }
    };

    const handleSaveSchedule = async (task: any) => {
        try {
            await api.admin.updateCronSchedule(task.id, task.schedule, task.frequency, task.enabled);
            showToast('success', "Schedule updated");
            loadTasks();
        } catch (e: any) {
            showToast('error', e.message || "Failed to update schedule");
        }
    };

    const updateLocalTask = (id: string, field: string, value: any) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    React.useEffect(() => {
        if (activeTab === 'env') loadConfig();
        if (activeTab === 'utils') { loadFiles(); loadActiveSessions(); }
        if (activeTab === 'scheduler') loadTasks();
    }, [activeTab]);

    if (loading && users.length === 0) return <AdminToolboxSkeleton />;

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <span className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
                            <FiTerminal size={24} />
                        </span>
                        Admin Toolbox
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg ml-1">Advanced diagnostics and user management console</p>
                </div>

                <div className="flex bg-white dark:bg-midnight-900 p-1 rounded-xl border border-gray-200 dark:border-midnight-800 shadow-sm">
                    {[
                        { id: 'users', label: 'User Ops', icon: FiUser },
                        { id: 'utils', label: 'Utilities', icon: FiCpu },
                        { id: 'scheduler', label: 'Scheduler', icon: FiActivity },
                        { id: 'sql', label: 'SQL Console', icon: FiDatabase },
                        { id: 'env', label: 'Environment', icon: FiSettings }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon /> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User List */}
                    <div className="lg:col-span-1 bg-white dark:bg-midnight-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 flex flex-col h-[600px]">
                        <div className="p-6 border-b border-gray-100 dark:border-midnight-800">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-midnight-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-400 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${selectedUser?.id === user.id
                                        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                                        : 'bg-white dark:bg-midnight-950 border-gray-100 dark:border-midnight-800 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex-shrink-0">
                                        <UserAvatar user={user as any} size={40} className="rounded-xl shadow-sm" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold truncate ${selectedUser?.id === user.id ? 'text-brand-700 dark:text-brand-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {user.username}
                                            </span>
                                            {user.isActive ? (
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RoleBadge role={user.role} permissionsCount={Array.isArray(user.permissions) ? user.permissions.length : 0} />
                                            <span className="text-[10px] text-gray-400 truncate hidden md:inline">{user.email || 'No email'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Details & Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {selectedUser ? (
                            <>
                                <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-midnight-800 rounded-full flex items-center justify-center text-2xl font-black text-slate-400">
                                                {selectedUser.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedUser.username}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-100 text-brand-700">ID: {selectedUser.id}</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">{selectedUser.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Active</p>
                                            <p className="font-mono text-sm text-gray-600 dark:text-gray-300">{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Never'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleImpersonate(selectedUser)}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-midnight-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gray-100 dark:bg-midnight-800 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                                                    <FiEye className="text-gray-500 group-hover:text-amber-700" />
                                                </div>
                                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-amber-700">Login As User</span>
                                            </div>
                                            <p className="text-xs text-gray-400 pl-[3.25rem]">Impersonate this user to verify bugs or permissions.</p>
                                        </button>

                                        <button
                                            onClick={() => handlePasswordReset(selectedUser)}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-midnight-800 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gray-100 dark:bg-midnight-800 rounded-lg group-hover:bg-brand-200 dark:group-hover:bg-brand-800 transition-colors">
                                                    <FiKey className="text-gray-500 group-hover:text-brand-700" />
                                                </div>
                                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand-700">Reset Password</span>
                                            </div>
                                            <p className="text-xs text-gray-400 pl-[3.25rem]">Trigger password reset mechanism for this user.</p>
                                        </button>

                                        <button
                                            onClick={() => handleForceLogout(selectedUser)}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-midnight-800 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-left"
                                            title="Force logout user"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-gray-100 dark:bg-midnight-800 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                                                    <FiLock className="text-gray-500 group-hover:text-red-700" />
                                                </div>
                                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-red-700">Force Logout</span>
                                            </div>
                                            <p className="text-xs text-gray-400 pl-[3.25rem]">Invalidate all active sessions immediately.</p>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-6">
                                        <FiShield className="text-emerald-500" /> Effective Permissions
                                    </h3>

                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            try {
                                                const perms = JSON.parse(selectedUser.permissions || '[]');
                                                if (!Array.isArray(perms) || perms.length === 0) {
                                                    return <span className="text-slate-500 italic text-sm">No specific permissions assigned.</span>;
                                                }
                                                return perms.map((perm: string, i: number) => (
                                                    <span key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        {perm.replace(/_/g, ' ')}
                                                    </span>
                                                ));
                                            } catch (e) {
                                                return <span className="text-red-400 text-sm">Error parsing permissions data.</span>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest text-lg border-2 border-dashed border-gray-200 dark:border-midnight-800 rounded-[2rem]">
                                Select a user to manage
                            </div>
                        )}
                    </div>
                </div>
            )}




            {activeTab === 'scheduler' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FiActivity className="text-blue-500" /> System Scheduler
                                </h3>
                                <p className="text-sm text-gray-500 mt-2">Manage automated maintenance tasks.</p>
                            </div>
                            <button
                                onClick={loadTasks}
                                className="p-2 bg-gray-100 dark:bg-midnight-800 rounded-lg hover:bg-gray-200 dark:hover:bg-midnight-700 transition-colors"
                            >
                                <FiActivity className={`text-gray-500 ${schedulerLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {tasks.map(task => (
                                <div key={task.id} className="p-6 bg-gray-50 dark:bg-midnight-950 rounded-2xl border border-gray-100 dark:border-midnight-800 flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-lg text-gray-800 dark:text-white">{task.name}</h4>
                                            <button
                                                onClick={() => updateLocalTask(task.id, 'enabled', !task.enabled)}
                                                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all ${task.enabled
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                            >
                                                {task.enabled ? 'Active' : 'Disabled'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">{task.description}</p>

                                        <div className="flex flex-wrap gap-4 items-center">
                                            <select
                                                value={task.frequency}
                                                onChange={e => updateLocalTask(task.id, 'frequency', e.target.value)}
                                                className="px-3 py-2 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                            >
                                                <option value="hourly">Hourly</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={task.schedule}
                                                onChange={e => updateLocalTask(task.id, 'schedule', e.target.value)}
                                                className="px-3 py-2 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-midnight-800 rounded-lg text-sm font-mono outline-none focus:border-blue-500 w-32"
                                                placeholder="00:00"
                                            />
                                            <button
                                                onClick={() => handleSaveSchedule(task)}
                                                className="text-xs font-bold uppercase tracking-wider text-blue-500 hover:text-blue-700 px-3 py-2"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Run</p>
                                            <p className="font-mono text-xs text-gray-600 dark:text-gray-300">{task.last_run}</p>
                                        </div>
                                        <div className="text-right max-w-[200px]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Result</p>
                                            <p className="font-mono text-xs text-emerald-600 truncate" title={task.last_result}>{task.last_result}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRunTask(task.id)}
                                            disabled={schedulerLoading}
                                            className="mt-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            Run Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'utils' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Session Manager */}
                    <div className="md:col-span-2 bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <FiActivity className="text-emerald-500" /> Session Manager
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadActiveSessions}
                                    className="p-2 bg-gray-100 dark:bg-midnight-800 rounded-lg hover:bg-gray-200 dark:hover:bg-midnight-700 transition-colors"
                                    title="Refresh List"
                                >
                                    <FiActivity className="text-gray-500" />
                                </button>
                                <button
                                    onClick={handleGlobalKillSwitch}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all animate-pulse"
                                >
                                    <FiLock /> Global Kill Switch
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-midnight-950 border-b border-gray-100 dark:border-midnight-800">
                                    <tr>
                                        <th className="px-6 py-3 font-bold tracking-wider">User</th>
                                        <th className="px-6 py-3 font-bold tracking-wider">Role</th>
                                        <th className="px-6 py-3 font-bold tracking-wider">Last Active</th>
                                        <th className="px-6 py-3 font-bold tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-midnight-800 text-gray-700 dark:text-gray-300">
                                    {utilsLoading ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading sessions...</td></tr>
                                    ) : activeSessions.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No active sessions found (except you)</td></tr>
                                    ) : (
                                        activeSessions.map((session, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-midnight-950/50">
                                                <td className="px-6 py-4 font-bold">{session.username}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-gray-100 dark:bg-midnight-800 text-gray-500">
                                                        {session.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{session.last_login}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleKillSession(session.id, session.username)}
                                                        className="text-red-500 hover:text-red-700 font-bold uppercase text-[10px] tracking-wider border border-red-200 dark:border-red-900/30 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    >
                                                        Kill
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                            <FiServer className="text-amber-500" /> Cache Control
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Clear local browser storage and backend OpCache. Use if you see stale data.</p>
                        <button
                            onClick={handleClearCache}
                            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-midnight-800 rounded-xl font-bold text-gray-400 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <FiTrash2 size={24} />
                            <span>Purge All Caches</span>
                        </button>
                    </div>


                </div>
            )}

            {activeTab === 'sql' && (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <FiDatabase className="text-indigo-400" /> RAW SQL Executor
                            </h3>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={destructiveMode}
                                            onChange={e => setDestructiveMode(e.target.checked)}
                                        />
                                        <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${destructiveMode ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                        Destructive Mode
                                    </span>
                                </label>
                                <button
                                    onClick={handleRunSql}
                                    disabled={loading}
                                    className={`px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50 ${destructiveMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                >
                                    {loading ? 'Executing...' : destructiveMode ? 'RUN DESTRUCTIVE' : 'Run Query'}
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={sqlQuery}
                            onChange={e => setSqlQuery(e.target.value)}
                            placeholder={destructiveMode ? "INSERT INTO users..." : "SELECT * FROM users..."}
                            className={`w-full h-40 bg-slate-950 text-emerald-400 font-mono text-sm p-4 rounded-xl border outline-none transition-colors placeholder-slate-700 mb-2 ${destructiveMode ? 'border-red-900/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'}`}
                        />
                        <p className="text-slate-500 text-xs">
                            <span className={`font-bold ${destructiveMode ? 'text-red-500' : 'text-amber-500'}`}>WARNING:</span> {destructiveMode ? 'YOU ARE IN DESTRUCTIVE MODE. CHANGES ARE PERMANENT.' : 'Direct database access. Only SELECT/SHOW commands are allowed. Enable Destructive Mode to write.'}
                        </p>

                        {(sqlMessage || sqlError) && (
                            <div className={`mt-4 p-4 rounded-xl text-sm font-medium border ${sqlError ? 'bg-red-900/20 border-red-900/50 text-red-200' : 'bg-emerald-900/20 border-emerald-900/50 text-emerald-200'}`}>
                                {sqlError || sqlMessage}
                            </div>
                        )}
                    </div>

                    {sqlResults && (
                        <div className="bg-white dark:bg-midnight-900 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-midnight-950 border-b border-gray-100 dark:border-midnight-800">
                                        <tr>
                                            {sqlResults.length > 0 && Object.keys(sqlResults[0]).map(key => (
                                                <th key={key} className="px-6 py-3 font-bold tracking-wider">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-midnight-800 text-gray-700 dark:text-gray-300">
                                        {sqlResults.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-midnight-950/50">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                                        {val === null ? <span className="text-gray-400">NULL</span> : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'env' && (
                <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex justify-between items-center mb-8 relative">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <FiSettings className="text-slate-500" /> Core Environment Variables
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">Modify `config.php` constants directly. <span className="text-red-500 font-bold">Use extreme caution.</span></p>
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            disabled={loading || configLoading}
                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all"
                        >
                            {loading ? 'Saving...' : 'Save Config'}
                        </button>
                    </div>

                    {configLoading ? (
                        <div className="text-center py-12 text-gray-400">Loading configuration...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {Object.entries(config).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{key}</label>
                                    <div className="relative">
                                        <input
                                            type={key.includes('PASS') || key.includes('KEY') ? 'password' : 'text'}
                                            value={value}
                                            onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight-950 border border-gray-200 dark:border-midnight-800 rounded-xl font-mono text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                        {(key.includes('PASS') || key.includes('KEY')) && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold pointer-events-none">
                                                HIDDEN
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div >
    );
};

export default AdminToolbox;
