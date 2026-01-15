// src/pages/Invoices.tsx
/**
 * Invoices List Page - Three Category System
 * 
 * Displays invoices organized into three categories:
 * - Quotations: Price quotes for potential clients
 * - Proforma Invoices: Preliminary invoices before final
 * - Invoices: Final invoices for payment
 * 
 * Features:
 * - "Financial Suite" standardized UI
 * - Tab-based navigation between categories
 * - Edit functionality for all document types
 * - Convert workflow (Quotation → Proforma → Invoice)
 * - Status management (internal use only, not shown in PDF)
 * - Search and filter capabilities
 */
import React, { useEffect, useState, useCallback } from "react";
import { FiPlus, FiFilter, FiDownload, FiTrash2, FiEdit3, FiEye, FiMoreVertical, FiCopy, FiRefreshCcw, FiSend, FiFileText } from "react-icons/fi";
import { FaFileSignature, FaFileInvoice, FaReceipt, FaSearch, FaSortAmountDown, FaSortAmountUp, FaDollarSign, FaFilePdf, FaEdit, FaEllipsisV, FaCheck, FaExchangeAlt, FaEnvelope, FaShareAlt, FaTrash, FaPlus, FaFilter } from "react-icons/fa";
import { useModal } from "../contexts/ModalContext";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import type { Invoice as InvoiceData, InvoiceType as DocumentType } from "../types/types";
import { useToast } from "../contexts/ToastContext";
import { useDebounce, useKeyboardShortcut } from "../hooks/useUtils";
import { usePermissions } from "../hooks/usePermissions";
import { api } from "../services/api";

// --- Constants ---
const Invoices = () => {
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { can } = usePermissions();

  // --- State ---
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentType>('quotation');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounced search for better performance
  useDebounce(searchTerm, 300);

  // Keyboard shortcut: Ctrl+N to create new invoice
  useKeyboardShortcut('n', () => navigate('/new-invoice'), true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // --- Data Loading ---
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.invoices.getAll();

      if (!Array.isArray(data)) {
        setInvoices([]);
        return;
      }

      // Backend already provides normalized data, but we can still map for safety
      const normalizedInvoices = data.map((raw: any) => {
        if (!raw || typeof raw !== 'object') return null;

        const customer = {
          id: raw.customer?.id || raw.customerId || raw.customer_id || '',
          name: raw.customer?.name || raw.customerName || raw.customer_name || 'N/A',
          phone: raw.customer?.phone || raw.customerPhone || raw.customer_phone || '',
          email: raw.customer?.email || raw.customerEmail || raw.customer_email || '',
          address: raw.customer?.address || raw.customerAddress || raw.customer_address || '',
          kraPin: raw.customer?.kraPin || raw.customerKraPin || raw.customer_kra_pin || ''
        };

        return {
          ...raw,
          customer,
          items: Array.isArray(raw.items) ? raw.items : []
        } as InvoiceData;
      }).filter(Boolean) as InvoiceData[];

      setInvoices(normalizedInvoices);
    } catch {
      showToast('error', 'Failed to load cloud invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // --- Actions ---
  const deleteInvoice = useCallback(async (id: string) => {
    const confirmed = await showConfirm("Delete this document? This action cannot be undone.");
    if (!confirmed) return;
    try {
      setLoading(true);
      await api.invoices.delete(id);
      showToast('success', 'Document deleted successfully');
      await loadInvoices();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      showToast('error', 'Failed to delete from cloud');
    } finally {
      setLoading(false);
    }
  }, [loadInvoices, showToast]);

  const handleBulkDelete = useCallback(async () => {
    const confirmed = await showConfirm(`Delete ${selectedIds.size} selected documents? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await api.invoices.delete(id);
      }
      showToast('success', `${selectedIds.size} documents deleted`);
      await loadInvoices();
      setSelectedIds(new Set());
    } catch {
      showToast('error', 'Failed to bulk delete from cloud');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, loadInvoices, showToast]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (filteredItems: InvoiceData[]) => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleShare = async (invoice: InvoiceData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${getTypeLabel(invoice.type)} ${invoice.id}`,
          text: `${getTypeLabel(invoice.type)} ${invoice.id} for ${invoice.customer?.name || "Client"}\nTotal: ${invoice.grandTotal?.toLocaleString() || 0} Ksh\nDate: ${invoice.issuedDate}`,
        });
      } catch {
        console.log('Error sharing');
      }
    } else {
      showToast('info', 'Sharing is not supported on this device/browser');
    }
  };

  const handleEmail = (invoice: InvoiceData) => {
    const email = invoice.customer?.email || "";
    if (!email) {
      showToast('warning', 'Client has no email address');
      return;
    }

    showToast('info', 'Opening email client...');
    const subject = `${getTypeLabel(invoice.type)} ${invoice.id}`;
    const body = `Dear ${invoice.customer?.name || "Client"},\n\nPlease find attached the ${getTypeLabel(invoice.type).toLowerCase()} ${invoice.id}.\n\nTotal: ${invoice.grandTotal?.toLocaleString() || 0} Ksh\n\nRegards,\nYour Company`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const updateInvoiceStatus = useCallback(async (id: string, newStatus: InvoiceData["status"]) => {
    try {
      setLoading(true);
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) return;

      const updatedInvoice = { ...invoice, status: newStatus };
      await api.invoices.update(updatedInvoice);
      showToast('success', 'Status updated successfully');
      await loadInvoices();
      setEditingStatus(null);
    } catch {
      showToast('error', 'Failed to update status on cloud');
    } finally {
      setLoading(false);
    }
  }, [invoices, loadInvoices, showToast]);

  const convertDocument = useCallback(async (invoice: InvoiceData, toType: DocumentType) => {
    const confirmed = await showConfirm(`Convert this ${invoice.type} to ${toType}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      // Preserve the suffix details (everything after the first hyphen)
      // e.g., QUO-20231025-01 -> PRO-20231025-01
      // e.g., QUO-1767741434920 -> PRO-1767741434920
      const parts = invoice.id.split('-');
      const suffix = parts.length > 1 ? parts.slice(1).join('-') : `${Date.now()}`;

      const prefixMap: Record<string, string> = {
        quotation: 'QUO',
        proforma: 'PRO',
        invoice: 'INV'
      };

      const newPrefix = prefixMap[toType] || 'DOC';
      const newId = `${newPrefix}-${suffix}`;

      const newDocument: InvoiceData = {
        ...invoice,
        id: newId,
        type: toType,
        status: 'draft',
        convertedFrom: invoice.id,
        issuedDate: new Date().toISOString().split('T')[0],
      };

      await api.invoices.create(newDocument);
      await loadInvoices();

      showToast('success', `Converted to ${toType}! New ID: ${newId}`);
      setActiveTab(toType);
    } catch {
      showToast('error', 'Failed to convert document on cloud');
    } finally {
      setLoading(false);
    }
  }, [loadInvoices, showToast]);

  // --- Filtering & Sorting ---
  const filteredByType = invoices.filter(inv => inv.type === activeTab);

  const filteredAndSorted = filteredByType.filter((inv) => {
    if (!inv) return false;

    // Status Filter
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;

    // Search
    const customerName = inv?.customer?.name || "";
    const invoiceId = inv?.id || "";
    return (
      (customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoiceId && invoiceId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }).sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (sortConfig.key === 'date') {
      return (new Date(a.issuedDate || '').getTime() - new Date(b.issuedDate || '').getTime()) * direction;
    }
    if (sortConfig.key === 'amount') {
      return ((a.grandTotal || 0) - (b.grandTotal || 0)) * direction;
    }
    if (sortConfig.key === 'name') {
      return (a.customer?.name || '').localeCompare(b.customer?.name || '') * direction;
    }
    return 0;
  });

  // --- Helper Functions ---
  const getStatusColor = (status: InvoiceData["status"]) => {
    switch (status) {
      case "paid": return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50";
      case "sent": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50";
      case "draft": return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
      case "cancelled": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'quotation': return 'Quotation';
      case 'proforma': return 'Proforma Invoice';
      case 'invoice': return 'Invoice';
    }
  };

  const getTypeCounts = () => {
    return {
      quotation: invoices.filter(inv => inv.type === 'quotation').length,
      proforma: invoices.filter(inv => inv.type === 'proforma').length,
      invoice: invoices.filter(inv => inv.type === 'invoice').length,
    };
  };

  const counts = getTypeCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-600 font-bold animate-pulse">Loading Documents...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-up delay-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Orders & Sales</h1>
            <p className="text-slate-500 dark:text-midnight-text-secondary mt-1 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Document Control Center
            </p>
          </div>

          <button
            onClick={() => navigate('/new-invoice')}
            className="mt-4 md:mt-0 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xl shadow-brand-600/30 transform hover:scale-105 active:scale-95 transition-all font-bold uppercase tracking-widest text-xs flex items-center gap-3 group"
          >
            <FaPlus className="group-hover:rotate-90 transition-transform duration-300" /> New Document
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden animate-slide-up delay-200">
          <div className="flex border-b border-gray-200 dark:border-midnight-800">
            {[
              { id: 'quotation', label: 'Quotations', icon: FaFileSignature },
              { id: 'proforma', label: 'Proforma', icon: FaFileInvoice },
              { id: 'invoice', label: 'Invoices', icon: FaReceipt }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocumentType)}
                className={`flex-1 py-5 flex items-center justify-center gap-3 transition-all relative ${activeTab === tab.id
                  ? 'bg-brand-50/50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800'
                  }`}
              >
                <tab.icon className={activeTab === tab.id ? 'scale-110' : ''} />
                <span className="text-xs font-black uppercase tracking-widest hidden md:inline">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                  {counts[tab.id as DocumentType]}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 shadow-[0_-2px_8px_rgba(37,99,235,0.5)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center animate-slide-up delay-300">
          <div className="relative group w-full lg:w-96">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              placeholder={`Search ${getTypeLabel(activeTab).toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-midnight-900 border-none rounded-2xl py-4 pl-14 pr-6 shadow-lg shadow-gray-200/20 dark:shadow-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-white dark:bg-midnight-900 border-none rounded-xl shadow-sm text-sm font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 cursor-pointer outline-none appearance-none"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={sortConfig.key}
                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                className="w-full pl-10 pr-8 py-3 bg-white dark:bg-midnight-900 border-none rounded-xl shadow-sm text-sm font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 cursor-pointer outline-none appearance-none"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Client Name</option>
              </select>
              <FaSortAmountDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={() => setSortConfig(c => ({ ...c, direction: c.direction === 'asc' ? 'desc' : 'asc' }))}
              className="p-3 bg-white dark:bg-midnight-900 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-brand-600 dark:text-gray-400"
            >
              {sortConfig.direction === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden animate-slide-up delay-400">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-midnight-950/50 border-b border-gray-100 dark:border-midnight-800">
                  <th className="px-6 py-5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                      onChange={() => handleSelectAll(filteredAndSorted)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Client Details</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">
                    {activeTab === 'quotation' ? 'Valid Until' : 'Due Date'}
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Total USD</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-gray-400">
                        <div className="bg-gray-50 dark:bg-midnight-800 p-4 rounded-full"><FaSearch size={24} /></div>
                        <p className="font-medium">No {getTypeLabel(activeTab).toLowerCase()}s found matching filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((inv, index) => {
                    const customerName = inv?.customer?.name || "N/A";
                    const issuedDate = inv?.issuedDate || inv?.date || "N/A";
                    const dueDate = inv?.dueDate || inv?.quotationValidUntil || "N/A";
                    const total = inv?.grandTotal || 0;
                    const isSelected = selectedIds.has(inv.id);
                    const isBottom = index >= filteredAndSorted.length - 3 && filteredAndSorted.length > 3;

                    return (
                      <tr key={inv?.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(inv.id)}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{inv?.id}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{customerName}</div>
                          <div className="text-[10px] text-gray-400 dark:text-midnight-text-secondary font-medium">
                            {inv?.customer?.phone && <span>{inv.customer.phone}</span>}
                            {inv?.customer?.email && <span> • {inv.customer.email}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-500 hidden sm:table-cell font-medium">{issuedDate}</td>
                        <td className="px-6 py-5 text-sm text-gray-500 hidden md:table-cell font-medium">{dueDate}</td>
                        <td className="px-6 py-5 font-black text-gray-900 dark:text-white">{(total || 0).toLocaleString()}</td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingStatus === inv?.id ? (
                            <div className="flex gap-1 bg-white dark:bg-midnight-800 p-1 rounded-lg shadow-xl border border-gray-100 dark:border-midnight-700 absolute z-50">
                              <button onClick={() => updateInvoiceStatus(inv?.id, "draft")} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">Draft</button>
                              <button onClick={() => updateInvoiceStatus(inv?.id, "sent")} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400">Sent</button>
                              <button onClick={() => updateInvoiceStatus(inv?.id, "paid")} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400">Paid</button>
                              <button onClick={() => setEditingStatus(null)} className="px-2 py-1 text-gray-400 hover:text-red-500">✕</button>
                            </div>
                          ) : (
                            <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wide rounded-full ${getStatusColor(inv?.status || "draft")}`}>
                              {inv?.status || "draft"}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 text-center px-4 relative">
                          <div className="flex justify-center gap-2">
                            {/* Primary Actions */}
                            <button
                              onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv, inv.type === 'quotation' ? 'QUOTATION' : inv.type === 'proforma' ? 'PROFORMA' : 'INVOICE', { includeDescriptions: true, currency: 'USD' }); }}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-lg transition-colors"
                              title="Download PDF (USD)"
                            >
                              <FaDollarSign size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv, inv.type === 'quotation' ? 'QUOTATION' : inv.type === 'proforma' ? 'PROFORMA' : 'INVOICE', { includeDescriptions: true, currency: 'Ksh' }); }}
                              className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-lg transition-colors"
                              title="Download PDF (Ksh)"
                            >
                              <FaFilePdf size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/new-invoice?id=${inv.id}&type=${inv.type.toLowerCase()}`); }}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                              title="Edit Document"
                            >
                              <FaEdit size={14} />
                            </button>

                            {/* Menu Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === inv.id ? null : inv.id);
                              }}
                              className={`text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-midnight-800 transition-colors ${openMenuId === inv.id ? 'bg-gray-100 dark:bg-midnight-800 text-gray-700 dark:text-white' : ''}`}
                            >
                              <FaEllipsisV size={14} />
                            </button>
                          </div>

                          {/* Dropdown Menu */}
                          {openMenuId === inv.id && (
                            <div className={`absolute right-12 w-56 bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-midnight-800 z-50 animate-scale-up overflow-hidden ${isBottom ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}>
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingStatus(inv?.id || null); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                  <FaCheck className="text-emerald-500" /> Update Status
                                </button>

                                {activeTab === 'quotation' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); convertDocument(inv, 'proforma'); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800 rounded-xl flex items-center gap-3 transition-colors"
                                  >
                                    <FaExchangeAlt className="text-indigo-500" /> To Proforma
                                  </button>
                                )}
                                {activeTab === 'proforma' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); convertDocument(inv, 'invoice'); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800 rounded-xl flex items-center gap-3 transition-colors"
                                  >
                                    <FaExchangeAlt className="text-indigo-500" /> To Invoice
                                  </button>
                                )}

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEmail(inv); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                  <FaEnvelope className="text-sky-500" /> Send Email
                                </button>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleShare(inv); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800 rounded-xl flex items-center gap-3 md:hidden transition-colors"
                                >
                                  <FaShareAlt className="text-blue-500" /> Share
                                </button>

                                <div className="h-px bg-gray-100 dark:bg-midnight-800 my-1"></div>

                                {can('/delete-invoice') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteInvoice(inv?.id || ""); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-3 transition-colors"
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-slide-up">
            <span className="font-bold text-sm uppercase tracking-wider">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-slate-700 dark:bg-gray-200"></div>
            {can('/delete-invoice') && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-rose-400 dark:text-rose-600 hover:text-white dark:hover:text-rose-700 transition-colors text-xs font-black uppercase tracking-widest"
              >
                <FaTrash /> Delete
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 text-slate-400 dark:text-gray-400 hover:text-white dark:hover:text-slate-900 transition-colors text-xs font-bold uppercase"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
