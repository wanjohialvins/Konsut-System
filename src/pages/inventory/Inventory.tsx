import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaFileCsv,
    FaBoxOpen,
    FaPlus,
    FaExclamationTriangle,
    FaMagic,
    FaCompressArrowsAlt,
    FaBroom
} from "react-icons/fa";
import { FiPlus, FiSearch, FiEdit3, FiTrash2, FiDownload, FiUpload, FiRefreshCcw, FiTag, FiFilter, FiCheckCircle, FiXCircle, FiTrendingUp, FiBox, FiTruck, FiTool } from "react-icons/fi";
import { Link } from "react-router-dom";
import { SmartTableToolbar } from "../../components/ui/SmartTableToolbar";
import { api } from "../../services/api";
import type { Product, Category } from "../../types/types";
import { DEFAULT_CURRENCY_RATE } from "../../utils/config";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalContext";

// Local strictly typed item for Inventory management
type InventoryItem = Product & { quantity: number; category: Category };

/**
 * Inventory Management Component
 * 
 * Handles full CRUD operations for stock items (products, mobilization, services).
 * 
 * Features:
 * - Real-time filtering and search
 * - One-click "Smart Tools" (Merge Duplicates, Wipe All)
 * - CSV Export
 * - Low stock alerts
 */
const Inventory = () => {
    const { showConfirm } = useModal();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);

    // --- Data State ---
    const [stock, setStock] = useState<Record<Category, InventoryItem[]>>({
        products: [],
        mobilization: [],
        services: [],
    });

    // --- UI State ---
    const [activeCategory, setActiveCategory] = useState<Category>("products");
    const [search, setSearch] = useState<string>("");
    const [displayCurrency, setDisplayCurrency] = useState<'KSH' | 'USD'>('KSH');
    const [currencyRate, setCurrencyRate] = useState<number>(DEFAULT_CURRENCY_RATE);

    // --- Toggles & Modals ---
    const [showDescriptions, setShowDescriptions] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [showLowStock, setShowLowStock] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.smart-tools-container')) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [stockDataRaw, settings] = await Promise.all([
                api.stock.getAll(),
                api.settings.get()
            ]);

            const stockData = (stockDataRaw as Product[]).map(s => ({
                ...s,
                priceKsh: Number((s as any).unitPrice || s.priceKsh || 0),
                priceUSD: Number((s as any).unitPriceUsd || s.priceUSD || 0),
                quantity: Number(s.quantity || 0),
                category: (s.category || 'products') as any
            }));

            setStock({
                products: stockData.filter((i: InventoryItem) => i.category === 'products'),
                mobilization: stockData.filter((i: InventoryItem) => i.category === 'mobilization'),
                services: stockData.filter((i: InventoryItem) => i.category === 'services'),
            });

            if (settings?.invoiceSettings?.currencyRate) {
                setCurrencyRate(Number(settings.invoiceSettings.currencyRate));
            }
        } catch {
            showToast('error', 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredItems = useMemo(() => {
        return stock[activeCategory].filter((it) => {
            const matchesSearch = it.name.toLowerCase().includes(search.trim().toLowerCase());
            const matchesLowStock = showLowStock ? it.quantity <= 5 : true;
            return matchesSearch && matchesLowStock;
        });
    }, [stock, activeCategory, search, showLowStock]);

    const totalStockValue = useMemo(() => {
        return Object.values(stock).flat().reduce((s, it) => s + (it.priceKsh || 0) * (it.quantity || 0), 0);
    }, [stock]);

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm("Delete this item?");
        if (!confirmed) return;
        try {
            await api.stock.delete(id);
            loadData();
            showToast('success', 'Item deleted');
        } catch {
            showToast('error', 'Delete failed');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            const payload = { ...editingItem, unitPrice: editingItem.priceKsh, unitPriceUsd: editingItem.priceUSD };
            await api.stock.update(payload);
            setEditingItem(null);
            loadData();
            showToast('success', 'Item updated');
        } catch {
            showToast('error', 'Update failed');
        }
    };



    const handleClearAll = async () => {
        const confirmed1 = await showConfirm("⚠️ CRITICAL WARNING ⚠️\n\nThis will permanently DELETE ALL items in your inventory.\nThis action cannot be undone.\n\nAre you sure you want to wipe everything?");
        if (!confirmed1) return;
        const confirmed2 = await showConfirm("Double check: You are about to wipe the ENTIRE inventory.\n\nProceed?");
        if (!confirmed2) return;

        setLoading(true);
        try {
            await api.stock.deleteAll();
            loadData();
            showToast('success', 'Inventory completely wiped');
        } catch {
            showToast('error', 'Wipe failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMergeDuplicates = async () => {
        const confirmed = await showConfirm("This will merge items with the exact same name (case-insensitive) within each category. Quantities will be summed up. Continue?");
        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await api.admin.cleanupDuplicates('stock');
            if (res.merged.stock > 0) {
                loadData();
                showToast('success', `Merged duplicates, removed ${res.merged.stock} items`);
            } else {
                showToast('info', 'No duplicates found');
            }
        } catch (error: unknown) {
            showToast('error', 'Merge operation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            showToast('info', 'Exporting data...');
            const { generateCSV } = await import('../../utils/csvHelper');
            const dataToExport = filteredItems.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                quantity: i.quantity,
                price: i.priceKsh,
                usd: i.priceUSD || 0,
                description: i.description || ''
            }));

            const csv = generateCSV(dataToExport);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('success', 'Download started');
        } catch {
            showToast('error', 'Export failed');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Inventory Control</h1>
                    <p className="text-slate-500 dark:text-midnight-text-secondary mt-1 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        Real-time stock monitoring
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        id="inventory-add-btn"
                        to="/stock/add"
                        className="flex items-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                    >
                        <FaPlus /> Pre-load Stock
                    </Link>

                    <button
                        onClick={() => setShowDescriptions(!showDescriptions)}
                        className={`p-4 rounded-2xl font-black shadow-lg flex items-center gap-2 border border-gray-100 dark:border-midnight-800 transition-all ${showDescriptions ? 'bg-brand-600 text-white' : 'bg-white dark:bg-midnight-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}
                        title="Toggle Descriptions"
                    >
                        {showDescriptions ? 'Hide Details' : 'Show Details'}
                    </button>

                    <div className="flex bg-gray-100 dark:bg-midnight-800 p-1.5 rounded-2xl border border-gray-200 dark:border-midnight-700 shadow-inner">
                        <button
                            onClick={() => setDisplayCurrency('KSH')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${displayCurrency === 'KSH'
                                ? 'bg-white dark:bg-midnight-950 text-brand-600 shadow-md transform scale-105'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            KSH
                        </button>
                        <button
                            onClick={() => setDisplayCurrency('USD')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${displayCurrency === 'USD'
                                ? 'bg-white dark:bg-midnight-950 text-emerald-600 shadow-md transform scale-105'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            USD
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center gap-3">
                        <FaBoxOpen />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Inventory Value</p>
                            <p className="text-xl font-black">
                                {displayCurrency === 'KSH' ? 'Ksh ' : '$ '}
                                {(displayCurrency === 'KSH'
                                    ? totalStockValue
                                    : (totalStockValue / currencyRate)
                                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Smart Toolbar */}
            <SmartTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder={`Search ${activeCategory}...`}
                searchContext="invoice_desc_product"

                sortOptions={[
                    { key: 'name', label: 'Item Name' },
                    { key: 'quantity', label: 'Quantity' },
                    { key: 'price', label: 'Price' }
                ]}

                // Inventory doesn't have standard "filter" props in state yet, 
                // but we can map the generic "filter" UI to toggles if needed.
                // For now, we keep the custom toggles in 'actions' as they are specific.

                onExport={handleExport}
                className="animate-slide-up delay-100"

                actions={
                    <>
                        {/* Custom Toggle: Low Stock */}
                        <button
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold shadow-sm border border-gray-100 dark:border-midnight-800 ${showLowStock
                                ? 'bg-red-50 text-red-600 ring-2 ring-red-500 ring-offset-1'
                                : 'bg-white dark:bg-midnight-900 text-gray-500 hover:text-red-500'
                                }`}
                            title="Toggle Low Stock Items"
                        >
                            <FaExclamationTriangle />
                            <span className="hidden xl:inline text-xs uppercase tracking-wider">Low Stock</span>
                        </button>

                        {/* Smart Tools Menu */}
                        <div className="relative smart-tools-container z-20">
                            <button
                                id="inventory-tools-btn"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold shadow-sm border border-gray-100 dark:border-midnight-800 ${isMenuOpen ? 'bg-brand-600 text-white' : 'bg-white dark:bg-midnight-900 text-brand-600 hover:bg-brand-50'}`}
                            >
                                <FaMagic />
                                <span className="hidden xl:inline text-xs uppercase tracking-wider">Tools</span>
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-midnight-900 rounded-[2rem] shadow-2xl p-4 animate-fade-in border border-gray-100 dark:border-midnight-800 z-50">
                                    <button
                                        onClick={() => { handleMergeDuplicates(); setIsMenuOpen(false); }}
                                        disabled={loading}
                                        className="w-full text-left p-4 hover:bg-brand-50 dark:hover:bg-midnight-800 rounded-2xl flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors mb-2"
                                    >
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <FaCompressArrowsAlt />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Merge Duplicates</p>
                                            <p className="text-[10px] opacity-60">Consolidate items</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { handleClearAll(); setIsMenuOpen(false); }}
                                        disabled={loading}
                                        className="w-full text-left p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 transition-colors"
                                    >
                                        <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-lg">
                                            <FaBroom />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Wipe Inventory</p>
                                            <p className="text-[10px] opacity-60">Delete all items</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                }
            />

            <div className="flex gap-2 border-b border-gray-200 dark:border-midnight-800">
                {[
                    { id: "products", label: "Products", icon: FiBox },
                    { id: "mobilization", label: "Mobilization", icon: FiTruck },
                    { id: "services", label: "Services", icon: FiTool }
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id as Category)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-t-3xl text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeCategory === cat.id
                            ? "bg-white dark:bg-midnight-900 text-brand-600 border-brand-600 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent"
                            }`}
                    >
                        <cat.icon size={18} />
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] shadow-2xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-midnight-950/50 border-b border-gray-100 dark:border-midnight-800">
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">ID Reference</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Product Specification</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Available Qty</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Base Price ({displayCurrency})</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Equity ({displayCurrency})</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-midnight-800/50">
                            {filteredItems.map(it => (
                                <tr key={it.id} className="hover:bg-gray-50/50 dark:hover:bg-midnight-800/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 dark:bg-midnight-950 px-2 py-1 rounded-lg">
                                            {it.id}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight group-hover:text-brand-600 transition-colors">{it.name}</h4>

                                            <button
                                                onClick={() => setShowDescriptions(!showDescriptions)}
                                                className="text-[10px] uppercase font-bold text-brand-500 hover:text-brand-600 mt-1 flex items-center gap-1"
                                            >
                                                {showDescriptions ? 'Hide Details' : 'View Details'}
                                            </button>

                                            {showDescriptions && it.description && (
                                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-medium bg-gray-50 dark:bg-midnight-950 p-2 rounded-lg border border-gray-100 dark:border-midnight-800">
                                                    {it.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-block min-w-[3rem] px-3 py-1.5 rounded-xl font-black text-sm ${it.quantity <= 5 ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-gray-100 dark:bg-midnight-950 text-gray-600 dark:text-gray-300'}`}>
                                            {it.quantity}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-gray-700 dark:text-gray-300">
                                        {displayCurrency === 'KSH'
                                            ? (it.priceKsh || 0).toLocaleString()
                                            : (it.priceUSD || ((it.priceKsh || 0) / currencyRate)).toFixed(2)
                                        }
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-brand-600">
                                        {displayCurrency === 'KSH'
                                            ? ((it.priceKsh || 0) * it.quantity).toLocaleString()
                                            : ((it.priceUSD || ((it.priceKsh || 0) / currencyRate)) * it.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        }
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingItem(it)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-500/10">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(it.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingItem && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 custom-scrollbar">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gray-50/50 dark:bg-midnight-950/50">
                            <h3 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tight">Modify Inventory</h3>
                            <button onClick={() => setEditingItem(null)} className="p-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-midnight-800 text-gray-400 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-10 space-y-8 text-sm">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Resource Identity</label>
                                <input
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quantity</label>
                                    <input
                                        type="number"
                                        value={editingItem.quantity}
                                        onChange={e => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 outline-none"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Description</label>
                                    <textarea
                                        value={editingItem.description || ''}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 outline-none h-24 resize-none"
                                        placeholder="Add details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Price (Ksh)</label>
                                    <input
                                        type="number"
                                        value={editingItem.priceKsh}
                                        onChange={e => setEditingItem({ ...editingItem, priceKsh: Number(e.target.value), priceUSD: Number((Number(e.target.value) / currencyRate).toFixed(2)) })}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Price (USD)</label>
                                    <input
                                        type="number"
                                        value={editingItem.priceUSD || ''}
                                        onChange={e => setEditingItem({ ...editingItem, priceUSD: Number(e.target.value), priceKsh: Number((Number(e.target.value) * currencyRate).toFixed(2)) })}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 active:scale-95">Update Resource</button>
                            </div>
                        </form>
                    </div>
                </div >,
                document.body
            )}
        </div >
    );
};

export default Inventory;
