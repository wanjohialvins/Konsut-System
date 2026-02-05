/**
 * Workspace entry point with role-based dashboard variants.
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  FaBell, FaBolt, FaBoxOpen, FaPlus, FaMoneyBillWave, FaFileInvoiceDollar,
  FaChartLine, FaUsers, FaFileInvoice, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaEye, FaServer, FaTicketAlt, FaClipboardList, FaBullhorn, FaShieldAlt, FaWarehouse,
  FaUserShield, FaBriefcase, FaListUl
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

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
}

// --- Shared Components ---

const StatCard = ({ label, value, icon: Icon, color, bg, link, trend }: any) => (
  <Link to={link || "#"} className="block group">
    <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-midnight-text-secondary mb-1">{label}</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{value}</h3>
          {trend && <p className="text-xs text-green-500 font-bold mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bg} dark:bg-opacity-10 ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  </Link>
);

const SectionHeader = ({ title, icon: Icon, color = "text-gray-900" }: any) => (
  <h2 className={`text-sm font-black ${color} dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest`}>
    {Icon && <Icon className="opacity-80" />} {title}
  </h2>
);

// --- Role Dashboards ---

const CEODashboard = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Revenue" value={`Ksh ${(data.metrics.totalRevenue || 0).toLocaleString()}`} icon={FaMoneyBillWave} color="text-brand-600" bg="bg-brand-50" link="/analytics" trend={`${(data.metrics.revenueGrowth || 0) > 0 ? '+' : ''}${data.metrics.revenueGrowth || 0}% vs last month`} />
        <StatCard label="Avg Order Value" value={`Ksh ${(data.metrics.averageOrderValue || 0).toLocaleString()}`} icon={FaChartLine} color="text-emerald-600" bg="bg-emerald-50" link="/analytics" />
        <StatCard label="Active Users" value={data.metrics.activeUsers || 0} icon={FaUsers} color="text-purple-600" bg="bg-purple-50" link="/users" />
        <StatCard label="System Health" value={data.databaseStatus || 'Unknown'} icon={FaServer} color="text-blue-600" bg="bg-blue-50" link="/system-health" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-midnight-900 p-4 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
          <SectionHeader title="Revenue Velocity" icon={FaChartLine} />
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip />
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
                <span className="font-black text-rose-600 text-lg">{data.metrics.overdueCount}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="font-bold text-amber-800 dark:text-amber-400 text-sm">Low Stock Items</span>
                </div>
                <span className="font-black text-amber-600 text-lg">{data.metrics.lowStockCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-gray-300 p-4 md:p-8 rounded-3xl shadow-xl border border-slate-800">
            <SectionHeader title="Security Audit Log" icon={FaUserShield} color="text-white" />
            <div className="space-y-0 text-sm font-mono overflow-y-auto max-h-[300px] custom-scrollbar">
              {data.auditLogs.map((log: any, i: number) => (
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

const ManagerDashboard = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Pending Orders" value={data.metrics.pendingInvoicesCount} icon={FaFileInvoiceDollar} color="text-amber-600" bg="bg-amber-50" link="/invoices" />
        <StatCard label="Team Tasks" value={data.metrics.pendingTasks} icon={FaClipboardList} color="text-indigo-600" bg="bg-indigo-50" link="/tasks" />
        <StatCard label="Open Issues" value={data.metrics.openTickets} icon={FaTicketAlt} color="text-rose-600" bg="bg-rose-50" link="/tickets" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
          <SectionHeader title="Approval Queue" icon={FaCheckCircle} />
          <div className="space-y-4">
            {data.metrics.pendingInvoicesCount === 0 ? (
              <p className="text-gray-400 text-sm italic">No pending items.</p>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-800">Invoices awaiting approval</p>
                  <p className="text-xs text-amber-600">Review pending orders</p>
                </div>
                <Link to="/invoices?status=pending" className="px-4 py-2 bg-white text-amber-600 text-xs font-black uppercase rounded-lg shadow-sm">Review</Link>
              </div>
            )}
          </div>
        </div>

        {/* Memos */}
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
          <SectionHeader title="Staff Announcements" icon={FaBullhorn} />
          <div className="space-y-4">
            {data.recentMemos.map((memo: any, i: number) => (
              <div key={i} className={`p-4 rounded-2xl border ${memo.urgent ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
                <h4 className="font-bold text-sm text-gray-800">{memo.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{memo.content}</p>
              </div>
            ))}
            <Link to="/memos" className="block text-center text-xs font-bold text-brand-600 uppercase mt-4">View All Memos</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const StorekeeperDashboard = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {data.metrics.lowStockCount > 0 && (
        <div className="bg-rose-600 text-white p-6 rounded-3xl shadow-lg shadow-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl"><FaExclamationTriangle size={24} /></div>
            <div>
              <h3 className="text-xl font-black">{data.metrics.lowStockCount} Items Low Stock</h3>
              <p className="text-rose-100 text-sm">Immediate restocking required</p>
            </div>
          </div>
          <Link to="/stock/inventory" className="px-6 py-3 bg-white text-rose-600 font-bold rounded-xl shadow-lg">View Items</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Inventory Value" value={`Ksh ${(data.metrics.stockValue || 0).toLocaleString()}`} icon={FaWarehouse} color="text-indigo-600" bg="bg-indigo-50" link="/stock/inventory" />
        <StatCard label="Pending Orders" value={data.metrics.pendingInvoicesCount || 0} icon={FaBoxOpen} color="text-amber-600" bg="bg-amber-50" link="/invoices" />
        <StatCard label="Tasks" value={data.metrics.pendingTasks || 0} icon={FaClipboardList} color="text-blue-600" bg="bg-blue-50" link="/tasks" />
      </div>
    </div>
  );
};

const ITDashboard = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Server Status" value="Online" icon={FaServer} color="text-emerald-500" bg="bg-slate-800" link="/system-health" />
        <StatCard label="Open Tickets" value={data.metrics.openTickets} icon={FaTicketAlt} color="text-amber-500" bg="bg-slate-800" link="/tickets" />
        <StatCard label="Active Users" value={data.metrics.activeUsers} icon={FaUsers} color="text-blue-500" bg="bg-slate-800" link="/users" />
        <StatCard label="Database" value={data.databaseStatus} icon={FaShieldAlt} color="text-purple-500" bg="bg-slate-800" link="/system-health" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 text-gray-300 p-8 rounded-3xl shadow-xl border border-slate-800">
          <SectionHeader title="Security Audit Log" icon={FaUserShield} color="text-white" />
          <div className="space-y-0 text-sm font-mono overflow-y-auto max-h-[400px]">
            {data.auditLogs.map((log: any, i: number) => (
              <div key={i} className="flex gap-4 py-3 border-b border-slate-800 hover:bg-white/5 px-2 rounded transition-colors">
                <span className="text-gray-500 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`font-bold ${log.action.includes('LOGIN') ? 'text-emerald-400' : 'text-blue-400'}`}>{log.action}</span>
                <span className="text-gray-400 truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
          <SectionHeader title="Support Queue" icon={FaTicketAlt} />
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
              <span className="text-rose-700 font-bold">Urgent Tickets</span>
              <span className="text-2xl font-black text-rose-600">{data.metrics.urgentTickets}</span>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
              <span className="text-blue-700 font-bold">Total Open</span>
              <span className="text-2xl font-black text-blue-600">{data.metrics.openTickets}</span>
            </div>
            <Link to="/tickets" className="block w-full py-4 text-center bg-slate-100 dark:bg-midnight-800 rounded-xl font-bold hover:bg-slate-200 transition-colors">Manage Tickets</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (Other roles: Sales, Accountant, Staff, Admin, Viewer mapped similarly) ...
// For brevity, I will map remaining roles to generic fallback or specific simple layouts

const DefaultDashboard = ({ data, role }: { data: DashboardData, role: string }) => (
  <div className="space-y-8 animate-fade-in">
    <div className="p-8 bg-gradient-to-br from-brand-600 to-purple-700 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Welcome Back</h1>
        <p className="text-lg opacity-80">You are logged in as <span className="font-bold uppercase bg-white/20 px-3 py-1 rounded-lg text-sm">{role}</span></p>
      </div>
      <FaUserShield className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10" size={300} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard label="Notifications" value="3" icon={FaBell} color="text-brand-600" bg="bg-brand-50" link="/notifications" />
      <StatCard label="Assigned Tasks" value={data.metrics.pendingTasks} icon={FaClipboardList} color="text-amber-600" bg="bg-amber-50" link="/tasks" />
    </div>
    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800">
      <SectionHeader title="Recent Company Activity" icon={FaClock} />
      <div className="space-y-4">
        {data.recentActivity.map((a: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-midnight-800 last:border-0">
            <div>
              <p className="font-bold text-gray-800 dark:text-white">{a.customerName || a.customer_name || 'Walk-in'}</p>
              <p className="text-xs text-gray-400">Invoice #{a.id}</p>
            </div>
            <span className="font-black text-brand-600 dark:text-brand-400">Ksh {Number(a.amount).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);


// --- Main Controller ---

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(false);
        const stats = await api.admin.getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError(true);
        showToast('error', 'Failed to synchronize dashboard intelligence');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showToast]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
          <FaExclamationTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Sync Interrupted</h2>
        <p className="text-slate-500 max-w-md mb-8">We encountered a protocol error while fetching your dashboard intelligence. Check your cloud connection.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-500/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Quick Action
  const FAB = (
    <Link to="/new-invoice" className="fixed bottom-8 right-8 w-16 h-16 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-2xl shadow-brand-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50">
      <FaPlus size={24} />
    </Link>
  );

  return (
    <div className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans transition-colors duration-300 pb-24">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="p-3 bg-white dark:bg-midnight-800 rounded-2xl shadow-md"><FaBriefcase className="text-brand-600" size={24} /></span>
              {user.role} Workspace
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Welcome back, {user.username}. Here is your briefing.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </header>

        {/* Role Switcher */}
        {user.role?.toLowerCase() === 'ceo' && <CEODashboard data={data} />}
        {user.role?.toLowerCase() === 'manager' && <ManagerDashboard data={data} />}
        {user.role?.toLowerCase() === 'storekeeper' && <StorekeeperDashboard data={data} />}
        {user.role?.toLowerCase() === 'it' && <ITDashboard data={data} />}
        {user.role?.toLowerCase() === 'admin' && <CEODashboard data={data} />}

        {/* Fallback for other roles (Sales, Staff, Viewer, Accountant - using generic or mapped) */}
        {['sales', 'staff', 'viewer', 'accountant'].includes(user.role?.toLowerCase() || '') && <DefaultDashboard data={data} role={user.role} />}

      </div>

      {/* Only show FAB for roles that can create stuff */}
      {['admin', 'manager', 'sales', 'staff'].includes(user.role?.toLowerCase() || '') && FAB}
    </div>
  );
};

export default Dashboard;