// src/pages/Analytics.tsx
// Comprehensive Analytics Dashboard for KONSUT Ltd

import React, { useEffect, useState, useMemo } from "react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  FaChartLine, FaChartBar, FaDollarSign, FaFileInvoice,
  FaUsers, FaDownload, FaBolt
} from "react-icons/fa";
import { FiBarChart2, FiSearch } from "react-icons/fi";
import logoUrl from "../../assets/logo.jpg";
import { api } from "../../services/api";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import { DashboardSkeleton } from "../../components/skeletons/CommonSkeletons";
import { usePermissions } from "../../hooks/usePermissions";
import ReportPreviewModal from "../../components/modals/ReportPreviewModal";


import type { Invoice, Product as StockItem, InvoiceItem as BaseInvoiceItem } from "../../types/types";

// Extended interface to handle analytics specific fields and optional compatibility
interface InvoiceData extends Omit<Invoice, 'items' | 'status'> {
  clientName?: string;
  total?: number;
  items?: (BaseInvoiceItem & { totalPrice?: number })[];
  status: string;
}

// Constants
const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  indigo: "#6366f1",
  accent: "#f43f5e",
};

/**
 * Analytics Dashboard Component
 * 
 * Provides a comprehensive financial overview of the organization.
 * 
 * Features:
 * - Real-time KPI tracking (Revenue, Collection Efficiency, etc.)
 * - Interactive charts (Revenue trends, category breakdown)
 * - Financial Pulse AI (Growth projections & risk assessment)
 * - Detailed Ledger reporting
 * 
 * Access Control: Restricted to Admin and CEO roles, or users with specific '/analytics' permission.
 */
const Analytics: React.FC = () => {
  const { can, hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const isCEO = hasRole('ceo');
  const canViewFinancials = can('/analytics') || isAdmin || isCEO;

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [backendStats, setBackendStats] = useState<any>(null);
  const [currency, setCurrency] = useState<"Ksh" | "USD">("Ksh");
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "1year">("30days");
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "customers" | "reports">("overview");
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Load data from API
  // Fetches Invoices and Stock data in parallel to minimize load time.
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365;
        const [invoicesData, stockData, stats] = await Promise.all([
          api.invoices.getAll(),
          api.stock.getAll(),
          api.admin.getAnalyticsStats(days)
        ]);

        if (invoicesData && Array.isArray(invoicesData)) {
          setInvoices(invoicesData as unknown as InvoiceData[]);
        }

        if (stockData && Array.isArray(stockData)) {
          setStock(stockData);
        }
        if (stats) {
          setBackendStats(stats);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRange]);

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    if (!invoices.length) return [];
    const now = new Date();
    const filterDate = new Date();
    switch (dateRange) {
      case "7days": filterDate.setDate(now.getDate() - 7); break;
      case "30days": filterDate.setDate(now.getDate() - 30); break;
      case "90days": filterDate.setDate(now.getDate() - 90); break;
      case "1year": filterDate.setFullYear(now.getFullYear() - 1); break;
    }
    return invoices.filter(inv => {
      const dateStr = inv.issuedDate || inv.date || "";
      if (!dateStr) return false;
      // Handle YYYY-MM-DD or DD/MM/YYYY or ISO
      const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
      let d: Date;
      if (parts.length === 3) {
        if (parts[0].length === 4) d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        else d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        d = new Date(dateStr);
      }
      return d >= filterDate;
    });
  }, [invoices, dateRange]);

  // Metrics Calculation
  // Memoized for performance: recalculates only when invoices, stock, or date range changes.
  const metrics = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === "paid");
    const totalRev = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);
    const paidRev = paidInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);

    // Tax Estimation (16% VAT default)
    const taxLiability = totalRev * 0.16;

    // Growth Comparison (Contextual to dateRange)
    const now = new Date();
    const prevFilter = new Date();
    if (dateRange === "30days") prevFilter.setDate(now.getDate() - 60);
    else if (dateRange === "7days") prevFilter.setDate(now.getDate() - 14);
    else prevFilter.setFullYear(now.getFullYear() - 2);

    const prevPeriodInvoices = invoices.filter(inv => {
      const d = new Date(inv.issuedDate || inv.date || "");
      const cutoff = new Date();
      if (dateRange === "30days") cutoff.setDate(now.getDate() - 30);
      else if (dateRange === "7days") cutoff.setDate(now.getDate() - 7);
      return d >= prevFilter && d < cutoff;
    });

    const prevRev = prevPeriodInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);
    const growth = prevRev > 0 ? ((totalRev - prevRev) / prevRev) * 100 : 0;

    // Customer Insights
    const customerMap: Record<string, { name: string; total: number; count: number; lastOrder: string }> = {};
    invoices.forEach(inv => {
      const name = inv.customer?.name || inv.clientName || "Unknown";
      if (!customerMap[name]) customerMap[name] = { name, total: 0, count: 0, lastOrder: "" };
      const amt = Number(inv.grandTotal || inv.total) || 0;
      customerMap[name].total += amt;
      customerMap[name].count += 1;
      const d = inv.issuedDate || inv.date || "";
      if (d > customerMap[name].lastOrder) customerMap[name].lastOrder = d;
    });
    const topCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 10);

    // Categories
    const catMap: Record<string, { name: string; total: number; count: number }> = {};
    filteredInvoices.forEach((inv: InvoiceData) => {
      inv.items?.forEach((item: BaseInvoiceItem & { totalPrice?: number }) => {
        const cat = item.category || "General";
        if (!catMap[cat]) catMap[cat] = { name: cat, total: 0, count: 0 };
        catMap[cat].total += item.lineTotal || item.totalPrice || 0;
        catMap[cat].count += (item.quantity || 1);
      });
    });

    // Trend
    const monthlyRev: Record<string, number> = {};
    filteredInvoices.forEach((inv: InvoiceData) => {
      const dateStr = inv.issuedDate || inv.date || "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthlyRev[key] = (monthlyRev[key] || 0) + (Number(inv.grandTotal || inv.total) || 0);
    });
    const trend = Object.entries(monthlyRev).map(([month, revenue]: [string, number]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));

    const monthlyData = Array.from({ length: 12 }, (_: unknown, i: number) => {
      const month = new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
      const val = filteredInvoices
        .filter((inv: InvoiceData) => new Date(inv.issuedDate || inv.date || "").getMonth() === i)
        .reduce((sum: number, inv: InvoiceData) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);
      return { name: month, value: val };
    });

    return {
      totalRev,
      paidRev,
      taxLiability,
      growth,
      avgInv: filteredInvoices.length ? totalRev / filteredInvoices.length : 0,
      invCount: filteredInvoices.length,
      monthlyData,
      stockValue: stock.reduce((s, i) => s + ((i.priceKsh || 0) * (i.quantity || 0)), 0),
      categories: backendStats?.categories || Object.values(catMap),
      trend: backendStats?.trend || trend,
      topCustomers: backendStats?.topCustomers || topCustomers,
      paidCount: backendStats?.statusMatrix?.paid ?? paidInvoices.length,
      pendingCount: backendStats?.statusMatrix?.pending ?? filteredInvoices.filter(i => ["pending", "sent", "draft"].includes(i.status?.toLowerCase())).length,
      overdueCount: backendStats?.statusMatrix?.overdue ?? filteredInvoices.filter(i => i.status?.toLowerCase() === "overdue").length,
    };
  }, [invoices, filteredInvoices, stock, dateRange, backendStats]);

  const displayAmt = (amt: number | undefined | null) => {
    const safeAmt = Number(amt) || 0;
    const val = currency === "USD" ? safeAmt / 130 : safeAmt;
    return `${currency === "USD" ? "$" : "Ksh"} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statusData = [
    { name: "Paid", value: metrics.paidCount, color: COLORS.success },
    { name: "Pending", value: metrics.pendingCount, color: COLORS.warning },
    { name: "Overdue", value: metrics.overdueCount, color: COLORS.danger }
  ];

  if (!canViewFinancials) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-midnight-950">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  /**
   * Prepares and opens the Financial Intelligence Report modal.
   * Aggregates current metrics into a structured report object.
   */
  const handleGenerateReport = () => {
    const reportData = {
      title: "Financial Intelligence Report",
      period: dateRange === "1year" ? "Annual Report" : `Last ${dateRange.replace("days", " Days")}`,
      currency: currency,
      metrics: [
        { label: "Total Revenue", value: displayAmt(metrics.totalRev), trend: metrics.growth, type: 'currency' as const },
        { label: "Paid Revenue", value: displayAmt(metrics.paidRev), type: 'currency' as const },
        { label: "Avg Invoice", value: displayAmt(metrics.avgInv), type: 'currency' as const },
        { label: "Active Clients", value: metrics.topCustomers.length, type: 'number' as const },
        { label: "Pending Invoices", value: metrics.pendingCount, type: 'number' as const },
        { label: "Overdue Invoices", value: metrics.overdueCount, type: 'number' as const },
      ],
      chartData: metrics.monthlyData,
      topClients: metrics.topCustomers.map((c: { name: string; total: number; count: number }) => ({ name: c.name, revenue: c.total, count: c.count })),
      ledgerData: filteredInvoices.map((inv: InvoiceData) => ({
        id: inv.id,
        name: inv.customer?.name || inv.clientName || "Unknown",
        type: inv.type,
        date: inv.issuedDate || inv.date || "",
        value: Number(inv.grandTotal || inv.total) || 0
      }))
    };
    setReportData(reportData);
    setIsReportModalOpen(true);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen transition-colors duration-300 font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 mt-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white dark:bg-midnight-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-midnight-800">
              <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2 uppercase">Financial Suite</h1>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-midnight-text-secondary uppercase tracking-[0.2em]">
                {isAdmin ? <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400"><FaBolt /> Enterprise Admin</div> : "Standard Financial Overview"}
                <span>•</span>
                <span>Live Intelligence</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-white dark:bg-midnight-900 p-1 rounded-xl border border-gray-100 dark:border-midnight-800 shadow-sm">
              {["7days", "30days", "90days", "1year"].map(dr => (
                <button
                  key={dr}
                  onClick={() => setDateRange(dr as "7days" | "30days" | "90days" | "1year")}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${dateRange === dr ? "bg-brand-600 text-white shadow-lg" : "text-gray-500 dark:text-midnight-text-secondary hover:bg-gray-50 dark:hover:bg-midnight-800"}`}
                >
                  {dr === "1year" ? "Annual" : dr.replace("days", "d")}
                </button>
              ))}
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "Ksh" | "USD")}
              className="px-4 py-2.5 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-xl text-sm font-bold text-gray-700 dark:text-midnight-text-primary focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
            >
              <option value="Ksh">KES / Ksh</option>
              <option value="USD">USD / $</option>
            </select>
            <button onClick={handleGenerateReport} className="p-2.5 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-xl text-gray-500 hover:text-brand-600 transition-colors shadow-sm" title="Preview Summary">
              <FaChartLine size={18} />
            </button>
          </div>
        </header>

        {/* Tab System */}
        <div className="flex gap-1 mb-8">
          {[
            { id: "overview", label: "Overview", icon: FaChartBar },
            { id: "revenue", label: "Revenue Matrix", icon: FaDollarSign },
            { id: "customers", label: "Client Equity", icon: FaUsers },
            { id: "reports", label: "Ledger Reports", icon: FaFileInvoice }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "overview" | "revenue" | "customers" | "reports")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-sm font-bold tracking-tight transition-all border-b-2 ${activeTab === tab.id
                ? "bg-brand-600 text-white border-brand-600 shadow-[0_-4px_10px_rgba(37,99,235,0.1)]"
                : "text-gray-500 dark:text-midnight-text-secondary hover:bg-white dark:hover:bg-midnight-900 border-transparent"
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-midnight-900 rounded-2xl rounded-tl-none border border-gray-100 dark:border-midnight-800 shadow-xl shadow-gray-200/40 dark:shadow-none p-6 md:p-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-fade-in">
              {/* Financial Pulse Intelligence */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-md border border-white/20">
                      <FaBolt size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl tracking-tight">Financial Pulse AI</h3>
                      <p className="text-blue-100 text-sm font-medium">Real-time intelligence active. Market velocity is <span className={`${metrics.growth >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-bold`}>{metrics.growth >= 0 ? 'Accelerating' : 'Decelerating'}</span>.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="px-4 py-2 bg-black/20 rounded-lg text-white/90 text-xs font-bold uppercase tracking-widest border border-white/10">
                      Cashflow: Healthy
                    </div>
                    <div className="px-4 py-2 bg-black/20 rounded-lg text-white/90 text-xs font-bold uppercase tracking-widest border border-white/10">
                      Projection: {metrics.growth >= 0 ? '+' : ''}{metrics.growth.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group cursor-default">
                  <div className="p-6 bg-glass-dark dark:bg-glass rounded-3xl text-gray-900 dark:text-white shadow-brand overflow-hidden border border-glass backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-4 translate-x-4"><FaChartLine size={80} /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-300 mb-1">Gross Revenue</p>
                    <h3 className="text-2xl font-black mb-2">{displayAmt(metrics.totalRev)}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 transition-all group-hover:translate-y-[-2px]">
                      <span className={`flex items-center ${metrics.growth >= 0 ? 'bg-emerald-400/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-400/20 text-rose-600 dark:text-rose-400'} px-1.5 py-0.5 rounded`}>
                        {metrics.growth >= 0 ? '↑' : '↓'} {Math.abs(metrics.growth).toFixed(1)}%
                      </span>
                      vs prev period
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/50 dark:bg-midnight-800/50 rounded-3xl border border-gray-100 dark:border-midnight-800 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Collection Efficiency</p>
                  <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mb-2">
                    {metrics.totalRev > 0 ? ((metrics.paidRev / metrics.totalRev) * 100).toFixed(1) : 0}%
                  </h3>
                  <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(metrics.paidRev / (metrics.totalRev || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-6 bg-white/50 dark:bg-midnight-800/50 rounded-3xl border border-gray-100 dark:border-midnight-800 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Active Accounts</p>
                  <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 mb-2">{metrics.topCustomers.length}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-midnight-900 bg-amber-200" />)}
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Top Performers</span>
                  </div>
                </div>

                <div className="p-6 bg-white/50 dark:bg-midnight-800/50 rounded-3xl border border-gray-100 dark:border-midnight-800 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-midnight-text-secondary mb-1">Tax Provision (VAT)</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-midnight-text-primary mb-2">{displayAmt(metrics.taxLiability)}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Est. 16% Liability</p>
                </div>
              </div>

              {/* Centerpiece Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-midnight-800 shadow-xl dark:shadow-none">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-600 rounded-full"></div> Quarterly Performance Velocity
                  </h4>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.trend}>
                        <defs>
                          <linearGradient id="velocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fill="url(#velocity)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-midnight-800 shadow-xl dark:shadow-none">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Category Liquidity</h4>
                  <div className="h-[300px] flex items-center justify-center relative">
                    {metrics.categories.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">Insufficient Data</div>}
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.categories} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" nameKey="name" stroke="none">
                          {metrics.categories.map((_c: any, i: number) => <Cell key={i} fill={[COLORS.indigo, COLORS.accent, COLORS.warning, COLORS.success][i % 4]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {metrics.categories.slice(0, 4).map((c: { name: string; total: number }, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-gray-50 dark:border-midnight-800 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-gray-400 dark:text-midnight-text-secondary">{c.name}</span>
                        <span className="font-black text-gray-900 dark:text-midnight-text-primary">{displayAmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'revenue' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/80 dark:bg-midnight-950 p-8 rounded-3xl border border-gray-100 dark:border-midnight-800 backdrop-blur-sm">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter italic">Status Distribution Matrix</h3>
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-[250px] w-full max-w-[250px]">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={statusData} innerRadius={80} outerRadius={100} dataKey="value" stroke="none">
                            {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      {statusData.map((s: { name: string; value: number; color: string }, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-midnight-900 rounded-2xl border border-gray-100 dark:border-midnight-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: s.color, color: s.color }}></div>
                            <span className="text-sm font-black text-gray-900 dark:text-midnight-text-primary uppercase tracking-widest">{s.name}</span>
                          </div>
                          <span className="text-lg font-black text-gray-900 dark:text-midnight-text-primary">{s.value} <small className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Invoices</small></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 blur-[100px] rounded-full"></div>
                  <h3 className="text-xl font-black mb-10 flex items-center gap-2 uppercase italic tracking-tighter relative z-10">
                    <FaBolt className="text-brand-500" /> Linear Growth Projection
                  </h3>
                  <div className="h-[250px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.trend}>
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Forecast Margin</p>
                      <h4 className="text-xl font-black text-brand-400">{metrics.growth >= 0 ? '+' : ''}{(metrics.growth * 0.8).toFixed(1)}%</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Confidence Score</p>
                      <h4 className="text-xl font-black text-emerald-400">{Math.min(100, 60 + (metrics.invCount))}/100</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Top 10 High-Value Accounts</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-midnight-950 px-3 py-1 rounded-full border border-gray-100 dark:border-midnight-800">Ranked by Lifetime Equity</span>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-midnight-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-midnight-950/50">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Client Tier</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entity Identity</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vol. Index</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Engagement</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Equity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-midnight-800">
                    {metrics.topCustomers.map((c: { name: string; total: number; count: number; lastOrder: string }, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-midnight-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all ${i === 0 ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40 scale-110" : "bg-gray-100 dark:bg-midnight-800 text-gray-400"}`}>{i + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-gray-900 dark:text-midnight-text-primary capitalize">{c.name}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-400 dark:text-midnight-text-secondary">{c.count} Invoices</td>
                        <td className="px-6 py-4 font-bold text-gray-400 dark:text-midnight-text-secondary underline decoration-brand-500/30 underline-offset-4">{c.lastOrder || 'Legacy'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-gray-900 dark:text-midnight-text-primary text-base">{displayAmt(c.total)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mr-auto">General Ledger</h3>
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search ledger by client, ID or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-midnight-950 border border-gray-100 dark:border-midnight-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-midnight-text-primary shadow-inner outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button onClick={handleGenerateReport} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-2">
                  <FiBarChart2 /> Generate Report
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-midnight-800">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-midnight-950 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Entity</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-midnight-800 text-sm">
                      {filteredInvoices
                        .filter(inv => {
                          const s = searchTerm.toLowerCase();
                          return inv.id?.toLowerCase().includes(s) ||
                            (inv.customer?.name || inv.clientName || "").toLowerCase().includes(s) ||
                            inv.status.toLowerCase().includes(s);
                        })
                        .map((inv, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-midnight-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-brand-600 dark:text-brand-400">#{inv.id}</td>
                            <td className="px-6 py-4 font-bold text-gray-400">{inv.issuedDate || inv.date}</td>
                            <td className="px-6 py-4 font-black text-gray-900 dark:text-midnight-text-primary uppercase tracking-tight">{inv.customer?.name || inv.clientName}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status?.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                inv.status?.toLowerCase() === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                {inv.status || 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-midnight-text-primary">
                              {displayAmt(Number(inv.grandTotal || inv.total || 0))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {reportData && (
        <ReportPreviewModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          data={reportData}
        />
      )}
    </div>
  );
};

export default Analytics;
