import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiX, FiSave } from "react-icons/fi";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import type { Invoice, InvoiceItem, Product, Category } from "../../types/types";
import { FaBolt, FaPlus } from "react-icons/fa";
import InventorySelector from "../new-invoice/InventorySelector";
import { DEFAULT_CURRENCY_RATE } from "../../utils/config";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import SavingIndicator from '../ui/SavingIndicator';
import { InputMasks } from '../../utils/formatters';

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    onSuccess: () => void;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoiceId, onSuccess }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerKraPin, setCustomerKraPin] = useState("");
    const [issuedDate, setIssuedDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [lines, setLines] = useState<InvoiceItem[]>([]);
    const [currency, setCurrency] = useState<"Ksh" | "USD">("Ksh");
    const [usdToKshRate, setUsdToKshRate] = useState(DEFAULT_CURRENCY_RATE);
    const [status, setStatus] = useState<Invoice["status"]>("draft");

    // Stock Data
    const [products, setProducts] = useState<Product[]>([]);
    const [mobilization, setMobilization] = useState<Product[]>([]);
    const [services, setServices] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category>("products");

    // Inventory Selector State
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [itemSearch, setItemSearch] = useState("");
    const [selectedId, setSelectedId] = useState<Record<Category, string>>({
        products: "",
        mobilization: "",
        services: ""
    });
    const [selectedQty, setSelectedQty] = useState<Record<Category, number>>({
        products: 1,
        mobilization: 1,
        services: 1
    });

    const loadInvoice = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.invoices.getOne(invoiceId);
            if (data) {
                setInvoice(data);
                setCustomerName(data.customer?.name || "");
                setCustomerPhone(data.customer?.phone || "");
                setCustomerEmail(data.customer?.email || "");
                setCustomerAddress(data.customer?.address || "");
                setCustomerKraPin(data.customer?.kraPin || "");
                setIssuedDate(data.issuedDate || "");
                setDueDate(data.dueDate || data.quotationValidUntil || "");

                // Map items to ensure they have all required properties
                const mappedItems: InvoiceItem[] = (data.items || []).map((item: any) => ({
                    id: String(item.id || item.productId || ''),
                    name: item.name || item.itemName || '',
                    category: item.category || 'products',
                    description: item.description || '',
                    quantity: Number(item.quantity || 1),
                    unitPrice: Number(item.unitPrice || item.price || 0),
                    lineTotal: Number(item.lineTotal || item.total || (item.quantity * item.unitPrice) || 0)
                }));
                setLines(mappedItems);

                setUsdToKshRate(data.currencyRate || DEFAULT_CURRENCY_RATE);
                setStatus(data.status);
                setCurrency((data.currency as "Ksh" | "USD") || "Ksh");
            }
        } catch (error) {
            showToast("error", "Failed to load invoice details");
            console.error("Load invoice error:", error);
        } finally {
            setLoading(false);
        }
    }, [invoiceId, showToast]);

    // --- Persistence ---
    const isOnline = useOnlineStatus();
    const DRAFT_KEY = `konsut_edit_draft_${invoiceId}`;

    const autoSaveData = useMemo(() => ({
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        customerKraPin,
        issuedDate,
        dueDate,
        lines,
        currency,
        usdToKshRate,
        status,
        lastSaved: new Date().toISOString()
    }), [customerName, customerPhone, customerEmail, customerAddress, customerKraPin, issuedDate, dueDate, lines, currency, usdToKshRate, status]);

    const isSaving = useAutoSave(DRAFT_KEY, autoSaveData, 1500);
    const isBusy = loading || isSaving;

    const loadDraft = useCallback(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const d = JSON.parse(saved);
                setCustomerName(d.customerName || "");
                setCustomerPhone(d.customerPhone || "");
                setCustomerEmail(d.customerEmail || "");
                setCustomerAddress(d.customerAddress || "");
                setCustomerKraPin(d.customerKraPin || "");
                setIssuedDate(d.issuedDate || "");
                setDueDate(d.dueDate || "");
                setLines(d.lines || []);
                setCurrency(d.currency || "Ksh");
                setUsdToKshRate(d.usdToKshRate || DEFAULT_CURRENCY_RATE);
                setStatus(d.status || "draft");
                showToast("info", "Recovered unsaved changes from local storage");
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, [DRAFT_KEY, showToast]);

    const loadStock = useCallback(async () => {
        try {
            const stockData = await api.stock.getAll();
            if (stockData) {
                const mappedStock: Product[] = stockData.map((s: any) => ({
                    ...s,
                    id: String(s.id || ''),
                    priceKsh: Number(s.unitPrice || 0),
                    priceUSD: Number(s.unitPriceUsd || 0)
                }));
                setProducts(mappedStock.filter(i => i.category === 'products'));
                setMobilization(mappedStock.filter(i => i.category === 'mobilization'));
                setServices(mappedStock.filter(i => i.category === 'services'));
            }
        } catch (error) {
            console.error("Stock load failed", error);
        }
    }, []);

    useEffect(() => {
        if (isOpen && invoiceId) {
            // First check for local draft
            const hasDraft = !!localStorage.getItem(DRAFT_KEY);
            if (hasDraft) {
                loadDraft();
                loadStock();
            } else {
                loadInvoice();
                loadStock();
            }
        }
    }, [isOpen, invoiceId, loadInvoice, loadStock, loadDraft, DRAFT_KEY]);

    // Inventory Selector Handlers
    const getFilteredForCategory = (cat: Category) => {
        const list = cat === "products" ? products : cat === "mobilization" ? mobilization : services;
        return list;
    };

    const allStock = [...products, ...mobilization, ...services];
    const filteredStock = itemSearch
        ? allStock.filter(item =>
            item.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
            item.description?.toLowerCase().includes(itemSearch.toLowerCase())
        )
        : [];

    const handleSearchSelect = (item: Product) => {
        const newLine: InvoiceItem = {
            id: item.id,
            name: item.name,
            category: item.category || 'products',
            description: item.description || '',
            quantity: 1,
            unitPrice: item.priceKsh || 0,
            lineTotal: item.priceKsh || 0
        };
        setLines([...lines, newLine]);
        setItemSearch("");
        setIsSearchMode(false);
    };

    const handleCreateCustomItem = (name: string) => {
        const newLine: InvoiceItem = {
            id: `custom-${Date.now()}`,
            name,
            category: activeCategory,
            description: '',
            quantity: 1,
            unitPrice: 0,
            lineTotal: 0
        };
        setLines([...lines, newLine]);
        setItemSearch("");
        setIsSearchMode(false);
    };

    const handleAddSelected = (cat: Category) => {
        const id = selectedId[cat];
        if (!id) return;

        const list = cat === "products" ? products : cat === "mobilization" ? mobilization : services;
        const item = list.find(p => p.id === id);
        if (!item) return;

        const qty = selectedQty[cat] || 1;
        const newLine: InvoiceItem = {
            id: item.id,
            name: item.name,
            category: cat,
            description: item.description || '',
            quantity: qty,
            unitPrice: item.priceKsh || 0,
            lineTotal: (item.priceKsh || 0) * qty
        };
        setLines([...lines, newLine]);
        setSelectedId(prev => ({ ...prev, [cat]: "" }));
        setSelectedQty(prev => ({ ...prev, [cat]: 1 }));
    };


    const handleSave = async () => {
        if (!invoice) return;
        try {
            setLoading(true);
            const subtotal = lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
            const taxAmount = subtotal * 0.16; // Assuming standard 16% for now or from settings
            const grandTotal = subtotal + taxAmount;

            const updatedInvoice: Invoice = {
                ...invoice,
                customer: {
                    ...invoice.customer,
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    address: customerAddress,
                    kraPin: customerKraPin
                },
                issuedDate,
                dueDate: invoice.type !== 'quotation' ? dueDate : undefined,
                quotationValidUntil: invoice.type === 'quotation' ? dueDate : undefined,
                items: lines,
                currencyRate: usdToKshRate,
                status,
                currency,
                subtotal,
                taxAmount,
                grandTotal
            };

            await api.invoices.update(updatedInvoice);
            showToast("success", "Document updated successfully");
            localStorage.removeItem(DRAFT_KEY);
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast("error", error.message || "Failed to update document");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-50 dark:bg-midnight-950 w-full max-w-7xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white dark:border-midnight-800 animate-modal-enter">

                {/* Header */}
                <div className="px-8 py-6 bg-white dark:bg-midnight-900 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl text-brand-600 dark:text-brand-400">
                            <FaBolt size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Quick Edit: {invoiceId}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Modify document details without leaving perspective</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <SavingIndicator isSaving={isSaving} isOffline={!isOnline} lastSaved={autoSaveData.lastSaved} />
                        <button
                            onClick={handleSave}
                            disabled={isBusy || !isOnline}
                            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSave size={14} /> {loading ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <FiX size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Editor Section */}
                        <div className="xl:col-span-2 space-y-8">
                            {/* Customer Details */}
                            <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Customer Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Customer Name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="col-span-2 px-4 py-3 bg-gray-50 dark:bg-midnight-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(InputMasks.phone(e.target.value))}
                                        className="px-4 py-3 bg-gray-50 dark:bg-midnight-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="px-4 py-3 bg-gray-50 dark:bg-midnight-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Address"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        className="px-4 py-3 bg-gray-50 dark:bg-midnight-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="KRA PIN"
                                        value={customerKraPin}
                                        onChange={(e) => setCustomerKraPin(InputMasks.kraPin(e.target.value))}
                                        className="px-4 py-3 bg-gray-50 dark:bg-midnight-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400"><FaPlus /></div>
                                        Line Items
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setLines([...lines, { id: `manual - ${Date.now()} `, name: "New Item", category: "products", quantity: 1, unitPrice: 0, lineTotal: 0 }])}
                                            className="px-4 py-2 bg-gray-50 dark:bg-midnight-800 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                                        >
                                            Add Row
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/80 dark:bg-midnight-950/80 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800">
                                            <tr>
                                                <th className="px-6 py-4">Item</th>
                                                <th className="px-4 py-4 text-center">Qty</th>
                                                <th className="px-4 py-4 text-right">Price</th>
                                                <th className="px-4 py-4 text-right">Total</th>
                                                <th className="px-4 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                                            {lines.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-midnight-800/50">
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const newLines = [...lines];
                                                                newLines[idx].name = e.target.value;
                                                                setLines(newLines);
                                                            }}
                                                            className="w-full bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newLines = [...lines];
                                                                const qty = parseInt(e.target.value) || 1;
                                                                newLines[idx].quantity = qty;
                                                                newLines[idx].lineTotal = qty * newLines[idx].unitPrice;
                                                                setLines(newLines);
                                                            }}
                                                            className="w-16 text-center bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {currency === "USD" ? `$${(item.unitPrice / usdToKshRate).toFixed(2)} ` : item.unitPrice.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                                                        {currency === "USD" ? `$${(item.lineTotal / usdToKshRate).toFixed(2)} ` : item.lineTotal.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Section */}
                        <div className="space-y-6">
                            {/* Inventory Selector */}
                            <InventorySelector
                                activeCategory={activeCategory}
                                setActiveCategory={setActiveCategory}
                                isSearchMode={isSearchMode}
                                setIsSearchMode={setIsSearchMode}
                                itemSearch={itemSearch}
                                setItemSearch={setItemSearch}
                                selectedId={selectedId}
                                setSelectedId={setSelectedId}
                                selectedQty={selectedQty}
                                setSelectedQty={setSelectedQty}
                                getFilteredForCategory={getFilteredForCategory}
                                filteredStock={filteredStock}
                                handleSearchSelect={handleSearchSelect}
                                handleCreateCustomItem={handleCreateCustomItem}
                                handleAddSelected={handleAddSelected}
                            />

                            {/* Summary */}
                            <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {currency === "USD"
                                                ? `$${(lines.reduce((sum, l) => sum + l.lineTotal, 0) / usdToKshRate).toFixed(2)}`
                                                : `KES ${lines.reduce((sum, l) => sum + l.lineTotal, 0).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black">
                                        <span className="text-gray-900 dark:text-white">Total:</span>
                                        <span className="text-brand-600">
                                            {currency === "USD"
                                                ? `$${(lines.reduce((sum, l) => sum + l.lineTotal, 0) / usdToKshRate).toFixed(2)}`
                                                : `KES ${lines.reduce((sum, l) => sum + l.lineTotal, 0).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Control */}
                            <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Lifecycle Status</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['draft', 'sent', 'paid', 'cancelled'] as const).map((s: 'draft' | 'sent' | 'paid' | 'cancelled') => (
                                        <button
                                            key={s}
                                            onClick={() => setStatus(s)}
                                            className={`px - 3 py - 2 rounded - xl text - [10px] font - bold uppercase tracking - wider transition - all border ${status === s ? 'bg-brand-600 text-white border-brand-600 shadow-lg' : 'bg-gray-50 dark:bg-midnight-800 text-gray-500 border-transparent hover:border-gray-200'} `}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditInvoiceModal;
