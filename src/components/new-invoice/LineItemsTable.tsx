
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

    return (
        <div className="bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800 overflow-hidden ring-4 ring-gray-50 dark:ring-midnight-950">
            <div className="p-6 bg-white dark:bg-midnight-900 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gradient-to-r from-transparent via-gray-50/50 to-transparent dark:via-midnight-800/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
                        <FiBox size={18} />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">Line Items <span className="text-gray-400 ml-2 text-sm font-bold opacity-60">({lines.length})</span></h3>
                    {(user?.role === 'admin' || user?.role === 'ceo') && (
                        <button
                            onClick={() => setIsStockModalOpen(true)}
                            title="Quick Add to Inventory"
                            className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95"
                        >
                            <FaPlus size={12} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-midnight-950 rounded-xl">
                    <button
                        type="button"
                        onClick={onTogglePDFDescriptions}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${includeDescriptionsInPDF ? 'bg-white dark:bg-midnight-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        {includeDescriptionsInPDF ? 'PDF: Detailed' : 'PDF: Simple'}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleDescriptions}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${showDescriptions ? 'bg-white dark:bg-midnight-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        {showDescriptions ? 'Editing Desc' : 'No Desc'}
                    </button>
                </div>
            </div>

            {lines.length === 0 ? (
                <div className="p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-midnight-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-midnight-700 animate-pulse">
                        <FiBox size={32} />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-bold mb-2">Your invoice is empty</h3>
                    <p className="text-gray-400 text-sm font-medium">Select products or services from the inventory above to get started.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-midnight-950/80 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800">
                            <tr>
                                <th className="px-8 py-5 w-[40%]">Item Description</th>
                                <th className="px-4 py-5 text-center w-[15%]">Quantity</th>
                                <th className="px-6 py-5 text-right w-[15%]">Unit Price</th>
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
                                                        onUpdateLineItem(idx, 'lineTotal', val * item.unitPrice);
                                                    }
                                                }}
                                                className="w-10 text-center font-black text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none"
                                            />
                                            <button onClick={() => onIncreaseQty(idx)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg text-gray-400 hover:text-emerald-500 transition-all active:scale-90"><FaPlus size={8} /></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right font-medium text-gray-500 dark:text-gray-400 text-sm align-top pt-8">
                                        {displayCurrency === "USD"
                                            ? `$${(item.unitPrice / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                            : (item.unitPrice || 0).toLocaleString()
                                        }
                                    </td>
                                    <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white text-base align-top pt-8">
                                        {displayCurrency === "USD"
                                            ? `$${(item.lineTotal / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                            : (item.lineTotal || 0).toLocaleString()
                                        }
                                    </td>
                                    <td className="px-6 py-6 align-top">
                                        <div className="flex items-center justify-center gap-2 pt-1 opacity-40 group-hover:opacity-100 transition-all">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => onMoveLine(idx, 'up')} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"><FiArrowUp size={12} /></button>
                                                <button onClick={() => onMoveLine(idx, 'down')} disabled={idx === lines.length - 1} className="p-1.5 text-gray-400 hover:text-brand-600 disabled:opacity-30 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"><FiArrowDown size={12} /></button>
                                            </div>
                                            <div className="w-px h-8 bg-gray-100 dark:bg-midnight-800 mx-1"></div>

                                            <button onClick={() => onSaveToStock(item)} title="Save to Stock Library" className="text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-xl transition-colors">
                                                <FaPlus size={14} />
                                            </button>
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
            )}
        </div>
    );
};

export default LineItemsTable;
