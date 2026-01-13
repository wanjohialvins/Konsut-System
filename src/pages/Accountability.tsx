import { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward } from 'react-icons/fi';
import { api } from '../services/api';

interface PerformanceData {
    username: string;
    role: string;
    total_invoices: number;
    total_revenue: string | number;
}

const Accountability = () => {
    const [stats, setStats] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.admin.accountability();
            setStats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load performance stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                        <FiAward size={28} />
                    </div>
                    Accountability Reports
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Performance tracking and sales leaderboards per staff account</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Summary Cards could go here */}
            </div>

            <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-midnight-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Sales Performance by User</h3>
                    <FiTrendingUp className="text-brand-500" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-midnight-950 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-8 py-4">Rank</th>
                                <th className="px-8 py-4">Operator</th>
                                <th className="px-8 py-4">Role</th>
                                <th className="px-8 py-4 text-center">Docs Issued</th>
                                <th className="px-8 py-4 text-right">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Calculating performance...</p>
                                    </td>
                                </tr>
                            ) : stats.map((user, index) => (
                                <tr key={user.username} className="hover:bg-gray-50/50 dark:hover:bg-midnight-800/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <span className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-sm
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-50 text-slate-400'}
                                        `}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white capitalize">{user.username}</p>
                                                <p className="text-xs text-gray-400">Activity detected</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-midnight-950 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center font-bold text-gray-700 dark:text-gray-300">
                                        {user.total_invoices}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="font-black text-indigo-600 dark:text-indigo-400">
                                            Ksh {Number(user.total_revenue || 0).toLocaleString()}
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-midnight-950 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full rounded-full"
                                                style={{ width: `${Math.min(100, (Number(user.total_revenue) / 1000000) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Accountability;
