import React, { useState } from "react";
import { FiShield, FiDatabase, FiRefreshCcw, FiTrash2, FiLock, FiSearch, FiCheck, FiX, FiActivity } from "react-icons/fi";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import { useModal } from "../contexts/ModalContext";

const SystemControl = () => {
    const { showToast } = useToast();
    const { showAlert, showPrompt } = useModal();
    const [debugModalOpen, setDebugModalOpen] = useState(false);
    const [debugUsername, setDebugUsername] = useState("");
    const [debugPassword, setDebugPassword] = useState("");
    const [debugResult, setDebugResult] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmWipe, setConfirmWipe] = useState("");
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await api.settings.get();
                if (settings && typeof settings.system_maintenance !== 'undefined') {
                    setMaintenanceMode(settings.system_maintenance);
                } else {
                    setMaintenanceMode(localStorage.getItem('system_maintenance') === 'true');
                }
            } catch {
                console.error("Failed to sync settings");
            }
        };
        loadSettings();
    }, []);

    const runAction = async (action: string) => {
        setLoading(true);
        try {
            if (action === 'backup') {
                const data = await api.settings.get();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showToast('success', 'Backup manifest generated');
            } else if (action === 'nuke') {
                if (confirmWipe !== 'CONFIRM WIPE') return showToast('error', 'Type "CONFIRM WIPE" to proceed');
                await api.settings.clearAll();
                showToast('success', 'System state reset to zero');
                setConfirmWipe("");
            } else if (action === 'maintenance') {
                const newState = !maintenanceMode;
                setMaintenanceMode(newState);
                localStorage.setItem('system_maintenance', newState.toString());
                // Also persist to backend
                await api.settings.save({ 'system_maintenance': newState });
                showToast('info', `Maintenance mode ${newState ? 'ENABLED' : 'DISABLED'}`);
            } else if (action === 'broadcast') {
                const msg = await showPrompt("Enter broadcast message for all users:");
                if (msg) {
                    await api.admin.runAction(action, msg);
                    showToast('success', 'Message broadcasted');
                }
            } else if (action === 'sync') {
                const res = await api.admin.runAction('sync');
                showToast('success', res.message || 'System synced');
                showAlert(JSON.stringify(res, null, 2), { title: "System Analytics" });
            } else if (action === 'debug_login') {
                setDebugModalOpen(true);
            } else {
                await api.admin.runAction(action);
                showToast('success', 'Protocol executed successfully');
            }
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Execution failure';
            showToast('error', errorMsg);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDebugLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setDebugResult(null);
        try {
            const res = await api.admin.debugAuth({ username: debugUsername, password: debugPassword });
            setDebugResult(res.debug_info);
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Debug execution failed';
            showToast('error', errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const ActionCard = ({ icon: Icon, title, desc, action, warning = false }: { icon: React.ElementType, title: string, desc: string, action: string, color?: string, warning?: boolean }) => (
        <div className={`p-8 rounded-[2.5rem] bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 shadow-xl flex flex-col justify-between group h-full ${warning ? 'hover:border-red-500' : 'hover:border-brand-500'} transition-all`}>
            <div>
                <div className={`p-4 rounded-2xl w-fit mb-6 ${warning ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'}`}>
                    <Icon size={28} className="group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
            </div>
            <button
                onClick={() => runAction(action)}
                disabled={loading}
                className={`mt-10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${warning ? 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20' : 'bg-slate-900 dark:bg-brand-600 text-white hover:bg-black'}`}
            >
                {loading ? 'EXECUTING...' : `Execute ${title}`}
            </button>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in space-y-12 mb-20 relative">
            {debugModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-midnight-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase flex items-center gap-3">
                                <FiSearch /> Login Diagnostic
                            </h2>
                            <button onClick={() => setDebugModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-white"><FiX size={24} /></button>
                        </div>

                        <form onSubmit={handleDebugLogin} className="space-y-4 mb-6">
                            <input
                                value={debugUsername}
                                onChange={e => setDebugUsername(e.target.value)}
                                placeholder="Username to test"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-brand-500"
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    value={debugPassword}
                                    onChange={e => setDebugPassword(e.target.value)}
                                    placeholder="Password to check"
                                    type="password"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-midnight-900 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-brand-500"
                                    required
                                />
                                <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm">Test</button>
                            </div>
                        </form>

                        {debugResult && (
                            <div className="bg-gray-100 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-white/10 space-y-2 font-mono text-sm">
                                <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2 mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">User Found:</span>
                                    <span className={debugResult.found ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
                                        {debugResult.found ? "YES" : "NO"}
                                    </span>
                                </div>
                                {debugResult.found && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Role:</span>
                                            <span className="text-gray-900 dark:text-white">{debugResult.role}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Stored Hash:</span>
                                            <span className="text-gray-500 text-xs">{debugResult.stored_hash_preview}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-white/10 mt-2">
                                            <span className="text-gray-500 dark:text-gray-400">Password Match:</span>
                                            <div className="flex items-center gap-2">
                                                {debugResult.match ? (
                                                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><FiCheck /> MATCH</span>
                                                ) : (
                                                    <span className="text-red-600 dark:text-red-500 font-bold flex items-center gap-1"><FiX /> FAIL</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <header>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="p-4 bg-slate-950 text-white rounded-[2rem] shadow-2xl shadow-black/20">
                        <FiShield size={32} />
                    </div>
                    Core Intelligence
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Privileged administrator controls and system-wide state management</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <ActionCard
                    icon={FiSearch}
                    title="Login Diagnostic"
                    desc="Safely test user credentials and password hashing without logging out. Useful for troubleshooting access issues."
                    action="debug_login"
                />
                <ActionCard
                    icon={FiRefreshCcw}
                    title="Registry Sync"
                    desc="Force a global synchronization and integrity check. Identifies orphaned invoice items and database health."
                    action="sync"
                />
                <ActionCard
                    icon={FiDatabase}
                    title="System Backup"
                    desc="Export the entire configuration manifest including business identity and document engine rules as a portable JSON file."
                    action="backup"
                />
                <ActionCard
                    icon={FiActivity}
                    title="System Broadcast"
                    desc="Send a high-priority system-wide notification to all active users. Useful for maintenance announcements."
                    action="broadcast"
                />
                <ActionCard
                    icon={FiLock}
                    title="Security Audit"
                    desc="Rotate system sessions and force-clear sensitive temporary data pools. Recommended after high-volume operations."
                    action="purge-sessions"
                />
                <div className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col justify-between transition-all ${maintenanceMode ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500' : 'bg-gray-50 dark:bg-midnight-900 border-gray-200 dark:border-midnight-800'} h-full shadow-sm`}>
                    <div>
                        <div className={`p-4 rounded-2xl w-fit mb-6 ${maintenanceMode ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                            <FiLock size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Maintenance Lock</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Prevent non-admin users from accessing the system. Active sessions will be redirected to a standby page.</p>
                    </div>
                    <button
                        onClick={() => runAction('maintenance')}
                        className={`mt-10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${maintenanceMode ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/30' : 'bg-slate-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        {maintenanceMode ? 'DEACTIVATE LOCK' : 'ACTIVATE LOCK'}
                    </button>
                </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/5 rounded-[3rem] p-12 border-2 border-dashed border-red-200 dark:border-red-900/30">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                        <div className="p-5 bg-red-600 text-white rounded-3xl w-fit mx-auto lg:mx-0 shadow-2xl shadow-red-600/20">
                            <FiTrash2 size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-red-600 uppercase tracking-tight">Thermonuclear Reset</h2>
                        <p className="text-red-700/80 dark:text-red-400 font-medium text-lg">This action wipes the entire cloud configuration. It is instantaneous and irreversible. All business identity, tax rules, and preferences will be permanently deleted.</p>
                    </div>

                    <div className="lg:w-1/2 bg-white dark:bg-midnight-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6 w-full max-w-md border border-red-100 dark:border-red-900/20">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block text-center">Type "CONFIRM WIPE" to unlock</label>
                            <input
                                value={confirmWipe}
                                onChange={e => setConfirmWipe(e.target.value)}
                                placeholder="CONFIRM WIPE"
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-2 border-red-50 dark:border-red-900/20 rounded-2xl p-5 text-center text-xl font-black text-red-600 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => runAction('nuke')}
                            disabled={confirmWipe !== 'CONFIRM WIPE' || loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:grayscale text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-red-600/20 transition-all active:scale-95"
                        >
                            {loading ? 'WIPING...' : 'INITIATE PURGE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemControl;
