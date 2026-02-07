import { useState, useEffect } from 'react';
import { FiRotateCcw, FiFilter, FiDownload, FiSearch, FiActivity, FiClock, FiArrowLeft, FiUser } from "react-icons/fi";
import { PageHeaderSkeleton, TableSkeleton } from "../../components/skeletons/CommonSkeletons";
import { useModal } from "../../contexts/ModalContext";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import UserAvatar from "../../components/ui/UserAvatar";

interface AuditLog {
    id: number;
    username: string;
    role?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    data_before: string | null; // Can be JSON string or null
    data_after: string | null;  // Can be JSON string or null
    ip_address: string;
    created_at: string;
    details?: string;
}

const AuditLogs = () => {
    const { showConfirm } = useModal();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        try {
            const data = await api.admin.getAuditLogs();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleRevert = async (id: any) => {
        const confirmed = await showConfirm("Are you sure you want to REVERT this action? This will undo the changes made in this step.");
        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await api.admin.revertAudit(Number(id));
            if (res.success) {
                showToast('success', 'Action successfully reverted!');
                fetchLogs();
            } else {
                showToast('error', res.message || 'Failed to revert');
            }
        } catch {
            showToast('error', 'Critical error during reversal');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        if (!action) return 'text-gray-600 bg-gray-50 dark:bg-gray-900/10';
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50 dark:bg-green-900/10';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/10';
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50 dark:bg-red-900/10';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/10';
    };

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const renderJson = (title: string, data: string | null) => {
        try {
            if (!data || data === '{}' || data === 'null') return <div className="text-gray-400 italic">No change data</div>;
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            return (
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
                    <pre className="p-4 bg-gray-50 dark:bg-midnight-950 rounded-xl overflow-x-auto text-xs font-mono text-brand-600 dark:text-brand-400 max-h-[200px] border border-gray-100 dark:border-midnight-800">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                </div>
            );
        } catch {
            return <div className="text-gray-400 text-xs break-all">{data}</div>;
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto animate-fade-in relative">
                <PageHeaderSkeleton />
                <TableSkeleton rows={8} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in relative">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-500/20">
                            <FiActivity size={24} />
                        </div>
                        Audit Logs
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg ml-1">Track system activities and data changes</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search logs..."
                            className="bg-white dark:bg-midnight-900 pl-10 pr-6 py-3 rounded-xl border border-gray-200 dark:border-midnight-800 outline-none focus:ring-2 focus:ring-brand-500 font-medium w-full md:w-64 shadow-sm text-sm"
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-3 bg-white dark:bg-midnight-900 text-gray-500 hover:text-brand-600 rounded-xl border border-gray-200 dark:border-midnight-800 shadow-sm transition-all hover:scale-105 active:scale-95"
                        title="Refresh Logs"
                    >
                        <FiRotateCcw size={20} />
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-midnight-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-midnight-950/50 border-b border-gray-100 dark:border-midnight-800">
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Entity</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Change Info</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Network</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                                        No audit logs found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-midnight-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col gap-2">
                                                {isAdmin && log.action !== 'REVERT' && log.action !== 'SQL_EXEC_DESTRUCTIVE' && (
                                                    <button
                                                        onClick={() => handleRevert(log.id as any)}
                                                        disabled={!log.data_before && !log.action.includes('CREATE') && !log.action.includes('INSERT')}
                                                        className="px-3 py-1 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 w-fit disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={!log.data_before && !log.action.includes('CREATE') ? "Undo not available (No snapshot)" : "Revert this action"}
                                                    >
                                                        <FiRotateCcw size={12} /> Reverse
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-2 font-mono text-xs">
                                                    <FiClock size={12} />
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={{ username: log.username, role: (log.role || 'staff') as any } as any} size={32} />
                                                <span className="font-bold text-gray-900 dark:text-white capitalize text-sm">{log.username || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-transparent ${getActionColor(log.action || '')}`}>
                                                {(log.action || 'UNKNOWN').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex flex-col">
                                                {log.entity_type} <span className="text-gray-400 font-normal text-xs font-mono">#{log.entity_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline underline-offset-4"
                                            >
                                                View Data Snapshot
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-midnight-950 px-2 py-1 rounded inline-block">
                                                {log.ip_address}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Snapshot Modal */}
            {
                selectedLog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
                        <div className="bg-white dark:bg-midnight-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-midnight-800 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gray-50 dark:bg-midnight-950">
                                <div>
                                    <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Data Change Detail</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Ref: {selectedLog.entity_type} #{selectedLog.entity_id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-xl transition-all"
                                >
                                    <FiArrowLeft />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <FiUser size={14} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Actor / User</span>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">{selectedLog.username}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <FiActivity size={14} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Operation</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getActionColor(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {renderJson("Payload (Before)", selectedLog.data_before)}
                                    {renderJson("Payload (After)", selectedLog.data_after)}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-midnight-950 border-t border-gray-100 dark:border-midnight-800 flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                >
                                    Close Inspector
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AuditLogs;
