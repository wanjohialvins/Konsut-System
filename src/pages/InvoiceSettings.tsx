import React, { useState, useEffect } from "react";
import { FiLayout, FiSave, FiEye, FiSettings, FiCheckCircle, FiPercent, FiFileText } from "react-icons/fi";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";

const InvoiceSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [invoiceSettings, setInvoiceSettings] = useState({
        defaultTax: 0,
        currencyRate: 130,
        includeHeader: true,
        includeFooter: true,
        includeTerms: true,
        includeSignature: true,
        includePaymentDetails: true,
        includeClientPhone: true,
        includeClientEmail: true,
        includeClientAddress: true,
        includeClientPIN: true,
        footerText: "Thank you for your business!",
        termsAndConditions: "Payment is due within 30 days."
    });

    useEffect(() => {
        api.settings.get().then(s => {
            if (s?.invoiceSettings) setInvoiceSettings(s.invoiceSettings);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const current = await api.settings.get();
            await api.settings.save({ ...current, invoiceSettings });
            // Critical: Sync to localStorage for PDF generator
            localStorage.setItem('invoiceSettings', JSON.stringify(invoiceSettings));
            showToast('success', 'Document engine re-calibrated');
        } catch (error) {
            showToast('error', 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const Toggle = ({ label, field }: { label: string, field: keyof typeof invoiceSettings }) => (
        <label className="flex items-center justify-between p-6 bg-white dark:bg-midnight-950 border border-gray-100 dark:border-midnight-800 rounded-3xl hover:border-brand-500 transition-all cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all ${invoiceSettings[field] ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'bg-gray-50 dark:bg-midnight-900 text-gray-400'}`}>
                    <FiCheckCircle size={20} />
                </div>
                <div>
                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{label}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{invoiceSettings[field] ? 'Enabled' : 'Disabled'}</p>
                </div>
            </div>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={!!invoiceSettings[field]}
                    onChange={e => setInvoiceSettings({ ...invoiceSettings, [field]: !!e.target.checked })}
                    className="peer sr-only"
                />
                <div className="w-12 h-6 bg-gray-200 dark:bg-midnight-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </div>
        </label>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-purple-600 text-white rounded-[2rem] shadow-2xl shadow-purple-500/20">
                            <FiLayout size={32} />
                        </div>
                        Document Engine
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Configure PDF layouts, tax rules, and document metadata</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-2xl shadow-gray-200/40 dark:shadow-none">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 dark:border-midnight-800 pb-3 flex items-center gap-2">
                            <FiPercent /> Financial Formulas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Global VAT / Tax (%)</label>
                                <input
                                    type="number"
                                    value={invoiceSettings.defaultTax}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, defaultTax: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-xl font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Exchange Rate (1 USD = ? Ksh)</label>
                                <input
                                    type="number"
                                    value={invoiceSettings.currencyRate}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, currencyRate: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-xl font-black text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-12 mb-8 border-b border-gray-100 dark:border-midnight-800 pb-3 flex items-center gap-2">
                            <FiLayout /> Document Visibility Toggles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Toggle label="Business Header" field="includeHeader" />
                            <Toggle label="System Footer" field="includeFooter" />
                            <Toggle label="Terms of Service" field="includeTerms" />
                            <Toggle label="Payment Details" field="includePaymentDetails" />
                            <Toggle label="Authorized Signature" field="includeSignature" />
                        </div>

                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-12 mb-8 border-b border-gray-100 dark:border-midnight-800 pb-3 flex items-center gap-2">
                            <FiSettings /> Client Detail Synchronization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Toggle label="Show Client Phone" field="includeClientPhone" />
                            <Toggle label="Show Client Email" field="includeClientEmail" />
                            <Toggle label="Show Client Address" field="includeClientAddress" />
                            <Toggle label="Show KRA PIN" field="includeClientPIN" />
                        </div>
                    </div>

                    <div className="bg-slate-950 text-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tight">Legal Disclaimers</h3>
                            <FiFileText size={24} className="text-indigo-400" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Default Terms</label>
                                <textarea
                                    value={invoiceSettings.termsAndConditions}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                                    rows={5}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Footer Branding</label>
                                <textarea
                                    value={invoiceSettings.footerText}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                                    rows={5}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-midnight-800 shadow-xl sticky top-28">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-midnight-800 pb-2 flex items-center gap-2">
                            <FiEye /> Document Workflow
                        </h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">Changes made here affect all <span className="text-brand-600 font-bold">New Invoices</span> and Quotations instantly. Standardized VAT is automatically applied to all line items unless overridden manually.</p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-brand-500/40 active:scale-[0.98] flex items-center justify-center gap-4"
                        >
                            <FiSave /> {loading ? 'UPDATING...' : 'APPLY CONFIG'}
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Active System Configuration
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceSettings;
