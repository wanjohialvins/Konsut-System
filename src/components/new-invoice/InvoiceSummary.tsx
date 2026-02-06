
import React from 'react';
import { FaInfoCircle, FaSave, FaEye, FaFilePdf, FaExchangeAlt } from "react-icons/fa";
import SavingIndicator from '../ui/SavingIndicator';

interface InvoiceSummaryProps {
    subtotal: number;
    totalDiscount?: number;
    grandTotal: number;
    displayCurrency: "Ksh" | "USD";
    setDisplayCurrency: React.Dispatch<React.SetStateAction<"Ksh" | "USD">>;
    usdToKshRate: number;
    setUsdToKshRate: (rate: number) => void;
    showDescriptions: boolean;
    setShowDescriptions: (show: boolean) => void;
    onSave: () => void;
    onPreview: () => void;
    onDownload: () => void;
    isLoading?: boolean;
    isSaving?: boolean;
    isOffline?: boolean;
    lastSaved?: string;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
    subtotal,
    totalDiscount = 0,
    grandTotal,
    displayCurrency,
    setDisplayCurrency,
    usdToKshRate,
    setUsdToKshRate,
    showDescriptions,
    setShowDescriptions,
    onSave,
    onPreview,
    onDownload,
    isLoading = false,
    isSaving = false,
    isOffline = false,
    lastSaved
}) => {
    const isBusy = isLoading || isSaving;


    const formatVal = (val: number) => {
        return displayCurrency === "USD"
            ? (val / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-midnight-800 sticky top-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                <span>Quote Summary</span>
                <FaInfoCircle className="text-gray-300" />
            </h2>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">
                    <span>Persistence Status</span>
                    <SavingIndicator isSaving={isSaving} isOffline={isOffline} lastSaved={lastSaved} />
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-bold">
                    <span>Subtotal</span>
                    <span className="text-gray-900 dark:text-white">{displayCurrency === "USD" ? "$" : "Ksh"} {formatVal(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                    <div className="flex justify-between text-rose-500 dark:text-rose-400 text-sm font-bold">
                        <span>Discount</span>
                        <span>- {displayCurrency === "USD" ? "$" : "Ksh"} {formatVal(totalDiscount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-bold">
                    <span>VAT (16%)</span>
                    <span className="text-gray-900 dark:text-white">{displayCurrency === "USD" ? "$" : "Ksh"} {formatVal(grandTotal - (subtotal - totalDiscount))}</span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-midnight-800 flex justify-between items-center mt-2">
                    <span className="font-black text-xl text-gray-900 dark:text-white">Total</span>
                    <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">{displayCurrency === "USD" ? "$" : "Ksh"} {formatVal(grandTotal)}</span>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={onSave}
                    disabled={isBusy || isOffline}
                    title="Save Document"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    <FaSave size={16} /> {isLoading ? "Processing..." : "Save Document"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onPreview}
                        disabled={isBusy}
                        className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FaEye /> Preview
                    </button>

                    <button
                        onClick={onDownload}
                        disabled={isBusy || isOffline}
                        title="Download PDF"
                        className="w-full py-4 bg-white dark:bg-midnight-800 border-2 border-brand-100 dark:border-midnight-700 text-brand-600 dark:text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-brand-50 dark:hover:bg-midnight-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaFilePdf /> Download
                    </button>
                </div>
            </div>

            {/* Settings Toggles in Summary */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-midnight-800 space-y-6">

                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Display Currency</span>
                    <button
                        onClick={() => setDisplayCurrency(c => c === "Ksh" ? "USD" : "Ksh")}
                        title="Toggle Currency"
                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-gray-100 dark:bg-midnight-950 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-midnight-800 transition-colors flex items-center gap-2"
                    >
                        <FaExchangeAlt /> {displayCurrency}
                    </button>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Exchange Rate (1 USD = ? Ksh)</label>
                    <input
                        type="number"
                        value={usdToKshRate}
                        onChange={(e) => setUsdToKshRate(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-3 rounded-xl text-sm font-bold text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-midnight-950 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 pl-2">Show Descriptions</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle" checked={showDescriptions} onChange={(e) => setShowDescriptions(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5" />
                        <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${showDescriptions ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'}`}></label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceSummary;
