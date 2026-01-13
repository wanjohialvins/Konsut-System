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
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaEye,
  FaTimes,
  FaSync,
  FaDownload,
  FaSeedling,
  FaEraser,
  FaBuilding,
  FaGlobeAfrica,
  FaIdCard,
  FaFileImport
} from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  company?: string;
  kraPin?: string;
  createdAt: string;
  updatedAt: string;
  source: 'invoice' | 'draft' | 'manual';
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  grandTotal?: number;
  total?: number;
  type: string;
  status: "Paid" | "Pending" | "Overdue" | "draft" | "cancelled";
  customer?: { id?: string; name?: string; phone?: string; email?: string; address?: string };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

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

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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
      const [clientsData, invoicesData] = await Promise.all([
        api.clients.getAll(),
        api.invoices.getAll()
      ]);
      setClients(clientsData || []);
      setInvoices(invoicesData || []);
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

  /* -------------------------------------------------------------------------- */
  /*                                Logic                                       */
  /* -------------------------------------------------------------------------- */

  const clientStats = useMemo(() => {
    const stats: Record<string, { totalRevenue: number; totalInvoices: number; lastActive: string | null; pending: number; overdue: number }> = {};

    clients.forEach(c => {
      const cInvoices = invoices.filter(inv => {
        const iName = inv.customer?.name || inv.customerName;
        const iPhone = inv.customer?.phone || inv.customerPhone;
        const iEmail = inv.customer?.email || inv.customerEmail;
        return iName === c.name || iPhone === c.phone || iEmail === c.email;
      });

      const totalRevenue = cInvoices.reduce((sum, inv) => {
        if (inv.type === 'invoice' && inv.status !== 'cancelled') {
          return sum + (inv.grandTotal || inv.total || 0);
        }
        return sum;
      }, 0);
      const dates = cInvoices
        .map(inv => inv.issuedDate || inv.date)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

      stats[c.id] = {
        totalRevenue,
        totalInvoices: cInvoices.filter(i => i.type === 'invoice').length,
        lastActive: dates.length > 0 ? dates[0]! : null,
        pending: cInvoices.filter(i => i.type === 'invoice' && i.status === "Pending").length,
        overdue: cInvoices.filter(i => i.type === 'invoice' && i.status === "Overdue").length
      };
    });
    return stats;
  }, [clients, invoices]);

  const syncClientsFromInvoices = useCallback(async () => {
    setSyncing(true);
    try {
      const invData: InvoiceData[] = await api.invoices.getAll();

      const manualClients = clients.filter(c => c.source === 'manual');
      const extracted = new Map<string, Client>();

      invData.forEach(inv => {
        const name = inv.customer?.name || inv.customerName;
        const phone = inv.customer?.phone || inv.customerPhone;
        const email = inv.customer?.email || inv.customerEmail;
        if (name && phone) {
          const key = `${name}-${phone}`;
          if (!extracted.has(key)) {
            extracted.set(key, {
              id: inv.customer?.id || inv.customerId || `INV-${Date.now()}-${name.substring(0, 3)}`,
              name,
              phone,
              email: email || "",
              address: inv.customer?.address || inv.customerAddress || "",
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
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to sync clients from invoices');
    } finally {
      setSyncing(false);
    }
  }, [clients, loadData, showToast]);

  const handleExport = async () => {
    try {
      showToast('info', 'Exporting client database...');
      const { generateCSV } = await import('../utils/csvHelper');
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
    } catch (e) {
      console.error(e);
      showToast('error', 'Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        showToast('info', 'Reading client file...');
        const { parseCSV } = await import('../utils/csvHelper');
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

        if (!confirm(`Import ${clientsToImport.length} clients?`)) return;

        setLoading(true);
        await api.clients.bulkCreateOrUpdate(clientsToImport);
        await loadData();
        showToast('success', `${clientsToImport.length} clients imported`);

      } catch (err) {
        console.error(err);
        showToast('error', 'Failed to parse CSV');
      } finally {
        setLoading(false);
        // Reset input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const seedClients = async () => {
    if (!confirm("Add sample clients to your database?")) return;

    const dummyClients: Client[] = [
      { id: "SEED-1", name: "Safaricom PLC", company: "Safaricom", phone: "+254 722 000 000", email: "procurement@safaricom.co.ke", address: "Safaricom House, Waiyaki Way, Nairobi", kraPin: "P051234567A", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-2", name: "KCB Group", company: "KCB Bank", phone: "+254 711 000 000", email: "info@kcbgroup.com", address: "Kencom House, Nairobi CBD", kraPin: "P051234568B", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-3", name: "Davis & Shirtliff", company: "D&S", phone: "+254 722 123 456", email: "sales@dayliff.com", address: "Industrial Area, Nairobi", kraPin: "P051234569C", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-4", name: "John Kamau", company: "Private", phone: "+254 700 111 222", email: "jkamau@gmail.com", address: "Runda Estate, House 45", kraPin: "A001234567D", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-5", name: "Tech Solutions Ltd", company: "Tech Solutions", phone: "+254 733 444 555", email: "admin@techsolutions.co.ke", address: "Westlands, The Mirage", kraPin: "P051234570E", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' }
    ];

    const updated = [...clients, ...dummyClients];
    const unique = updated.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.phone === v.phone)) === i);

    try {
      await api.clients.bulkCreateOrUpdate(unique);
      await loadData();
      showToast('success', 'Sample clients added successfully');
    } catch (error) {
      console.error("Seeding failed:", error);
      showToast('error', 'Failed to seed clients');
    }
  };

  const deleteAllClients = async () => {
    if (confirm("WARNING: This will delete ALL client data. This cannot be undone. Are you sure?")) {
      if (confirm("Double check: Are you absolutely sure you want to wipe the client database?")) {
        setLoading(true);
        try {
          await api.clients.deleteAll();
          showToast('success', 'All clients deleted successfully');
          await loadData();
        } catch (error) {
          console.error("Delete all failed:", error);
          showToast('error', 'Failed to delete all clients from cloud');
        } finally {
          setLoading(false);
        }
      }
    }
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
    } catch (error) {
      console.error("Save failed:", error);
      showToast('error', 'Failed to save to cloud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client? This process cannot be undone.")) {
      setLoading(true);
      try {
        await api.clients.delete(id);
        showToast('success', 'Client deleted successfully');
        await loadData();
        setSelectedClient(null);
      } catch (error) {
        console.error("Delete failed:", error);
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
            {/* ADMIN ONLY Tools */}
            {user?.role === 'admin' && (
              <>
                <button onClick={deleteAllClients} title="Delete All Clients" className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/30 font-bold text-xs uppercase tracking-wide">
                  <FaEraser />
                </button>
                <button onClick={seedClients} title="Seed Sample Clients" className="p-3 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-purple-100 dark:border-purple-900/30 font-bold text-xs uppercase tracking-wide">
                  <FaSeedling />
                </button>
              </>
            )}

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
              onClick={() => { setEditingClient(null); setFormData({ name: "", phone: "", email: "", address: "", company: "", kraPin: "" }); setShowForm(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-600/30 font-bold text-xs uppercase tracking-widest transform hover:scale-105 active:scale-95"
            >
              <FaPlus /> New Client
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up delay-200">
          <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 flex flex-col justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Clients</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{clients.length}</div>
          </div>
          <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 flex flex-col justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              Ksh {Object.values(clientStats).reduce((a, b) => a + b.totalRevenue, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 flex flex-col justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Invoices Pending</div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {invoices.filter(i => i.status === "Pending").length}
            </div>
          </div>
          <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 flex flex-col justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Clients Overdue</div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {Object.values(clientStats).filter(s => s.overdue > 0).length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative group animate-slide-up delay-300">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
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
                    const stats = clientStats[client.id] || { totalRevenue: 0, totalInvoices: 0, pending: 0, overdue: 0, lastActive: null };
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
                          <div className="font-black text-gray-900 dark:text-white">Ksh {(stats.totalRevenue || 0).toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stats.totalInvoices} Invoices</div>
                        </td>
                        <td className="px-6 py-5">
                          {stats.overdue > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wide border border-rose-200 dark:border-rose-900/50">Overdue</span>
                          ) : stats.pending > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wide border border-amber-200 dark:border-amber-900/50">Pending</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wide border border-emerald-200 dark:border-emerald-900/50">Good Standing</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-gray-500">
                          {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : <span className="opacity-50">Never</span>}
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

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl transform rotate-3" style={{ backgroundColor: stringToColor(selectedClient.name) }}>
                  {getInitials(selectedClient.name)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{selectedClient.name}</h2>
                  <div className="text-gray-500 dark:text-gray-400 flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-2"><FaEnvelope className="text-brand-500" /> {selectedClient.email || "No Email"}</span>
                    <span className="flex items-center gap-2"><FaPhone className="text-brand-500" /> {selectedClient.phone}</span>
                  </div>
                  {selectedClient.company && <div className="text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-widest mt-3 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg inline-block border border-brand-100 dark:border-brand-900/50">{selectedClient.company}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Lifetime Value</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    Ksh {(clientStats[selectedClient.id]?.totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Orders</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {clientStats[selectedClient.id]?.totalInvoices || 0}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-midnight-950 p-5 rounded-2xl text-center border border-gray-100 dark:border-midnight-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Risk Status</div>
                  <div className={`text-xl font-black ${clientStats[selectedClient.id]?.overdue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {clientStats[selectedClient.id]?.overdue > 0 ? "High Risk" : "Low Risk"}
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
    </div>
  );
};

export default Clients;