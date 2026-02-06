
import React from 'react';
import { FiBox, FiTool, FiPlus, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa";
import type { InvoiceItem as InvoiceLine, User } from '../../types/types';

interface LineItemsTableProps {
    lines: InvoiceLine[];
    showDescriptions: boolean;
    onToggleDescriptions: () => void;
    includeDescriptionsInPDF: boolean;
    onTogglePDFDescriptions: () => void;
    displayCurrency: "Ksh" | "USD";
    usdToKshRate: number;
    user: User | null;
    onUpdateLineItem: (index: number, field: keyof InvoiceLine, value: any) => void;
    onIncreaseQty: (index: number) => void;
    onDecreaseQty: (index: number) => void;
    onRemoveLine: (index: number) => void;
    onMoveLine: (index: number, direction: 'up' | 'down') => void;
    onSaveToStock: (line: InvoiceLine) => void;
    setIsStockModalOpen: (isOpen: boolean) => void;
}

// Helper Component for Money Inputs (Prevents cursor jumping/decimal loss)
const DiscountInput = ({ value, onChange, placeholder, className }: { value: number | undefined, onChange: (val: number) => void, placeholder?: string, className?: string }) => {
    const [localValue, setLocalValue] = React.useState<string>(value ? value.toString() : '');

    React.useEffect(() => {
        // Only update local if the number value actually changes significantly from What we have
        const numericLocal = parseFloat(localValue);
        // If incoming value is different from our local numeric representation, sync it.
        // But if local is "10." and incoming is 10, DON'T sync (keep "10.")
        if (value !== undefined && value !== numericLocal) {
            setLocalValue(value.toString());
        } else if (value === undefined && localValue !== '') {
            // Handle reset
            if (numericLocal !== 0) setLocalValue('');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalValue(raw);

        // Only emit changes if valid number
        if (raw === '') {
            onChange(0);
        } else {
            const parsed = parseFloat(raw);
            if (!isNaN(parsed)) {
                onChange(parsed);
            }
        }
    };

    return (
        <input
            type="number"
            value={localValue}
            placeholder={placeholder}
            onChange={handleChange}
            step="0.01"
            className={className || "w-20 text-right bg-white dark:bg-midnight-800 border border-gray-200 dark:border-midnight-700 rounded-lg p-1 text-xs font-bold text-rose-500 outline-none focus:ring-2 focus:ring-rose-500/20"}
        />
    );
};

const LineItemsTable: React.FC<LineItemsTableProps> = ({
    lines,
    showDescriptions,
    onToggleDescriptions,
    includeDescriptionsInPDF,
    onTogglePDFDescriptions,
    displayCurrency,
    usdToKshRate,
    user,
    onUpdateLineItem,
    onIncreaseQty,
    onDecreaseQty,
    onRemoveLine,
    onMoveLine,
    onSaveToStock,
    setIsStockModalOpen
}) => {

    const formatPrice = (amount: number) => {
        if (displayCurrency === "USD") {
            return `$${(amount / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        }
        return amount.toLocaleString();
    };

    return (
        <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden ring-4 ring-gray-50 dark:ring-midnight-950">
            {/* Header */}
            <div className="p-4 md:p-6 bg-white dark:bg-midnight-900 border-b border-gray-100 dark:border-midnight-800 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-transparent via-gray-50/50 to-transparent dark:via-midnight-800/20 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
                        <FiBox size={18} />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">Items <span className="text-gray-400 ml-1 text-sm font-bold opacity-60">({lines.length})</span></h3>
                    {(user?.role === 'admin' || user?.role === 'ceo') && (
                        <button
                            onClick={() => setIsStockModalOpen(true)}
                            title="Quick Add to Inventory"
                            className="ml-auto md:ml-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95"
                        >
                            <FaPlus size={12} />
                        </button>
                    )}
                </div>

                {/* Toggles - Compact on Mobile */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-midnight-950 rounded-xl w-full md:w-auto justify-between md:justify-start">
                    <button
                        type="button"
                        onClick={onTogglePDFDescriptions}
                        className={`flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${includeDescriptionsInPDF ? 'bg-white dark:bg-midnight-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        {includeDescriptionsInPDF ? 'PDF: Full' : 'PDF: Simple'}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleDescriptions}
                        className={`flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${showDescriptions ? 'bg-white dark:bg-midnight-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        {showDescriptions ? 'Desc: On' : 'Desc: Off'}
                    </button>
                </div>
            </div>

            {lines.length === 0 ? (
                <div className="p-10 md:p-16 text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 dark:bg-midnight-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-midnight-700 animate-pulse">
                        <FiBox size={32} />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-bold mb-2">Shelf Empty</h3>
                    <p className="text-gray-400 text-sm font-medium">Select items from the inventory above.</p>
                </div>
            ) : (
                <>
                    {/* MOBILE CARD VIEW (Visible on small screens) */}
                    <div className="block md:hidden bg-gray-50 dark:bg-midnight-950 p-4 space-y-4">
                        {lines.map((item, idx) => (
                            <div key={`${item.id}-${idx}-mobile`} className="bg-white dark:bg-midnight-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-midnight-800 relative overflow-hidden">
                                {/* Actions Top Right */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => onRemoveLine(idx)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg">
                                        <FaTrash size={12} />
                                    </button>
                                </div>

                                <h4 className="font-bold text-gray-900 dark:text-white text-base pr-12">{item.name}</h4>
                                <p className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider mb-3">{item.category}</p>

                                {/* Description */}
                                <div className={`transition-all duration-300 overflow-hidden ${showDescriptions ? 'max-h-32 mb-4' : 'max-h-0'}`}>
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => onUpdateLineItem(idx, 'description', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-xs font-medium text-gray-600 dark:text-gray-300 outline-none resize-none"
                                        rows={2}
                                        placeholder="Details..."
                                    />
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between mt-2">
                                    {/* Qty Stepper */}
                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-midnight-950 rounded-xl p-1">
                                        <button onClick={() => onDecreaseQty(idx)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-midnight-800 rounded-lg shadow-sm text-gray-500"><FaMinus size={10} /></button>
                                        <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => onIncreaseQty(idx)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-midnight-800 rounded-lg shadow-sm text-emerald-500"><FaPlus size={10} /></button>
                                    </div>

                                    {/* Price & Discount */}
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <div className="text-xs text-gray-400 font-medium">Discount</div>
                                        <DiscountInput
                                            value={displayCurrency === 'USD' ? (item.discount || 0) / usdToKshRate : (item.discount || 0)}
                                            placeholder="0"
                                            onChange={(val) => {
                                                const actualDiscount = displayCurrency === 'USD' ? val * usdToKshRate : val;
                                                onUpdateLineItem(idx, 'discount', actualDiscount);
                                                onUpdateLineItem(idx, 'lineTotal', (item.quantity * item.unitPrice) - actualDiscount);
                                            }}
                                            className="w-20 text-right bg-white dark:bg-midnight-800 border border-gray-200 dark:border-midnight-700 rounded-lg p-1 text-xs font-bold text-rose-500 outline-none"
                                        />
                                        <div className="text-lg font-black text-gray-900 dark:text-white mt-1">{formatPrice(item.lineTotal)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP TABLE VIEW (Visible on medium+ screens) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 dark:bg-midnight-950/80 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800">
                                <tr>
                                    <th className="px-8 py-5 w-[40%]">Item Description</th>
                                    <th className="px-4 py-5 text-center w-[15%]">Quantity</th>
                                    <th className="px-5 py-5 text-right w-[15%]">Unit Price</th>
                                    <th className="px-5 py-5 text-right w-[12%]">Discount</th>
                                    <th className="px-6 py-5 text-right w-[15%]">Total</th>
                                    <th className="px-6 py-5 text-center w-[15%]">Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                                {lines.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all">
                                        <td className="px-8 py-6 align-top">
                                            <div className="font-bold text-gray-900 dark:text-white text-base mb-1 group-hover:text-brand-600 transition-colors">{item.name}</div>

                                            <div className={`transition-all duration-300 overflow-hidden ${showDescriptions ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                                                <textarea
                                                    value={item.description || ''}
                                                    onChange={(e) => onUpdateLineItem(idx, 'description', e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-xs font-medium text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all placeholder-gray-300"
                                                    rows={2}
                                                    placeholder="Add functional details, specs or warranty info..."
                                                />
                                            </div>

                                            {!showDescriptions && (
                                                <button onClick={onToggleDescriptions} className="text-[10px] font-bold text-gray-300 hover:text-brand-500 flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <FiPlus /> Add Description
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-6 align-top">
                                            <div className="flex items-center justify-center gap-1 bg-white dark:bg-midnight-950 border border-gray-200 dark:border-midnight-800 rounded-xl p-1 w-fit mx-auto shadow-sm">
                                                <button onClick={() => onDecreaseQty(idx)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg text-gray-400 hover:text-rose-500 transition-all active:scale-90"><FaMinus size={8} /></button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        if (val >= 1) {
                                                            onUpdateLineItem(idx, 'quantity', val);
                                                            // Trigger update logic
                                                            const discount = item.discount || 0;
                                                            onUpdateLineItem(idx, 'lineTotal', (val * item.unitPrice) - discount);
                                                        }
                                                    }}
                                                    className="w-10 text-center font-black text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none"
                                                />
                                                <button onClick={() => onIncreaseQty(idx)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg text-gray-400 hover:text-emerald-500 transition-all active:scale-90"><FaPlus size={8} /></button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6 text-right font-medium text-gray-500 dark:text-gray-400 text-sm align-top pt-8">
                                            {formatPrice(item.unitPrice)}
                                        </td>
                                        <td className="px-5 py-6 text-right align-top pt-6">
                                            <DiscountInput
                                                value={displayCurrency === 'USD' ? (item.discount || 0) / usdToKshRate : (item.discount || 0)}
                                                placeholder="0"
                                                onChange={(val) => {
                                                    const actualDiscount = displayCurrency === 'USD' ? val * usdToKshRate : val;
                                                    onUpdateLineItem(idx, 'discount', actualDiscount);
                                                    onUpdateLineItem(idx, 'lineTotal', (item.quantity * item.unitPrice) - actualDiscount);
                                                }}
                                                className="w-20 text-right bg-gray-50 dark:bg-midnight-950 border border-gray-200 dark:border-midnight-800 rounded-lg p-2 text-sm font-bold text-rose-500 placeholder-gray-300 outline-none focus:ring-2 focus:ring-rose-500/20"
                                            />
                                        </td>
                                        <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white text-base align-top pt-8">
                                            {formatPrice(item.lineTotal)}
                                        </td>
                                        <td className="px-6 py-6 align-top">
                                            <div className="flex items-center justify-center gap-2 pt-1 opacity-40 group-hover:opacity-100 transition-all">
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => onMoveLine(idx, 'up')} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"><FiArrowUp size={12} /></button>
                                                    <button onClick={() => onMoveLine(idx, 'down')} disabled={idx === lines.length - 1} className="p-1.5 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"><FiArrowDown size={12} /></button>
                                                </div>
                                                <div className="w-px h-8 bg-gray-100 dark:bg-midnight-800 mx-1"></div>

                                                {item.id.startsWith('TEMP-') ? (
                                                    <button
                                                        onClick={() => onSaveToStock(item)}
                                                        title="New Item! Save to Stock Library"
                                                        className="group/save flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900/50 animate-pulse-slow"
                                                    >
                                                        <FiBox size={14} className="group-hover/save:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-wide">Save</span>
                                                    </button>
                                                ) : (
                                                    <button onClick={() => onSaveToStock(item)} title="Update Stock Details" className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-xl transition-colors">
                                                        <FiTool size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => onRemoveLine(idx)} title="Remove Item" className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-xl transition-colors">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default LineItemsTable;
