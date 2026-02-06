import React, { useState } from "react";
import { FiActivity, FiSearch, FiServer, FiCpu, FiDatabase, FiCheck, FiX } from "react-icons/fi";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

const SystemVitals = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'server' | 'client' | 'network'>('server');

    // Client Diagnostics
    const [clientInfo, setClientInfo] = useState<any>(null);

    // Network Trace
    const [pingResult, setPingResult] = useState<string | null>(null);

    // Debug State
    const [debugUsername, setDebugUsername] = useState("");
    const [debugPassword, setDebugPassword] = useState("");
    const [debugResult, setDebugResult] = useState<Record<string, any> | null>(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await api.admin.getSystemHealth();
                setStats(data);
            } catch (e) {
                console.error("Failed to fetch health stats");
                showToast('error', "Failed to load system vitals");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        // Gather Client Info
        setClientInfo({
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            depth: `${window.screen.colorDepth}-bit`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            storage: 'Unknown'
        });

        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(est => {
                const used = ((est.usage || 0) / 1024 / 1024).toFixed(2);
                const quota = ((est.quota || 0) / 1024 / 1024).toFixed(2);
                setClientInfo((prev: any) => ({ ...prev, storage: `${used} MB / ${quota} MB` }));
            });
        }
    }, []);

    const runPingTest = async () => {
        setPingResult("Pinging...");
        const start = performance.now();
        try {
            await api.meta.get(); // Lightweight call
            const end = performance.now();
            setPingResult(`${(end - start).toFixed(2)} ms`);
        } catch {
            setPingResult("Request Failed");
        }
    };

    const handleDebugLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setDebugResult(null);
        try {
            const res = await api.admin.debugAuth({ username: debugUsername, password: debugPassword });
            setDebugResult(res.debugInfo);

            if (res.debugInfo.found) {
                if (res.debugInfo.match) {
                    showToast('success', `Credentials Valid! Role: ${res.debugInfo.role}`);
                } else {
                    showToast('error', 'Incorrect Password');
                }
            } else {
                showToast('error', `User '${res.debugInfo.username}' Not Found`);
            }
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Debug execution failed';
            showToast('error', errorMsg);
            setDebugResult({ error: errorMsg, hint: 'Check server logs' });
        } finally {
            // Force delay to ensure UX feels responsive but doesn't flicker
            setTimeout(() => setLoading(false), 500);
        }
    }

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <span className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-900/20">
                            <FiActivity size={24} />
                        </span>
                        System Diagnostic Console
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg ml-1">Real-time deep observability suite</p>
                </div>

                <div className="flex bg-white dark:bg-midnight-900 p-1 rounded-xl border border-gray-200 dark:border-midnight-800">
                    {['server', 'client', 'network'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'server' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Server Overview */}
                        <div className="lg:col-span-1 bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                                <FiServer className="text-brand-500" /> Host Environment
                            </h3>
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-midnight-800 pb-2">
                                    <span className="text-gray-500">PHP Version</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{stats?.phpVersion || '...'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-midnight-800 pb-2">
                                    <span className="text-gray-500">Limits (Mem/Post/Upload)</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {stats?.config?.memory_limit}/{stats?.config?.post_max_size}/{stats?.config?.upload_max_filesize}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-midnight-800 pb-2">
                                    <span className="text-gray-500">Disk Usage</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{stats?.diskUsage || '...'}</span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-gray-500 block mb-2">Available Extensions</span>
                                    <div className="flex flex-wrap gap-2">
                                        {stats?.config?.extensions?.map((ext: string) => (
                                            <span key={ext} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase">{ext}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Database Health */}
                        <div className="lg:col-span-1 bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                                <FiDatabase className="text-indigo-500" /> Database Integrity
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                                    <span className="text-indigo-800 dark:text-indigo-300 font-bold">Latency Check</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{stats?.dbLatency || '...'}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-midnight-950 rounded-xl">
                                    <span className="text-gray-500 font-medium">Total Size</span>
                                    <span className="text-gray-900 dark:text-white font-mono font-bold">{stats?.dbSize || '...'}</span>
                                </div>
                                <div className="border-t border-gray-100 dark:border-midnight-800 pt-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Row Counts</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {Object.entries(stats?.tableCounts || {}).map(([tbl, count]: any) => (
                                            <div key={tbl} className="bg-gray-50 dark:bg-midnight-950 p-2 rounded-lg">
                                                <div className="text-[10px] text-gray-400 uppercase truncate">{tbl}</div>
                                                <div className="font-black text-brand-600">{count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Login Diagnostic Tool */}
                        <div className="lg:col-span-1 bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                                <FiSearch className="text-amber-500" /> Auth Debugger
                            </h3>
                            <form onSubmit={handleDebugLogin} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={debugUsername} onChange={e => setDebugUsername(e.target.value)} placeholder="User" className="w-full px-3 py-2 bg-gray-50 dark:bg-midnight-950 border border-gray-200 dark:border-midnight-800 rounded-lg outline-none focus:border-amber-500 text-sm" required />
                                    <input type="password" value={debugPassword} onChange={e => setDebugPassword(e.target.value)} placeholder="Pass" className="w-full px-3 py-2 bg-gray-50 dark:bg-midnight-950 border border-gray-200 dark:border-midnight-800 rounded-lg outline-none focus:border-amber-500 text-sm" required />
                                </div>
                                <button disabled={loading} type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all">
                                    {loading ? 'Verifying...' : 'Verify Credentials'}
                                </button>
                            </form>
                            {debugResult && (
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-midnight-950 rounded-lg border border-gray-200 dark:border-midnight-800 text-xs font-mono">
                                    <pre>{JSON.stringify(debugResult, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PHP Error Logs */}
                    <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-700 overflow-hidden flex flex-col h-full min-h-[300px]">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                            <FiActivity className="text-red-500" />
                            PHP Error Log (Tail 20)
                        </h3>
                        <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800 custom-scrollbar">
                            {stats?.logs ? (
                                Array.isArray(stats.logs) ? stats.logs.join('\n') : stats.logs
                            ) : (
                                <span className="animate-pulse text-slate-500">Connecting to stream...</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'client' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                            <FiCpu className="text-purple-500" /> Browser Fingerprint
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="p-4 bg-gray-50 dark:bg-midnight-950 rounded-xl font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                                {clientInfo?.userAgent}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                                    <div className="text-purple-800 dark:text-purple-300 text-xs font-bold uppercase mb-1">Platform</div>
                                    <div className="font-bold text-gray-900 dark:text-white">{clientInfo?.platform}</div>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                                    <div className="text-purple-800 dark:text-purple-300 text-xs font-bold uppercase mb-1">Resolution</div>
                                    <div className="font-bold text-gray-900 dark:text-white">{clientInfo?.screen} ({clientInfo?.depth})</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                            <FiDatabase className="text-blue-500" /> Local Storage Quota
                        </h3>
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <h1 className="text-4xl font-black text-brand-600 mb-2">{clientInfo?.storage}</h1>
                                <p className="text-gray-500 font-medium">Used / Quota</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'network' && (
                <div className="bg-white dark:bg-midnight-900 p-12 rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800 text-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/20 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiActivity size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Network Latency Test</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Measure the round-trip time (RTT) from your device to the API server.</p>

                    <button onClick={runPingTest} className="px-10 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 transition-all active:scale-95">
                        {pingResult ? 'Test Again' : 'Start Ping Test'}
                    </button>

                    {pingResult && (
                        <div className="mt-8 animate-fade-in">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Result</p>
                            <h2 className={`text-5xl font-black ${pingResult.includes('Failed') ? 'text-red-500' : 'text-emerald-500'}`}>{pingResult}</h2>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SystemVitals;
