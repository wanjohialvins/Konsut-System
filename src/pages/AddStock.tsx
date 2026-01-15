import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiPackage, FiInfo, FiHash, FiImage, FiUpload, FiBox, FiTruck, FiTool } from "react-icons/fi";
import { FaBoxOpen, FaFileImport } from "react-icons/fa";
import { useModal } from "../contexts/ModalContext";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";

type Category = "products" | "mobilization" | "services";

const AddStock = () => {
    const { showConfirm } = useModal();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<Category>("products");
    const [currencyRate, setCurrencyRate] = useState<number>(130);

    // Form State
    const [formName, setFormName] = useState<string>("");
    const [formQty, setFormQty] = useState<number>(1);
    const [formPriceKsh, setFormPriceKsh] = useState<number>(0);
    const [formPriceUSD, setFormPriceUSD] = useState<number>(0);
    const [formDescription, setFormDescription] = useState<string>("");

    useEffect(() => {
        api.settings.get().then(s => {
            if (s?.invoiceSettings?.currencyRate) setCurrencyRate(Number(s.invoiceSettings.currencyRate));
        });
    }, []);

    const onKshChange = (value: number) => {
        setFormPriceKsh(value);
        setFormPriceUSD(Number((value / currencyRate).toFixed(2)));
    };

    const onUsdChange = (value: number) => {
        setFormPriceUSD(value);
        setFormPriceKsh(Number((value * currencyRate).toFixed(2)));
    };

    const genId = (prefix = "P") => `${prefix.charAt(0).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return showToast('warning', 'Item name required');

        setLoading(true);
        try {
            const id = genId(activeCategory === 'products' ? 'P' : activeCategory === 'mobilization' ? 'M' : 'S');
            const payload = {
                id,
                name: formName.trim(),
                category: activeCategory,
                quantity: formQty,
                unitPrice: formPriceKsh,
                unitPriceUsd: formPriceUSD,
                description: formDescription
            };

            await api.stock.create(payload);
            showToast('success', 'Resource initialized in cloud');
            navigate('/stock/inventory');
        } catch {
            showToast('error', 'Cloud sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            try {
                showToast('info', 'Analysis initiated...');
                const { parseCSV } = await import('../utils/csvHelper');
                const rows = parseCSV(text) as Record<string, string>[];

                if (rows.length === 0) {
                    showToast('error', 'CSV appears empty or invalid');
                    return;
                }

                // Helper to parse currency/numbers (removes $ , etc)
                const parseNum = (val: any) => {
                    if (!val) return 0;
                    const str = String(val).replace(/[^0-9.-]+/g, "");
                    return Number(str) || 0;
                };

                // Map CSV fields to StockItem
                const itemsToImport = rows.map(r => {
                    let ksh = parseNum(r.price || r.cost || r.amount || 0);
                    let usd = parseNum(r.priceusd || r.usd || 0);

                    // Auto-convert if one is missing
                    if (ksh > 0 && usd === 0) {
                        usd = Number((ksh / currencyRate).toFixed(2));
                    } else if (usd > 0 && ksh === 0) {
                        ksh = Number((usd * currencyRate).toFixed(2));
                    }

                    return {
                        id: r.id || genId(),
                        name: r.name || r.item || 'Unknown Item',
                        category: (['products', 'mobilization', 'services'].includes((r.category || r.cat || '').toLowerCase())
                            ? (r.category || r.cat).toLowerCase()
                            : activeCategory) as Category,
                        quantity: parseNum(r.quantity || r.qty || 1),
                        unitPrice: ksh,
                        unitPriceUsd: usd,
                        description: r.description || r.desc || ''
                    };
                }).filter(i => i.name && i.name !== 'Unknown Item');

                if (itemsToImport.length === 0) {
                    showToast('warning', 'No valid items found in CSV');
                    return;
                }

                const confirmed = await showConfirm(`Import ${itemsToImport.length} items into ${activeCategory}?`);
                if (!confirmed) return;

                setLoading(true);
                // Batch upload
                let success = 0;
                for (const item of itemsToImport) {
                    try {
                        await api.stock.create(item);
                        success++;
                    } catch {
                        console.error('Import failed for', item.name);
                    }
                }

                showToast('success', `${success}/${itemsToImport.length} items imported successfully`);
                navigate('/stock/inventory');

            } catch {
                showToast('error', 'Failed to parse CSV');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in mb-20">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-4">
                        <div className="p-4 bg-brand-600 text-white rounded-[2rem] shadow-2xl shadow-brand-500/20">
                            <FaBoxOpen size={32} />
                        </div>
                        Pre-load Assets
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Initialize new resources into the company ecosystem</p>
                </div>
                <Link to="/stock/inventory" className="p-4 bg-gray-100 dark:bg-midnight-900 rounded-2xl text-gray-500 hover:text-brand-600 transition-all">
                    <FiArrowLeft size={24} />
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Category Selection */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-4">Resource Category</h3>
                    {[
                        { id: "products", label: "Inventory Products", icon: FiBox, desc: "Physical goods and items" },
                        { id: "mobilization", label: "Mobilization", icon: FiTruck, desc: "Transport and logistics" },
                        { id: "services", label: "Professional Services", icon: FiTool, desc: "Labor and consultation" }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as Category)}
                            className={`w-full p-6 rounded-[2rem] text-left border transition-all flex items-center gap-5 group ${activeCategory === cat.id
                                ? 'bg-brand-600 border-brand-600 text-white shadow-2xl shadow-brand-500/30'
                                : 'bg-white dark:bg-midnight-900 border-gray-100 dark:border-midnight-800 text-gray-600 dark:text-gray-300 hover:border-brand-200'
                                }`}
                        >
                            <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${activeCategory === cat.id ? 'bg-white/20' : 'bg-gray-50 dark:bg-midnight-950'}`}>
                                <cat.icon size={24} />
                            </div>
                            <div>
                                <p className="font-black uppercase tracking-tight text-lg">{cat.label}</p>
                                <p className={`text-xs font-medium ${activeCategory === cat.id ? 'opacity-70' : 'text-gray-400'}`}>{cat.desc}</p>
                            </div>
                        </button>
                    ))}

                    <div className="pt-8 space-y-4 px-4">
                        <label className="flex items-center gap-4 p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-midnight-800 hover:border-brand-500 hover:bg-gray-50/50 dark:hover:bg-midnight-900/50 transition-all cursor-pointer group">
                            <FaFileImport className="text-gray-400 group-hover:text-brand-600 transition-colors" size={24} />
                            <div>
                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Bulk Import</p>
                                <p className="text-xs text-gray-400">Upload CSV asset list</p>
                            </div>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                {/* Right Column: Add Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-midnight-800 space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Resource Descriptor</label>
                            <input
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Ex. Solar Inverter X-3000..."
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-[1.5rem] p-6 text-xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Base Cost (Ksh)</label>
                                <input
                                    type="number"
                                    value={formPriceKsh || ""}
                                    onChange={e => onKshChange(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-[1.5rem] p-6 text-xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Base Cost (USD)</label>
                                <input
                                    type="number"
                                    value={formPriceUSD || ""}
                                    onChange={e => onUsdChange(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-[1.5rem] p-6 text-xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Available Quantity</label>
                                <input
                                    type="number"
                                    value={formQty}
                                    onChange={e => setFormQty(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-[1.5rem] p-6 text-xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Technical Description</label>
                            <textarea
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                placeholder="Enter technical specs or notes..."
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-[1.5rem] p-6 text-lg font-medium text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-700 text-white py-8 rounded-[2rem] font-black text-2xl uppercase tracking-[0.1em] transition-all shadow-2xl shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
                        >
                            <FiPlus /> {loading ? 'Initializing...' : 'Add To Database'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddStock;
