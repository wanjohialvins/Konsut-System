// src/pages/Clients.tsx
/**
 * Client Management System
 * 
 * Manages the database of clients, including their contact details and transaction history.
 * 
 * Key Features:
 * - "Financial Suite" standardized UI.
 * - Client Database: CRUD operations for manual clients.
 * - Invoice Sync: Automatically extracts client profiles from existing invoices.
 * - Analytics: Calculates total revenue, invoice count, and standing (overdue/pending) per client.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSync,

  FaEraser,
  FaBuilding,
  FaDownload,
  FaFileImport,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaFileInvoice,
  FaTimes,
  FaIdCard
} from "react-icons/fa";
import { FiPlus, FiDownload, FiUpload, FiSearch, FiMail, FiPhone } from "react-icons/fi";
import { useModal } from "../../contexts/ModalContext";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import PDFPreviewModal from "../../components/modals/PDFPreviewModal";
import { usePDFPreview } from "../../hooks/usePDFPreview";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

import type { Client, Invoice as InvoiceData } from "../../types/types";

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

const safeLowerCase = (str: string | undefined): string => (str || "").toLowerCase();

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const Clients: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showConfirm } = useModal();

  const [clients, setClients] = useState<Client[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientInvoices, setClientInvoices] = useState<InvoiceData[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<'Ksh' | 'USD'>('Ksh');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const { previewUrl, previewTitle, previewPDF, closePreview } = usePDFPreview();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    kraPin: ""
  });

  /* -------------------------------------------------------------------------- */
  /*                                Data Loading                                */
  /* -------------------------------------------------------------------------- */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const clientsData = await api.clients.getAll();
      setClients(clientsData || []);
    } catch (err) {
      console.error("Failed to load data", err);
      showToast('error', 'Failed to load cloud data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch invoices for selected client
  useEffect(() => {
    const fetchInvoices = async () => {
      if (selectedClient) {
        try {
          const data = await api.invoices.getAll(undefined, selectedClient.id);
          setClientInvoices(data || []);
        } catch (err) {
          console.error("Failed to fetch client invoices", err);
          showToast('error', 'Failed to load client documents');
        }
      } else {
        setClientInvoices([]);
      }
    };
    fetchInvoices();
  }, [selectedClient, showToast]);

  /* -------------------------------------------------------------------------- */
  /*                                Logic                                       */
  /* -------------------------------------------------------------------------- */



  const syncClientsFromInvoices = useCallback(async () => {
    setSyncing(true);
    try {
      const invData: InvoiceData[] = await api.invoices.getAll();

      const manualClients = clients.filter(c => c.source === 'manual');
      const extracted = new Map<string, Client>();

      invData.forEach(inv => {
        const name = inv.customer?.name?.trim();
        const phone = inv.customer?.phone?.trim();
        const email = inv.customer?.email?.trim();

        if (name) {
          // Fix: Proper Composite Key to avoid duplicates on slight phone variations
          // Key = Name + (Email OR Phone)
          const primaryContact = email || phone || 'no-contact';
          const key = `${name.toLowerCase()}|${primaryContact.toLowerCase()}`;

          if (!extracted.has(key)) {
            extracted.set(key, {
              id: inv.customer?.id || `INV-${Date.now()}-${name.substring(0, 3)}`,
              name,
              phone: phone || "",
              email: email || "",
              address: inv.customer?.address || "",
              createdAt: inv.issuedDate || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: 'invoice'
            });
          }
        }
      });

      const newClients = [...manualClients, ...Array.from(extracted.values())];
      const unique = newClients.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.phone === v.phone)) === i);

      await api.clients.bulkCreateOrUpdate(unique);
      await loadData();
      showToast('success', 'Sync complete: Clients updated from invoices');
    } catch {
      showToast('error', 'Failed to sync clients from invoices');
    } finally {
      setSyncing(false);
    }
  }, [clients, loadData, showToast]);

  const handleExport = async () => {
    try {
      showToast('info', 'Exporting client database...');
      const { generateCSV } = await import('../../utils/csvHelper');
      const dataToExport = clients.map(c => ({
        id: c.id,
        name: c.name,
        company: c.company || '',
        phone: c.phone,
        email: c.email,
        address: c.address,
        kraPin: c.kraPin || '',
        source: c.source
      }));

      const csv = generateCSV(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_database_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Client list downloaded');
    } catch {
      showToast('error', 'Export failed');
    }
  };


  // handleViewPdf removed and replaced by previewPDF from usePDFPreview hook

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        showToast('info', 'Reading client file...');
        const { parseCSV } = await import('../../utils/csvHelper');
        const rows = parseCSV(text);

        if (rows.length === 0) {
          showToast('error', 'File appears empty');
          return;
        }

        // Map CSV fields to Client
        const clientsToImport = rows.map(r => ({
          id: r.id || `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: r.name || r.client || 'Unknown Client',
          company: r.company || r.organization || '',
          phone: r.phone || r.contact || '',
          email: r.email || '',
          address: r.address || '',
          kraPin: r.krapin || r.pin || '',
          source: 'manual' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })).filter(c => c.name && c.phone);

        if (clientsToImport.length === 0) {
          showToast('warning', 'No valid clients found (Name & Phone required)');
          return;
        }

        const confirmed = await showConfirm(`Import ${clientsToImport.length} clients?`);
        if (!confirmed) return;

        setLoading(true);
        await api.clients.bulkCreateOrUpdate(clientsToImport);
        await loadData();
        showToast('success', `${clientsToImport.length} clients imported`);

      } catch {
        showToast('error', 'Failed to parse CSV');
      } finally {
        setLoading(false);
        // Reset input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('warning', 'Name and Phone are required');
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        id: editingClient ? editingClient.id : `MANUAL-${Date.now()}`,
        ...formData,
        createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual' as const
      };

      if (editingClient) {
        await api.clients.update(clientData);
        showToast('success', 'Client updated successfully');
      } else {
        await api.clients.create(clientData);
        showToast('success', 'Client created successfully');
      }

      await loadData();
      setShowForm(false);
      setEditingClient(null);
      setFormData({ name: "", phone: "", email: "", address: "", company: "", kraPin: "" });
    } catch {
      showToast('error', 'Failed to save to cloud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Delete this client? This process cannot be undone.");
    if (confirmed) {
      setLoading(true);
      try {
        await api.clients.delete(id);
        showToast('success', 'Client deleted successfully');
        await loadData();
        setSelectedClient(null);
      } catch {
        showToast('error', 'Failed to delete from cloud');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  }, [clients, searchTerm]);

  /* -------------------------------------------------------------------------- */
  /*                                Render                                      */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-600 font-bold animate-pulse">Loading Client Database...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-midnight-950 min-h-screen font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-up delay-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Clients</h1>
            <p className="text-slate-500 dark:text-midnight-text-secondary mt-1 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Relationship Management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">

            <button onClick={handleExport} title="Export CSV" className="p-3 bg-white dark:bg-midnight-900 text-gray-600 dark:text-gray-300 rounded-xl hover:text-brand-600 hover:border-brand-200 border border-gray-100 dark:border-midnight-800 transition-colors shadow-sm">
              <FaDownload />
            </button>
            <label title="Import CSV" className="p-3 bg-white dark:bg-midnight-900 text-gray-600 dark:text-gray-300 rounded-xl hover:text-brand-600 hover:border-brand-200 border border-gray-100 dark:border-midnight-800 transition-colors shadow-sm cursor-pointer">
              <FaFileImport />
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>

            <button onClick={syncClientsFromInvoices} disabled={syncing} title="Sync from Invoices" className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 font-bold text-xs uppercase tracking-widest">
              <FaSync className={syncing ? "animate-spin" : ""} /> Sync
            </button>

            <button
              id="clients-add-btn"
              onClick={() => { setEditingClient(null); setFormData({ name: "", phone: "", email: "", address: "", company: "", kraPin: "" }); setShowForm(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-600/30 font-bold text-xs uppercase tracking-widest transform hover:scale-105 active:scale-95"
            >
              <FiPlus /> New Client
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up delay-200">
          <div className="p-6 bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Portfolio Health</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {clients.filter(c => (c.overdueCount || 0) === 0).length} <span className="text-sm font-bold opacity-60">Stable</span>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending Collections</div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {clients.reduce((acc, c) => acc + (c.pendingCount || 0), 0)} <span className="text-sm font-bold opacity-60">Outstanding</span>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Accounts at Risk</div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {clients.filter(c => (c.overdueCount || 0) > 0).length} <span className="text-sm font-bold opacity-60">High Priority</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative group animate-slide-up delay-300">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors text-lg" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, company, email..."
            className="w-full bg-white dark:bg-midnight-900 border-none rounded-2xl py-5 pl-14 pr-6 shadow-xl shadow-gray-200/40 dark:shadow-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-400"
          />
        </div>

        {/* Client Table */}
        <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden animate-slide-up delay-400">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-midnight-950/50 border-b border-gray-100 dark:border-midnight-800">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Client Profile</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Info</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Financials</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Last Active</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                {filteredClients.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-400 font-medium">No clients found matching your search.</td></tr>
                ) : (
                  filteredClients.map(client => {
                    const initials = getInitials(client.name);
                    const avatarColor = stringToColor(client.name);

                    return (
                      <tr key={client.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ backgroundColor: avatarColor }}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors text-base">{client.name}</div>
                              {client.company && <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 flex items-center gap-1"><FaBuilding size={10} /> {client.company}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium"><FaEnvelope className="text-gray-300" size={12} /> {client.email || <span className="text-gray-300 italic">No Email</span>}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium"><FaPhone className="text-gray-300" size={12} /> {client.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-gray-900 dark:text-white">Ksh {Math.round(Number(client.totalRevenue || 0)).toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{client.totalInvoices} Invoices</div>
                        </td>
                        <td className="px-6 py-5">
                          {(client.overdueCount || 0) > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wide border border-rose-200 dark:border-rose-900/50">Overdue</span>
                          ) : (client.pendingCount || 0) > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wide border border-amber-200 dark:border-amber-900/50">Pending</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wide border border-emerald-200 dark:border-emerald-900/50">Good Standing</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-gray-500">
                          {client.lastActive ? new Date(client.lastActive).toLocaleDateString() : <span className="opacity-50">Never</span>}
                        </td>
                        <td className="px-6 py-5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); setSelectedClient(client); }} className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 bg-gray-50 dark:bg-midnight-950 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors border border-gray-200 dark:border-midnight-800" title="View Details">
                              <FaEye />
                            </button>
                            <button onClick={e => { e.stopPropagation(); navigate(`/new-invoice?clientId=${client.id}`); }} className="p-2 text-blue-400 hover:text-blue-600 bg-gray-50 dark:bg-midnight-950 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-gray-200 dark:border-midnight-800" title="Create Invoice">
                              <FaFileInvoice />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-100 dark:border-midnight-800">
            <div className="bg-gray-50/50 dark:bg-midnight-950/50 p-6 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center">
              <h2 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">{editingClient ? "Edit Client" : "Add New Client"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-midnight-800 p-2 rounded-full shadow-sm"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Name</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white" placeholder="+254..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
                <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Company</label>
                  <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white" placeholder="Company Ltd" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">KRA PIN</label>
                  <input value={formData.kraPin} onChange={e => setFormData({ ...formData, kraPin: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white" placeholder="P0..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Address</label>
                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium dark:text-white resize-none" rows={2} />
              </div>

              <button type="submit" className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 transform hover:scale-[1.02] active:scale-[0.98]">
                {editingClient ? "Update Client Profile" : "Create Client Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-midnight-800">
            <div className="p-8 relative">
              <button onClick={() => setSelectedClient(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-50 dark:bg-midnight-800 p-2 rounded-full transition-colors"><FaTimes size={16} /></button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl transform rotate-3" style={{ backgroundColor: stringToColor(selectedClient.name) }}>
                    {getInitials(selectedClient.name)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{selectedClient.name}</h2>
                    <div className="text-gray-500 dark:text-gray-400 flex items-center gap-4 text-sm font-medium">
                      <span className="flex items-center gap-2"><FaEnvelope className="text-brand-500" /> {selectedClient.email || "No Email"}</span>
                      <span className="flex items-center gap-2"><FaPhone className="text-brand-500" /> {selectedClient.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-midnight-950 p-1 rounded-2xl border border-gray-200 dark:border-midnight-800">
                  <button
                    onClick={() => setDisplayCurrency('Ksh')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${displayCurrency === 'Ksh' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    KES
                  </button>
                  <button
                    onClick={() => setDisplayCurrency('USD')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${displayCurrency === 'USD' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    USD
                  </button>
                </div>
              </div>

              {selectedClient.company && <div className="text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-widest mb-6 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg inline-block border border-brand-100 dark:border-brand-900/50">{selectedClient.company}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Lifetime Value</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    Ksh {(selectedClient.totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Orders</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {selectedClient.totalInvoices || 0}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Risk Status</div>
                  <div className={`text-xl font-black ${(selectedClient.overdueCount || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {(selectedClient.overdueCount || 0) > 0 ? "High Risk" : "Low Risk"}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><FaIdCard /> Billing Details</h3>
                <div className="bg-gray-50 dark:bg-midnight-950 p-6 rounded-2xl text-sm border border-gray-100 dark:border-midnight-800 flex flex-col gap-3">
                  <div className="flex justify-between border-b border-gray-200 dark:border-midnight-800 pb-2">
                    <span className="text-gray-500 font-medium">Physical Address</span>
                    <span className="text-gray-900 dark:text-white font-bold">{selectedClient.address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500 font-medium">KRA PIN Number</span>
                    <span className="text-gray-900 dark:text-white font-bold font-mono">{selectedClient.kraPin || "Not provided"}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><FaFileInvoice /> Client Documents</h3>
                <div className="bg-gray-50 dark:bg-midnight-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-midnight-800 max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 dark:bg-midnight-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500">ID</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500">Date</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500">Total</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500">Status</th>
                        <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-midnight-700">
                      {clientInvoices.sort((a, b) => new Date(b.issuedDate || '').getTime() - new Date(a.issuedDate || '').getTime()).map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-100 dark:hover:bg-midnight-800 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{doc.id}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{doc.issuedDate}</td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-xs">{(doc.grandTotal || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${(doc.status || '').toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              (doc.status || '').toLowerCase() === 'pending' || (doc.status || '').toLowerCase() === 'sent' ? 'bg-blue-100 text-blue-700' :
                                (doc.status || '').toLowerCase() === 'overdue' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                              }`}>{doc.status || 'draft'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => previewPDF(doc.id, doc.type, displayCurrency)}
                                className="px-2 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase rounded transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/new-invoice?id=${doc.id}&type=${doc.type}`)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setShowForm(true); setEditingClient(selectedClient); setSelectedClient(null); }} className="flex-1 bg-white dark:bg-midnight-800 text-gray-700 dark:text-gray-200 py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-midnight-700 border border-gray-200 dark:border-midnight-700 transition-colors shadow-sm">
                  Edit Profile
                </button>
                <button onClick={() => handleDelete(selectedClient.id)} className="flex-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 transition-colors">
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PDFPreviewModal
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={previewTitle}
      />
    </div>
  );
};

export default Clients;