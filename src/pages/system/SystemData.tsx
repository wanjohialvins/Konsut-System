import React, { useState } from "react";
import { FiDatabase, FiHardDrive, FiRefreshCcw, FiCopy, FiClock, FiPlay, FiCheckCircle } from "react-icons/fi";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalContext";

const SystemData = () => {
    const { showToast } = useToast();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(false);
    const [dryRun, setDryRun] = useState(true);
    const [crons, setCrons] = useState<any[]>([]);
    const [runningCron, setRunningCron] = useState<string | null>(null);

    React.useEffect(() => {
        loadCrons();
    }, []);

    const loadCrons = async () => {
        try {
            const res = await api.admin.getCrons();
            if (res && res.tasks) setCrons(res.tasks);
        } catch (e) {
            console.error("Failed to load crons", e);
        }
    };

    const handleRunCron = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRunningCron(id);
        try {
            const res = await api.admin.runCron(id);
            showToast('success', res.message);
            loadCrons();
        } catch (e: any) {
            showToast('error', e.message);
        } finally {
            setRunningCron(null);
        }
    };

    const runAction = async (action: string) => {
        setLoading(true);
        try {
            if (action === 'backup') {
                const data = await api.admin.backup();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showToast('success', 'Backup manifest downloaded');
            } else if (action === 'sync') {
                const res = await api.admin.runAction('sync');
                showToast('success', res.message || 'System synced');
                showAlert(JSON.stringify(res, null, 2), { title: "System Analytics" });
            } else if (action === 'cleanup_duplicates') {
                const mode = dryRun ? 'dry_run' : 'commit';

                if (!dryRun) {
                    const confirmed = await showConfirm(
                        "This will PERMANENTLY merge duplicate entries. Ensure you have a backup first. Continue?",
                        { title: "Execute Cleanup", confirmLabel: "Yes, Merge", cancelLabel: "Cancel" }
                    );
                    if (!confirmed) {
                        setLoading(false);
                        return;
                    }
                }

                try {
                    const res = await api.admin.cleanupDuplicates('all', mode);
                    const msg = `Stock: ${res.merged.stock}, Clients: ${res.merged.clients}`;

                    if (dryRun) {
                        showAlert(`Dry Run Complete. Found potential duplicates:\n${msg}\n\nDisable 'Dry Run' to execute merge.`, { title: "Cleanup Scan Results" });
                    } else {
                        showToast('success', `Cleanup Executed: ${msg}`);
                    }
                } catch (error: unknown) {
                    showToast('error', 'Cleanup failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                }
            } else if (action === 'refresh-schema') {
                await api.admin.runAction('refresh-schema');
                showToast('success', 'Database schema refreshed');
            }
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Execution failure';
            showToast('error', errorMsg);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <span className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-900/20">
                            <FiDatabase size={24} />
                        </span>
                        Data Core
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg ml-1">Database integrity, backups, and registry management</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-midnight-900 p-2 rounded-xl border border-gray-200 dark:border-midnight-800 self-start">
                    <button
                        onClick={() => setDryRun(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${dryRun ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Verify Mode
                    </button>
                    <button
                        onClick={() => setDryRun(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!dryRun ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Execute Mode
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => runAction('backup')} disabled={loading} className="group text-left bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 hover:border-brand-500 transition-all">
                    <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FiHardDrive size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">System Backup</h3>
                    <p className="text-sm text-gray-500">Export full JSON manifest of current system configuration.</p>
                </button>

                <button onClick={() => runAction('sync')} disabled={loading} className="group text-left bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 hover:border-brand-500 transition-all">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-180 transition-transform duration-500">
                        <FiRefreshCcw size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Registry Sync</h3>
                    <p className="text-sm text-gray-500">Revalidate database integrity and calculation caches.</p>
                </button>

                <button onClick={() => runAction('cleanup_duplicates')} disabled={loading} className={`group text-left bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border ${dryRun ? 'border-gray-100 dark:border-midnight-800 hover:border-brand-500' : 'border-red-100 dark:border-red-900/30 hover:border-red-500'} transition-all`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${dryRun ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                        <FiCopy size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{dryRun ? 'Scan for Duplicates' : 'Merge Duplicates'}</h3>
                    <p className="text-sm text-gray-500">{dryRun ? 'Safe scan to identify duplicate entries without modifying data.' : 'Permanently merge identified duplicate entries.'}</p>
                </button>

                <button onClick={() => runAction('refresh-schema')} disabled={loading} className="group text-left bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 hover:border-brand-500 transition-all">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FiDatabase size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Schema Refresh</h3>
                    <p className="text-sm text-gray-500">Apply latest table definitions from database.sql patch file.</p>
                </button>
            </div>

            {/* Scheduled Tasks Section */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                    <FiClock className="text-brand-500" /> Scheduled System Tasks
                </h3>
                <div className="divide-y divide-gray-100 dark:divide-midnight-800">
                    {crons.map((task) => (
                        <div key={task.id} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
                                        {task.name}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold tracking-widest bg-gray-100 dark:bg-midnight-800 text-gray-500 px-2 py-1 rounded">
                                        {task.schedule}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-mono">
                                    <FiCheckCircle size={10} className={task.last_result?.includes('success') || task.last_result?.includes('Optimized') || task.last_result?.includes('Pruned') ? 'text-emerald-500' : 'text-gray-400'} />
                                    Last Run: {task.last_run || 'Never'} — {task.last_result || 'Pending'}
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleRunCron(task.id, e)}
                                disabled={runningCron === task.id || loading}
                                className="px-6 py-3 bg-gray-50 dark:bg-midnight-950 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-500 hover:text-white disabled:opacity-50 disabled:bg-gray-50 transition-all flex items-center gap-2"
                            >
                                <FiPlay size={14} className={runningCron === task.id ? 'animate-spin' : ''} />
                                {runningCron === task.id ? 'Running' : 'Run Now'}
                            </button>
                        </div>
                    ))}
                    {crons.length === 0 && (
                        <div className="text-center py-8 text-gray-400 italic">No scheduled tasks defined.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemData;
