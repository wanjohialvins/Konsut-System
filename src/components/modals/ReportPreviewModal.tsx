import React from 'react';
import { FaTimes, FaDownload, FaChartLine, FaUsers, FaArrowUp, FaArrowDown, FaCalendarAlt } from 'react-icons/fa';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { generateReportPDF } from '../../utils/pdf/reports';

interface ReportData {
    title: string;
    period: string;
    metrics: {
        label: string;
        value: string | number;
        trend?: number;
        type: 'currency' | 'number' | 'percentage';
    }[];
    chartData: any[];
    topClients?: { name: string; revenue: number; count: number }[];
    ledgerData?: any[];
    currency: 'Ksh' | 'USD';
}

interface ReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ReportData;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ isOpen, onClose, data }) => {
    const [generating, setGenerating] = React.useState(false);
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    const handleDownload = async () => {
        setGenerating(true);
        await generateReportPDF(data);
        setGenerating(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400">
                                    <FaChartLine size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{data.title}</h2>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <FaCalendarAlt className="text-brand-500" /> {data.period} • Digital Financial Intelligence
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDownload}
                                disabled={generating}
                                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {generating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <FaDownload />}
                                {generating ? 'Generating...' : 'Download PDF'}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-3 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-2xl transition-all"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-900">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {data.metrics.map((m, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:border-brand-500/30 transition-all group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-brand-400 transition-colors">{m.label}</p>
                                    <div className="flex items-end justify-between">
                                        <h3 className="text-2xl font-black text-white">{m.value}</h3>
                                        {m.trend !== undefined && (
                                            <div className={`flex items-center gap-1 text-xs font-black ${m.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {m.trend >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                                                {Math.abs(m.trend)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Interactive Chart Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 p-8 rounded-[2rem] bg-slate-800/40 border border-slate-700/50">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Revenue Performance</h4>
                                    <div className="flex gap-2">
                                        <span className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Trend</span>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Distribution Chart */}
                            <div className="p-8 rounded-[2rem] bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 w-full">Client Segmenting</h4>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.topClients?.map(c => ({ name: c.name, value: c.revenue }))}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.topClients?.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full space-y-3 mt-4">
                                    {data.topClients?.slice(0, 3).map((c, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                                <span className="text-xs font-bold text-slate-400">{c.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-white">{data.currency} {Math.round(c.revenue / 1000)}k</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Ledger Preview */}
                        <div className="rounded-[2rem] bg-slate-800/20 border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><FaUsers className="text-brand-500" /> Transactional Ledger</h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing top {data.ledgerData?.length || 0} entries</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900/30">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Doc Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Date</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {data.ledgerData?.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-white uppercase tracking-tight text-sm">{item.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-500">ID: #{item.id}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.type}</span>
                                                </td>
                                                <td className="px-6 py-5 text-slate-400 font-bold text-xs">{item.date}</td>
                                                <td className="px-6 py-5 text-right font-black text-white text-base">
                                                    {data.currency} {item.value.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="p-6 border-t border-slate-800 text-center bg-slate-900/80">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">KONSUT Financial Intelligence • Proprietary Report Architecture</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReportPreviewModal;
