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
import { FiBarChart2 } from "react-icons/fi";
import logoUrl from "../assets/logo.jpg";
import { api } from "../services/api";
import { usePermissions } from "../hooks/usePermissions";


// Types
interface InvoiceItem {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  freight?: number;
}

interface Customer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  customer?: Customer;
  clientName?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  priceKsh: number;
  priceUSD?: number;
  weight?: number;
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

const Analytics: React.FC = () => {
  const { can, hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const isCEO = hasRole('ceo');
  const canViewFinancials = can('/analytics') || isAdmin || isCEO;

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [currency, setCurrency] = useState<"Ksh" | "USD">("Ksh");
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "1year">("30days");
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "customers" | "reports">("overview");
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [invoicesData, stockData] = await Promise.all([
          api.invoices.getAll(),
          api.stock.getAll()
        ]);
        if (Array.isArray(invoicesData)) setInvoices(invoicesData);
        if (Array.isArray(stockData)) setStock(stockData as StockItem[]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
      const invDate = new Date(inv.issuedDate || inv.date || "");
      return invDate >= filterDate;
    });
  }, [invoices, dateRange]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(inv => inv.status === "Paid");
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
    filteredInvoices.forEach(inv => {
      inv.items?.forEach(item => {
        const cat = item.category || "General";
        if (!catMap[cat]) catMap[cat] = { name: cat, total: 0, count: 0 };
        catMap[cat].total += item.totalPrice || 0;
        catMap[cat].count += (item.quantity || 1);
      });
    });

    // Trend
    const monthlyRev: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const d = new Date(inv.issuedDate || inv.date || "");
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthlyRev[key] = (monthlyRev[key] || 0) + (Number(inv.grandTotal || inv.total) || 0);
    });
    const trend = Object.entries(monthlyRev).map(([month, revenue]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRev,
      paidRev,
      taxLiability,
      growth,
      avgInv: filteredInvoices.length ? totalRev / filteredInvoices.length : 0,
      invCount: filteredInvoices.length,
      paidCount: paidInvoices.length,
      pendingCount: filteredInvoices.filter(i => i.status === "Pending").length,
      overdueCount: filteredInvoices.filter(i => i.status === "Overdue").length,
      topCustomers,
      categories: Object.values(catMap),
      trend,
      stockValue: stock.reduce((s, i) => s + (i.priceKsh * i.quantity), 0)
    };
  }, [invoices, filteredInvoices, stock, dateRange]);

  const displayAmt = (amt: number) => {
    const val = currency === "USD" ? amt / 130 : amt;
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse">Synchronizing Ledger...</p>
    </div>
  );

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
            <button onClick={() => window.print()} className="p-2.5 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-xl text-gray-500 hover:text-brand-600 transition-colors shadow-sm">
              <FaDownload size={18} />
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
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group cursor-default">
                  <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-500/20 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 -translate-y-4 translate-x-4"><FaChartLine size={80} /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-100 mb-1">Gross Revenue</p>
                    <h3 className="text-2xl font-black mb-2">{displayAmt(metrics.totalRev)}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-50 transition-all group-hover:translate-y-[-2px]">
                      <span className={`flex items-center ${metrics.growth >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} text-white px-1.5 py-0.5 rounded`}>
                        {metrics.growth >= 0 ? '↑' : '↓'} {Math.abs(metrics.growth).toFixed(1)}%
                      </span>
                      vs prev period
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Collection Efficiency</p>
                  <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mb-2">
                    {metrics.totalRev > 0 ? ((metrics.paidRev / metrics.totalRev) * 100).toFixed(1) : 0}%
                  </h3>
                  <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(metrics.paidRev / (metrics.totalRev || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Active Accounts</p>
                  <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 mb-2">{metrics.topCustomers.length}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-midnight-900 bg-amber-200" />)}
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Top Performers</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-midnight-950 rounded-3xl border border-gray-100 dark:border-midnight-800">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-midnight-text-secondary mb-1">Tax Provision (VAT)</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-midnight-text-primary mb-2">{displayAmt(metrics.taxLiability)}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Est. 16% Liability</p>
                </div>
              </div>

              {/* Centerpiece Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-50 dark:bg-midnight-950/50 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-600 rounded-full"></div> Quarterly Performance Velocity
                  </h4>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.trend}>
                        <defs>
                          <linearGradient id="velocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#velocity)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Category Liquidity</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.categories} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" nameKey="name">
                          {metrics.categories.map((c, i) => <Cell key={i} fill={[COLORS.indigo, COLORS.accent, COLORS.warning, COLORS.success][i % 4]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {metrics.categories.slice(0, 4).map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
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
                <div className="bg-gray-50 dark:bg-midnight-950 p-8 rounded-3xl border border-gray-100 dark:border-midnight-800">
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
                      {statusData.map((s, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-midnight-900 rounded-2xl border border-gray-100 dark:border-midnight-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
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
                  <h3 className="text-xl font-black mb-10 flex items-center gap-2 uppercase italic tracking-tighter">
                    <FaBolt className="text-brand-500" /> Linear Growth Projection
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.trend}>
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Forecast Margin</p>
                      <h4 className="text-xl font-black text-brand-400">+12.4%</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Confidence Score</p>
                      <h4 className="text-xl font-black text-emerald-400">92/100</h4>
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
                    {metrics.topCustomers.map((c, i) => (
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
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mr-auto">General Ledger Ledger</h3>
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search ledger by client, ID or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-midnight-950 border border-gray-100 dark:border-midnight-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-midnight-text-primary shadow-inner outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <FiBarChart2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button onClick={() => window.print()} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-2">
                  <FaDownload /> Print Report
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
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                {inv.status}
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
    </div>
  );
};

export default Analytics;
