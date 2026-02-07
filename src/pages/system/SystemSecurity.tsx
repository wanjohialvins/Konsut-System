import React, { useState } from "react";
import { FiLock, FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import { SecuritySkeleton } from "../../components/skeletons/PageSkeletons";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

const SystemSecurity = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [confirmWipe, setConfirmWipe] = useState("");
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [tableStats, setTableStats] = useState<{ name: string; rows_count: number; size: number }[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await api.settings.get();
                if (settings && typeof settings.system_maintenance !== 'undefined') {
                    setMaintenanceMode(settings.system_maintenance);
                } else {
                    setMaintenanceMode(localStorage.getItem('system_maintenance') === 'true');
                }

                // Load active users
                const userRes = await api.admin.getActiveUsers();
                if (userRes.success && Array.isArray(userRes.users)) setActiveUsers(userRes.users);

                // Load DB stats
                const stats = await api.settings.getDatabaseStats();
                if (Array.isArray(stats)) setTableStats(stats);

            } catch {
                console.error("Failed to sync settings");
            } finally {
                setInitialLoading(false);
            }
        };
        loadSettings();
    }, []);

    const runAction = async (action: string, payload?: any) => {
        setLoading(true);
        try {
            if (action === 'nuke') {
                if (confirmWipe !== 'CONFIRM WIPE') return showToast('error', 'Type "CONFIRM WIPE" to proceed');
                await api.settings.clearAll();
                showToast('success', 'System state reset to zero');
                setConfirmWipe("");
            } else if (action === 'maintenance') {
                const newState = !maintenanceMode;
                setMaintenanceMode(newState);
                localStorage.setItem('system_maintenance', newState.toString());
                await api.settings.save({ 'system_maintenance': newState });
                showToast('info', `Maintenance mode ${newState ? 'ENABLED' : 'DISABLED'}`);
                await api.admin.runAction('purge-sessions');
                showToast('success', 'All sessions purged');
            } else if (action === 'purge-logs') {
                const res: any = await api.admin.runAction('purge-logs');
                showToast('success', res.message || 'Logs purged');
            } else if (action === 'truncate') {
                await api.settings.truncateTable(payload);
                showToast('success', `Table ${payload} wiped.`);
                // Refresh stats
                const stats = await api.settings.getDatabaseStats();
                if (Array.isArray(stats)) setTableStats(stats);
            }
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Execution failure';
            showToast('error', errorMsg);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <SecuritySkeleton />;

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <span className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-900/20">
                        <FiLock size={24} />
                    </span>
                    Security Protocols
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg ml-1">Access control, maintenance locks, and emergency measures</p>
            </header>

            <div className="space-y-8">
                <div className={`p-8 rounded-[2rem] border-l-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${maintenanceMode
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500'
                    : 'bg-white dark:bg-midnight-900 border-gray-200 dark:border-midnight-800'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-full ${maintenanceMode ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-midnight-800 text-gray-400'}`}>
                            <FiLock size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Maintenance Protocol</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {maintenanceMode ? 'System is currently LOCKED. Only Administrators can access.' : 'System is OPEN. Normal access rules apply.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => runAction('maintenance')}
                        className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${maintenanceMode
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            }`}
                    >
                        {maintenanceMode ? 'Unlock System' : 'Lock System'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiAlertTriangle className="text-red-500" />
                            Active Sessions
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">Forcefully invalidate all active user sessions except the current one. Use this if you suspect a compromise.</p>
                        <button
                            onClick={() => runAction('purge-sessions')}
                            disabled={loading}
                            className="w-full py-3 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold text-sm transition-colors"
                        >
                            Purge All Sessions
                        </button>
                    </div>

                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiTrash2 className="text-amber-500" />
                            Retention Policy
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">Remove audit records older than 30 days to free up database storage.</p>
                        <button
                            onClick={() => runAction('purge-logs')}
                            disabled={loading}
                            className="w-full py-3 border border-amber-200 dark:border-amber-900/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl font-bold text-sm transition-colors"
                        >
                            Clean Old Logs (&gt;30 Days)
                        </button>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2rem] border border-red-200 dark:border-red-900/30">
                        <h3 className="text-lg font-black text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                            <FiTrash2 />
                            Thermonuclear Reset
                        </h3>
                        <p className="text-red-600/70 text-sm mb-6 font-medium">This action wipes the entire cloud configuration. It is instantaneous and irreversible.</p>

                        <div className="flex gap-4">
                            <input
                                value={confirmWipe}
                                onChange={e => setConfirmWipe(e.target.value)}
                                placeholder="Type CONFIRM WIPE"
                                className="flex-1 bg-white dark:bg-midnight-950 border border-red-200 rounded-xl px-4 text-xs font-bold text-red-600 placeholder-red-200 outline-none focus:border-red-500"
                            />
                            <button
                                onClick={() => runAction('nuke')}
                                disabled={confirmWipe !== 'CONFIRM WIPE' || loading}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-red-500/20"
                            >
                                Execute
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tactical Wipe Section */}
                <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                        <FiTrash2 className="text-orange-500" />
                        Tactical Data Wipe
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">Selectively clear individual tables. <span className="font-bold text-red-500">Warning: Actions are irreversible.</span></p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-midnight-800 text-xs uppercase tracking-wider text-gray-400">
                                    <th className="p-4">Table Name</th>
                                    <th className="p-4">Rows</th>
                                    <th className="p-4">Size (KB)</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                                {tableStats.map((table) => (
                                    <tr key={table.name} className="hover:bg-gray-50 dark:hover:bg-midnight-950 transition-colors">
                                        <td className="p-4 font-mono text-sm text-gray-700 dark:text-gray-300">{table.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{table.rows_count}</td>
                                        <td className="p-4 text-sm text-gray-500">{Math.round(table.size / 1024)} KB</td>
                                        <td className="p-4 text-right">
                                            {['users', 'auth_tokens'].includes(table.name) ? (
                                                <span className="text-xs font-bold text-gray-300 italic px-3 py-1">Protected</span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Are you ABSOLUTELY SURE you want to wipe table '${table.name}'? This cannot be undone.`)) {
                                                            runAction('truncate', table.name);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold uppercase rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                >
                                                    Wipe
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Active Users Section */}
                <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                        <FiAlertTriangle className="text-emerald-500" />
                        Recently Active Users (Last 24h)
                    </h3>

                    {activeUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeUsers.map((u: any) => (
                                <div key={u.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-midnight-950 rounded-xl border border-gray-200 dark:border-midnight-800">
                                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 flex items-center justify-center font-bold">
                                        {u.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{u.username}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">{u.role}</div>
                                    </div>
                                    <div className="ml-auto text-xs font-mono text-gray-400">
                                        {u.last_login ? new Date(u.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 font-medium bg-gray-50 dark:bg-midnight-950 rounded-xl border border-dashed border-gray-200 dark:border-midnight-800">
                            No active users found in the last 24 hours.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemSecurity;
