// src/pages/Dashboard.tsx
/**
 * Dashboard Component - The "Command Center"
 * 
 * Features:
 * - "Financial Suite" standardized UI.
 * - Real-time Revenue Chart using Recharts.
 * - Live Activity Feed simulating system events.
 * - Smart Alerts for business intelligence.
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  FaBell,
  FaBolt,
  FaBoxOpen,
  FaPlus,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaChartLine,
  FaUsers,
  FaFileInvoice,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye
} from "react-icons/fa";
import type { Product } from "../types/types";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { usePermissions } from "../hooks/usePermissions";
import AdminOverseer from "../components/AdminOverseer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// --- Interfaces ---
interface InvoiceLine {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  customer?: {
    name?: string;
  };
  clientName?: string;
  items?: InvoiceLine[];
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue" | "draft" | "sent" | "cancelled" | "paid" | "pending" | "overdue";
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  priceKsh: number;
}

const Dashboard: React.FC = () => {
  const { can, hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const isCEO = hasRole('ceo');
  const canViewFinancials = can('/analytics') || isAdmin || isCEO;

  // State
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<Record<string, StockItem[]>>({ products: [], mobilization: [], services: [] });
  const [loading, setLoading] = useState(true);

  // --- Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoicesData, stockData] = await Promise.all([
          api.invoices.getAll(),
          api.stock.getAll()
        ]);

        if (Array.isArray(invoicesData)) {
          setInvoices(invoicesData);
        }

        if (Array.isArray(stockData)) {
          // Map Backend (unitPrice) -> Frontend (priceKsh)
          const mappedStock = (stockData as any[]).map(s => ({
            ...s,
            priceKsh: Number(s.unitPrice || s.priceKsh || 0),
            priceUSD: Number(s.unitPriceUsd || s.priceUSD || 0)
          }));

          // Normalize stock data into categories
          const organizedStock: Record<string, StockItem[]> = { products: [], mobilization: [], services: [] };
          mappedStock.forEach(item => {
            const cat = item.category?.toLowerCase() || 'products';
            if (organizedStock[cat]) {
              organizedStock[cat].push(item as unknown as StockItem);
            } else {
              // Fallback for unknown categories
              if (!organizedStock['products']) organizedStock['products'] = [];
              organizedStock['products'].push(item as unknown as StockItem);
            }
          });
          setStock(organizedStock);
        }
      } catch {
        console.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Metrics & Intelligence ---
  const { metrics, chartData, recentActivity, smartAlerts } = useMemo(() => {
    const now = new Date();

    // 1. Financial Metrics
    const safeInvoices = Array.isArray(invoices) ? invoices.filter(Boolean) : [];
    const totalRevenue = safeInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);
    const paidInvoices = safeInvoices.filter(inv => (inv.status || "").toLowerCase() === "paid");
    const pendingInvoices = safeInvoices.filter(inv => ["pending", "sent", "draft"].includes((inv.status || "").toLowerCase()));
    const overdueInvoices = safeInvoices.filter(inv => (inv.status || "").toLowerCase() === "overdue");

    const averageOrderValue = safeInvoices.length > 0 ? totalRevenue / safeInvoices.length : 0;

    // Stock Value
    const stockItems = Object.values(stock).flat().filter(Boolean);
    const stockValue = stockItems.reduce((sum, item) => sum + ((Number(item.priceKsh) || 0) * (Number(item.quantity) || 0)), 0);
    const lowStockItems = stockItems.filter(item => (Number(item.quantity) || 0) < 5);

    // 2. Chart Data (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0
      };
    });

    safeInvoices.forEach(inv => {
      const dateStr = inv.issuedDate || inv.date || "";
      if (!dateStr) return;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return; // Skip invalid dates

      const monthData = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthData) {
        monthData.revenue += (Number(inv.grandTotal || inv.total) || 0);
      }
    });

    // 3. Recent Activity (Simulated from Invoices)
    const activity = safeInvoices
      .sort((a, b) => {
        const tA = new Date(a.issuedDate || a.date || "").getTime();
        const tB = new Date(b.issuedDate || b.date || "").getTime();
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      })
      .slice(0, 5)
      .map(inv => ({
        id: inv.id,
        type: 'order',
        message: `Order ${inv.id} created for ${inv.customer?.name || "Client"}`,
        time: inv.issuedDate || inv.date || "Just now",
        amount: Number(inv.grandTotal || inv.total) || 0
      }));

    // 4. Smart Alerts
    const alerts = [];
    if (overdueInvoices.length > 0) alerts.push({ type: 'danger', message: `${overdueInvoices.length} orders are overdue` });
    if (lowStockItems.length > 0) alerts.push({ type: 'warning', message: `${lowStockItems.length} items are running low on stock` });
    if (pendingInvoices.length > 5) alerts.push({ type: 'info', message: `${pendingInvoices.length} orders pending processing` });

    return {
      metrics: {
        totalRevenue,
        totalInvoices: invoices.length,
        averageOrderValue,
        stockValue,
        paidCount: paidInvoices.length,
        pendingInvoicesCount: pendingInvoices.length
      },
      chartData: last6Months,
      recentActivity: activity,
      smartAlerts: alerts
    };
  }, [invoices, stock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-600 font-bold animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-up delay-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Command Center</h1>
            <p className="text-slate-500 dark:text-midnight-text-secondary mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational • {new Date().toLocaleDateString()}
            </p>
          </div>
          <Link
            to="/new-invoice"
            title="Create a new Order"
            className="mt-4 md:mt-0 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-bold uppercase text-xs tracking-widest group"
          >
            <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">New Order</span>
          </Link>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up delay-200">
          {[
            { label: "Total Revenue", value: `Ksh ${(metrics.totalRevenue || 0).toLocaleString()}`, icon: FaMoneyBillWave, color: "text-brand-600", bg: "bg-brand-50", link: "/analytics", gradient: "from-blue-600 to-blue-700" },
            { label: "Pending Orders", value: metrics.pendingInvoicesCount.toString(), icon: FaFileInvoiceDollar, color: "text-amber-600", bg: "bg-amber-50", link: "/invoices", gradient: "from-amber-500 to-amber-600" },
            { label: "Avg. Order Value", value: `Ksh ${Math.round(metrics.averageOrderValue || 0).toLocaleString()}`, icon: FaChartLine, color: "text-emerald-600", bg: "bg-emerald-50", link: "/analytics", gradient: "from-emerald-500 to-emerald-600" },
            { label: "Stock Value", value: `Ksh ${(metrics.stockValue || 0).toLocaleString()}`, icon: FaUsers, color: "text-purple-600", bg: "bg-purple-50", link: "/stock/inventory", gradient: "from-purple-500 to-purple-600" }
          ].map((card, i) => (
            <Link key={i} to={card.link} className="block group">
              <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-midnight-text-secondary mb-1">{card.label}</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{card.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg} dark:bg-opacity-10 ${card.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <card.icon size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Revenue Chart */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up delay-300">

            {/* Revenue Chart */}
            {canViewFinancials ? (
              <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 transition-colors duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full"></div> Revenue Velocity
                  </h2>
                  <select title="Filter revenue period" className="text-xs font-bold uppercase bg-gray-50 dark:bg-midnight-950 border-none rounded-lg text-gray-500 dark:text-midnight-text-secondary focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-midnight-800 transition-colors px-3 py-1">
                    <option>Last 6 Months</option>
                  </select>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `Ksh${value / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#38bdf8' }}
                        formatter={(value: number) => [`Ksh ${(value || 0).toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-midnight-800 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-50 dark:bg-midnight-950 rounded-full mb-4">
                  <FaBolt className="text-gray-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-tight">Operational View Active</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-2 uppercase tracking-wide">Financial metrics are restricted to administrative roles.</p>
              </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
              <h2 className="text-sm font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
                Live Feed
              </h2>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-midnight-950 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors border border-gray-100 dark:border-midnight-800">
                        <FaFileInvoice className="text-gray-400 dark:text-gray-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" size={14} />
                      </div>
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-50 dark:bg-midnight-950 -z-10 last:hidden"></div>
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-50 dark:border-midnight-800 last:border-0 last:pb-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{activity.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                          <FaClock size={10} /> {activity.time}
                        </span>
                        <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-900/50">
                          Ksh {activity.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Overseer Integration */}
            {isAdmin && (
              <div className="mt-8 animate-slide-up">
                <AdminOverseer />
              </div>
            )}
          </div>

          {/* Right Column: Alerts & Quick Actions */}
          <div className="space-y-6 animate-slide-up delay-400">

            {/* Smart Alerts */}
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                <FaBell className="text-red-500" /> Intelligence
              </h2>
              <div className="space-y-3">
                {smartAlerts.length === 0 ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                    <FaCheckCircle /> All systems nominal.
                  </div>
                ) : (
                  smartAlerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 transition-transform hover:scale-105 cursor-default ${alert.type === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400' :
                      alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400' :
                        'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-400'
                      }`}>
                      <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 dark:bg-black text-white p-8 rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-800 dark:border-midnight-800">
              <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400">Quick Command</h2>
              <div className="space-y-3">
                <Link to="/new-invoice" title="Go to New Order page" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-brand-600 border border-white/10 transition-all group">
                  <span className="text-xs font-bold uppercase tracking-wider">Create New Order</span>
                  <FaPlus className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
                <Link to="/stock/inventory" title="Go to Stock Management" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-brand-600 border border-white/10 transition-all group">
                  <span className="text-xs font-bold uppercase tracking-wider">Manage Inventory</span>
                  <FaBoxOpen className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
                <Link to="/invoices" title="View all Orders" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-brand-600 border border-white/10 transition-all group">
                  <span className="text-xs font-bold uppercase tracking-wider">View All Orders</span>
                  <FaEye className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;