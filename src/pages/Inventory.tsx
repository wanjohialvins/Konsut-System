import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaFileCsv,
    FaBoxOpen,
    FaPlus,
    FaExclamationTriangle,
    FaMagic,
    FaBroom,
    FaCompressArrowsAlt
} from "react-icons/fa";
import { FiBox, FiTruck, FiTool } from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

type Category = "products" | "mobilization" | "services";

export interface StockItem {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    priceKsh: number;
    priceUSD?: number;
    description?: string;
}

const Inventory = () => {
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [stock, setStock] = useState<Record<Category, StockItem[]>>({
        products: [],
        mobilization: [],
        services: [],
    });
    const [activeCategory, setActiveCategory] = useState<Category>("products");
    const [search, setSearch] = useState<string>("");
    const [currencyRate, setCurrencyRate] = useState<number>(130);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [showLowStock, setShowLowStock] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [stockDataRaw, settings] = await Promise.all([
                api.stock.getAll(),
                api.settings.get()
            ]);

            const stockData = stockDataRaw.map((s: StockItem & { unitPrice: number, unitPriceUsd: number }) => ({
                ...s,
                priceKsh: Number(s.unitPrice || 0),
                priceUSD: Number(s.unitPriceUsd || 0)
            }));

            setStock({
                products: stockData.filter((i: StockItem) => i.category === 'products'),
                mobilization: stockData.filter((i: StockItem) => i.category === 'mobilization'),
                services: stockData.filter((i: StockItem) => i.category === 'services'),
            });

            if (settings?.invoiceSettings?.currencyRate) {
                setCurrencyRate(Number(settings.invoiceSettings.currencyRate));
            }
        } catch (error) {
            console.error(error);
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
        if (!confirm("Delete this item?")) return;
        try {
            await api.stock.delete(id);
            loadData();
            showToast('success', 'Item deleted');
        } catch (error) {
            console.error(error);
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
        } catch (error) {
            console.error(error);
            showToast('error', 'Update failed');
        }
    };



    const handleClearAll = async () => {
        if (!confirm("⚠️ CRITICAL WARNING ⚠️\n\nThis will permanently DELETE ALL items in your inventory.\nThis action cannot be undone.\n\nAre you sure you want to wipe everything?")) return;
        if (!confirm("Double check: You are about to wipe the ENTIRE inventory.\n\nType 'YES' to confirm (mentally). Proceed?")) return;

        setLoading(true);
        try {
            await api.stock.deleteAll();
            loadData();
            showToast('success', 'Inventory completely wiped');
        } catch (error) {
            console.error(error);
            showToast('error', 'Wipe failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMergeDuplicates = async () => {
        if (!confirm("This will merge items with the exact same name (case-insensitive) within each category. Quantities will be summed up. Continue?")) return;

        setLoading(true);
        try {
            const allItems = [...stock.products, ...stock.mobilization, ...stock.services];
            // Group by name (normalized)
            const groups: Record<string, StockItem[]> = {};

            for (const item of allItems) {
                const key = `${item.category}_${item.name.toLowerCase().trim()}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(item);
            }

            let mergedCount = 0;
            let removedCount = 0;

            for (const key in groups) {
                const group = groups[key];
                if (group.length > 1) {
                    // Keep the first one (or the one with the highest price? let's stick to first but sum qty)
                    // We should probably keep the one with the most complete data, but simplistic approach first.
                    // Let's sort by ID to have deterministic "keeper"
                    group.sort((a, b) => a.id.localeCompare(b.id));

                    const keeper = group[0];
                    const others = group.slice(1);

                    const totalQty = group.reduce((sum, i) => sum + i.quantity, 0);

                    // Update keeper
                    await api.stock.update({ ...keeper, quantity: totalQty, unitPrice: keeper.priceKsh });

                    // Delete others
                    for (const other of others) {
                        await api.stock.delete(other.id);
                        removedCount++;
                    }
                    mergedCount++;
                }
            }

            if (mergedCount > 0) {
                loadData();
                showToast('success', `Merged ${mergedCount} groups, removed ${removedCount} duplicates`);
            } else {
                showToast('info', 'No duplicates found');
            }

        } catch (error) {
            console.error(error);
            showToast('error', 'Merge operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            showToast('info', 'Exporting data...');
            const { generateCSV } = await import('../utils/csvHelper');
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
        } catch (error) {
            console.error(error);
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
                        to="/stock/add"
                        className="flex items-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                    >
                        <FaPlus /> Pre-load Stock
                    </Link>
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center gap-3">
                        <FaBoxOpen />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Inventory Value</p>
                            <p className="text-xl font-black">Ksh {(totalStockValue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[300px]">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${activeCategory}...`}
                        className="w-full bg-white dark:bg-midnight-900 border-none rounded-[2rem] py-5 pl-14 pr-6 shadow-xl shadow-gray-200/40 dark:shadow-none font-medium text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all text-lg"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowLowStock(!showLowStock)}
                        className={`p-5 rounded-[2rem] transition-all flex items-center gap-3 font-bold shadow-xl shadow-gray-200/40 dark:shadow-none ${showLowStock
                            ? 'bg-red-50 text-red-600 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-midnight-950'
                            : 'bg-white dark:bg-midnight-900 text-gray-500 hover:text-red-500'
                            }`}
                        title="Toggle Low Stock Items"
                    >
                        <FaExclamationTriangle size={20} />
                        <span className="hidden md:inline">Low Stock</span>
                    </button>

                    <div className="relative group z-10">
                        <button className="p-5 bg-white dark:bg-midnight-900 rounded-[2rem] text-brand-600 shadow-xl shadow-gray-200/40 dark:shadow-none hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex items-center gap-2 font-bold">
                            <FaMagic size={20} />
                            <span className="hidden md:inline">Smart Tools</span>
                        </button>

                        <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-midnight-900 rounded-[2rem] shadow-2xl p-4 hidden group-hover:block animate-fade-in border border-gray-100 dark:border-midnight-800">
                            <button
                                onClick={handleMergeDuplicates}
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
                                onClick={handleClearAll}
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

                            <div className="h-px bg-gray-100 dark:bg-midnight-800 my-2"></div>

                            <button
                                onClick={handleExport}
                                className="w-full text-left p-4 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-2xl flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-lg">
                                    <FaFileCsv />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Export to CSV</p>
                                    <p className="text-[10px] opacity-60">Backup data</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Base Price (Ksh)</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Equity (Ksh)</th>
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
                                            {it.description && <p className="text-gray-400 text-xs mt-1 font-medium truncate max-w-xs">{it.description}</p>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-block min-w-[3rem] px-3 py-1.5 rounded-xl font-black text-sm ${it.quantity <= 5 ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-gray-100 dark:bg-midnight-950 text-gray-600 dark:text-gray-300'}`}>
                                            {it.quantity}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-gray-700 dark:text-gray-300">
                                        {it.priceKsh.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-brand-600">
                                        {(it.priceKsh * it.quantity).toLocaleString()}
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

            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10">
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
                            <div className="grid grid-cols-2 gap-6">
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
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 active:scale-95">Update Resource</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
