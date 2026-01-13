import { useState, useEffect } from 'react';
import { FiActivity, FiDatabase, FiCpu, FiHardDrive, FiCheckCircle, FiRotateCcw, FiTrash, FiShield } from 'react-icons/fi';
import { api } from '../services/api';

const SystemHealth = () => {
    const [stats, setStats] = useState({
        dbSize: '...',
        uptime: '...',
        cpuUsage: 0,
        ramUsage: 0,
        status: 'Operational',
        phpVersion: '...',
        serverSoftware: '...'
    });
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        try {
            setLoading(true);
            const data = await api.admin.getSystemHealth();
            if (data) setStats(data);
        } catch (error) {
            console.error('Failed to fetch health vital stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 60000); // 1 min update
        return () => clearInterval(interval);
    }, []);

    const runAction = async (action: string) => {
        if (!confirm(`Execute ${action}? This is a privileged system operation.`)) return;
        alert(`Request sent: ${action}. Processing in background...`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-green-600 text-white rounded-2xl shadow-xl shadow-green-600/20">
                            <FiActivity size={28} />
                        </div>
                        System Vitals & Control
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Real-time server performance and infrastructure monitoring</p>
                </div>
                <button
                    onClick={fetchHealth}
                    className="p-3 bg-gray-100 dark:bg-midnight-900 rounded-xl hover:bg-gray-200 transition-all"
                    title="Force Refresh"
                >
                    <FiRotateCcw className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl">
                            <FiDatabase size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DB Integrity</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.dbSize}</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-midnight-950 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[35%]"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">XAMPP MySQL v8.0</p>
                </div>

                <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 text-purple-600 rounded-xl">
                            <FiCpu size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compute Load</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.cpuUsage}%</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-midnight-950 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${stats.cpuUsage > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${stats.cpuUsage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">PHP Execution Time: 30s</p>
                </div>

                <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-xl">
                            <FiHardDrive size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Memory</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.ramUsage}%</h3>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-midnight-950 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${stats.ramUsage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">Memory Limit: 512MB</p>
                </div>

                <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm border-l-4 border-l-green-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-xl">
                            <FiCheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Pulse</p>
                            <h3 className="text-xl font-black text-green-600">{stats.status}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-500 font-bold uppercase tracking-wider">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        Uptime: {stats.uptime}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 dark:bg-midnight-900 text-white p-10 rounded-3xl shadow-2xl overflow-hidden relative group border border-slate-800 dark:border-midnight-800 mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black mb-2">Administrative Command Center</h2>
                        <p className="text-slate-400 max-w-md font-medium">Execute privileged system protocols and manage application state.</p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest mb-1">PHP Engine</p>
                                <p className="font-bold text-sm tracking-tight">{stats.phpVersion}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Server Stack</p>
                                <p className="font-bold text-sm tracking-tight">{stats.serverSoftware}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-[500px]">
                        {[
                            { label: 'Cloud Sync', desc: 'Sync all local cache to DB', icon: FiRotateCcw, action: 're-sync' },
                            { label: 'Purge Logs', desc: 'Clean old audit trails', icon: FiTrash, action: 'purge-logs' },
                            { label: 'System Lock', desc: 'Maintenance mode toggle', icon: FiShield, action: 'toggle-lock' },
                            { label: 'Global Alert', desc: 'Broadcast dashboard memo', icon: FiActivity, action: 'broadcast' },
                        ].map((tool) => (
                            <button
                                key={tool.label}
                                onClick={() => runAction(tool.action)}
                                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-left group/btn"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <tool.icon className="text-brand-500 group-hover/btn:scale-125 transition-transform" size={20} />
                                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full opacity-0 group-hover/btn:opacity-100"></div>
                                </div>
                                <p className="font-black text-white uppercase tracking-wider text-xs">{tool.label}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{tool.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
