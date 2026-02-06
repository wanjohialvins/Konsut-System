/**
 * Workspace entry point with role-based dashboard variants.
 * Enhanced v2.0: Date Filtering, Export, Skeleton Loading, Dynamic Charts
 */
import React, { useEffect, useState, useRef } from "react";
import {
  FaBell, FaBolt, FaBoxOpen, FaPlus, FaMoneyBillWave, FaFileInvoiceDollar,
  FaChartLine, FaUsers, FaFileInvoice, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaServer, FaTicketAlt, FaClipboardList, FaBullhorn, FaShieldAlt, FaWarehouse,
  FaUserShield, FaBriefcase, FaListUl, FaDownload, FaCalendarAlt
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";

// --- Definitions ---
interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalInvoices: number;
    paidCount: number;
    pendingInvoicesCount: number;
    overdueCount: number;
    averageOrderValue: number;
    stockValue: number;
    lowStockCount: number;
    activeUsers: number;
    openTickets: number;
    urgentTickets: number;
    pendingTasks: number;
    revenueGrowth: number;
  };
  chartData: any[];
  recentActivity: any[];
  auditLogs: any[];
  ticketStats: any;
  recentMemos: any[];
  databaseStatus: string;
  greeting?: string;
  generated_at?: string;
  is_cached?: boolean;
}

// --- Shared Components ---

const StatCard = ({ label, value, icon: Icon, color, bg, link, trend, onClick }: any) => (
  <div onClick={onClick} className={`block group ${onClick ? 'cursor-pointer' : ''}`}>
    <Link to={onClick ? '#' : (link || "#")} className="block relative">
      <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-midnight-text-secondary mb-1">{label}</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{value}</h3>
            {trend && <p className={`text-xs font-bold mt-1 ${trend.includes('-') ? 'text-rose-500' : 'text-emerald-500'}`}>{trend}</p>}
          </div>
          <div className={`p-3 rounded-xl ${bg} dark:bg-opacity-10 ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon size={20} />
          </div>
        </div>
      </div>
    </Link>
  </div>
);

const SectionHeader = ({ title, icon: Icon, color = "text-gray-900" }: any) => (
  <h2 className={`text-sm font-black ${color} dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest`}>
    {Icon && <Icon className="opacity-80" />} {title}
  </h2>
);

// --- Role Dashboards ---

const CEODashboard = ({ data, chartMetric, setChartMetric }: any) => {
  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Revenue" value={`Ksh ${(data.metrics.totalRevenue || 0).toLocaleString()}`} icon={FaMoneyBillWave} color="text-brand-600" bg="bg-brand-50" link="/analytics" trend={`${(data.metrics.revenueGrowth || 0) > 0 ? '+' : ''}${data.metrics.revenueGrowth || 0}% vs prev`} />
        <StatCard label="Avg Order Value" value={`Ksh ${(data.metrics.averageOrderValue || 0).toLocaleString()}`} icon={FaChartLine} color="text-emerald-600" bg="bg-emerald-50" link="/analytics" />
        <StatCard label="Active Users" value={data.metrics.activeUsers || 0} icon={FaUsers} color="text-purple-600" bg="bg-purple-50" link="/users" />
        <StatCard label="System Health" value={data.databaseStatus || 'Unknown'} icon={FaServer} color="text-blue-600" bg="bg-blue-50" link="/system-health" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-midnight-900 p-4 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
          <div className="flex justify-between items-center mb-6">
            <SectionHeader title="Performance Velocity" icon={FaChartLine} />
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-midnight-800 rounded-lg">
              {['revenue'].map(m => (
                <button key={m} onClick={() => setChartMetric(m)} className={`px-3 py-1 text-xs font-bold rounded-md uppercase ${chartMetric === m ? 'bg-white shadow text-brand-600' : 'text-gray-400'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-midnight-900 p-4 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
            <SectionHeader title="Risk Radar" icon={FaExclamationTriangle} color="text-rose-600" />
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="font-bold text-rose-800 dark:text-rose-400 text-sm">Overdue Invoices</span>
                </div>
                <span className="font-black text-rose-600 text-lg">{data.metrics.overdueCount || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="font-bold text-amber-800 dark:text-amber-400 text-sm">Low Stock Items</span>
                </div>
                <span className="font-black text-amber-600 text-lg">{data.metrics.lowStockCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-gray-300 p-4 md:p-8 rounded-3xl shadow-xl border border-slate-800">
            <SectionHeader title="Security Audit Log" icon={FaUserShield} color="text-white" />
            <div className="space-y-0 text-sm font-mono overflow-y-auto max-h-[300px] custom-scrollbar">
              {(data.auditLogs || []).map((log: any, i: number) => (
                <div key={i} className="flex gap-4 py-3 border-b border-slate-800 hover:bg-white/5 px-2 rounded transition-colors items-center">
                  <span className="text-gray-500 whitespace-nowrap text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`font-bold text-xs ${log.action.includes('LOGIN') ? 'text-emerald-400' : 'text-blue-400'}`}>{log.action}</span>
                  <span className="text-gray-400 truncate text-xs">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... Simplified other dashboards reusing components ...
const ManagerDashboard = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6 md:space-y-8 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard label="Pending Orders" value={data.metrics.pendingInvoicesCount || 0} icon={FaFileInvoiceDollar} color="text-amber-600" bg="bg-amber-50" link="/invoices" />
      <StatCard label="Team Tasks" value={data.metrics.pendingTasks || 0} icon={FaClipboardList} color="text-indigo-600" bg="bg-indigo-50" link="/tasks" />
      <StatCard label="Open Issues" value={data.metrics.openTickets || 0} icon={FaTicketAlt} color="text-rose-600" bg="bg-rose-50" link="/tickets" />
    </div>
    {/* Reuse CEO logic for charts if needed, or keeping simple */}
  </div>
);

// --- Main Controller ---

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // New States for v2 Features
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartMetric, setChartMetric] = useState('revenue');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      // If no date selected, pass undefined to let backend use default
      const stats = await api.admin.getDashboardStats(
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setData(stats);
      if (stats.is_cached) {
        // Optional: slight indicator it's cached
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(true);
      showToast('error', 'Failed to synchronize dashboard intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange.start, dateRange.end]); // Reload when dates change

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      showToast('info', 'Generating Dashboard Report...');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('success', 'Report downloaded successfully');
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to generate PDF');
    }
  };

  if (loading && !data) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
          <FaExclamationTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Sync Interrupted</h2>
        <p className="text-slate-500 max-w-md mb-8">We encountered a protocol error while fetching your dashboard intelligence.</p>
        <button onClick={() => loadData()} className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg">Retry Connection</button>
      </div>
    );
  }

  // Quick Action FAB
  const FAB = (
    <Link to="/new-invoice" className="fixed bottom-8 right-8 w-16 h-16 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-2xl shadow-brand-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50">
      <FaPlus size={24} />
    </Link>
  );

  return (
    <div ref={dashboardRef} className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans transition-colors duration-300 pb-24">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="p-3 bg-white dark:bg-midnight-800 rounded-2xl shadow-md"><FaBriefcase className="text-brand-600" size={24} /></span>
              {data.greeting || `Welcome back, ${user.username}`}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
              <FaBolt className="text-amber-500" /> System live and {data.databaseStatus === 'Stable' ? 'healthy' : 'experiencing load'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-midnight-900 p-2 rounded-2xl shadow-lg border border-gray-100 dark:border-midnight-800">
            {/* Date Pickers - Simple HTML5 for robustness */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-midnight-800 rounded-xl">
              <FaCalendarAlt className="text-gray-400" />
              <input
                type="date"
                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-0"
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-gray-300">to</span>
              <input
                type="date"
                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-0"
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase transition-colors"
            >
              <FaDownload /> Export
            </button>
          </div>
        </header>

        {/* Content Render - Simplified Role Mapping for implementation speed */}
        {user.role?.toLowerCase() === 'ceo' || user.role?.toLowerCase() === 'admin' ? (
          <CEODashboard data={data} chartMetric={chartMetric} setChartMetric={setChartMetric} />
        ) : (
          <ManagerDashboard data={data} />
        )}
      </div>

      {['admin', 'manager', 'sales', 'staff'].includes(user.role?.toLowerCase() || '') && FAB}
    </div>
  );
};

export default Dashboard;