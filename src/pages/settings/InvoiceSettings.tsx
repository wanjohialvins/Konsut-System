// src/pages/settings/InvoiceSettings.tsx
/**
 * Invoice Configuration Engine
 * 
 * Controls the layout, content, and formulas for generated financial documents.
 * 
 * Features:
 * - Financial formulas (Tax rates, Currency exchange)
 * - PDF Layout controls (Page size, Orientation, Fonts)
 * - Visibility toggles for document sections
 * - Legal disclaimers and default terms
 */
import React, { useState, useEffect } from "react";
import { FiLayout, FiSave, FiEye, FiSettings, FiCheckCircle, FiPercent, FiFileText } from "react-icons/fi";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { SettingsSkeleton } from "../../components/skeletons/CommonSkeletons";

/**
 * InvoiceSettings Component.
 * Provides a comprehensive form to configure global invoice settings.
 */
const InvoiceSettings = () => {
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [invoiceSettings, setInvoiceSettings] = useState({
        taxRate: 0.16,
        currencyRate: 130,
        includeHeader: true,
        includeFooter: true,
        includeTerms: true,
        includeSignature: true,
        includePaymentDetails: true,
        includeCustomerDetails: true,
        includeClientPhone: true,
        includeClientEmail: true,
        includeClientAddress: true,
        includeClientPIN: true,
        includeWatermark: true,
        includeBarcode: true,
        includeTax: true,
        includeClientResponsibilities: true,
        pageSize: "a4",
        pageOrientation: "portrait",
        fontSize: 10,
        fontFamily: "Helvetica",
        footerText: "Thank you for your business!",
        termsAndConditions: "1. 60% deposit required (Standard term).\n2. Balance due upon completion.",
        clientResponsibilities: "1. Provide clear access to the site.\n2. Ensure power and water availability.",
        paymentDetails: "Bank: I&M BANK\nBranch: RUIRU BRANCH\nAccount No (KSH): 05507023236350\nAccount No (USD): 05507023231250\nSWIFT CODE: IMBLKENA\nBANK CODE: 57 | BRANCH CODE: 055"
    });

    useEffect(() => {
        setInitialLoading(true);
        api.settings.get().then(s => {
            if (s?.invoiceSettings) setInvoiceSettings(prev => ({ ...prev, ...s.invoiceSettings }));
        }).finally(() => setInitialLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const current = await api.settings.get();
            await api.settings.save({ ...current, invoiceSettings });
            // Critical: Sync to localStorage for PDF generator
            localStorage.setItem('invoiceSettings', JSON.stringify(invoiceSettings));
            showToast('success', 'Invoice engine re-calibrated');
        } catch (error) {
            showToast('error', 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ label, field, desc }: { label: string, field: keyof typeof invoiceSettings, desc?: string }) => (
        <label className="flex items-center justify-between p-6 bg-white dark:bg-midnight-950 border border-gray-100 dark:border-midnight-800 rounded-3xl hover:border-brand-500 transition-all cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all ${invoiceSettings[field] ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'bg-gray-50 dark:bg-midnight-900 text-gray-400'}`}>
                    <FiCheckCircle size={20} />
                </div>
                <div>
                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{label}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{desc || (invoiceSettings[field] ? 'Enabled' : 'Disabled')}</p>
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

    if (initialLoading) return <SettingsSkeleton />;

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-purple-600 text-white rounded-[2rem] shadow-2xl shadow-purple-500/20">
                            <FiLayout size={32} />
                        </div>
                        Invoice Engine
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
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Global VAT / Tax (decimal, e.g 0.16)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={invoiceSettings.taxRate}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, taxRate: Number(e.target.value) })}
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
                            Layout & Typography
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Size</label>
                                <select
                                    value={invoiceSettings.pageSize}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, pageSize: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="a4">A4 (Standard)</option>
                                    <option value="a5">A5 (Compact)</option>
                                    <option value="letter">Letter</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Orientation</label>
                                <select
                                    value={invoiceSettings.pageOrientation}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, pageOrientation: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Font Family</label>
                                <select
                                    value={invoiceSettings.fontFamily}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, fontFamily: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Courier New">Courier</option>
                                    <option value="Times New Roman">Times</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Font Size (pt)</label>
                                <input
                                    type="number"
                                    value={invoiceSettings.fontSize}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, fontSize: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>

                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-12 mb-8 border-b border-gray-100 dark:border-midnight-800 pb-3 flex items-center gap-2">
                            <FiLayout /> Document Visibility Toggles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Toggle label="Business Header" field="includeHeader" desc="Logo & Company Identity" />
                            <Toggle label="System Footer" field="includeFooter" desc="Branding & Disclaimer" />
                            <Toggle label="Watermark" field="includeWatermark" desc="Subtle BG Branding" />
                            <Toggle label="Barcodes" field="includeBarcode" desc="Unique Scannable ID" />
                            <Toggle label="Authorized Signature" field="includeSignature" desc="Draw signature line" />
                            <Toggle label="Terms of Service" field="includeTerms" desc="Append legal notes" />
                            <Toggle label="Payment Details" field="includePaymentDetails" desc="Show Bank Info" />
                            <Toggle label="VAT/Tax Info" field="includeTax" desc="Show Tax Breakdown" />
                        </div>

                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-12 mb-8 border-b border-gray-100 dark:border-midnight-800 pb-3 flex items-center gap-2">
                            <FiSettings /> Client Detail Synchronization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Toggle label="Profile Summary" field="includeCustomerDetails" desc="Show Name/ID Box" />
                            <Toggle label="Show Client Phone" field="includeClientPhone" />
                            <Toggle label="Show Client Email" field="includeClientEmail" />
                            <Toggle label="Show Client Address" field="includeClientAddress" />
                            <Toggle label="Show KRA PIN" field="includeClientPIN" />
                            <Toggle label="Client Responsibilities" field="includeClientResponsibilities" desc="Toggle per document" />
                        </div>
                    </div>

                    <div className="bg-slate-950 text-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tight">Legal Disclaimers</h3>
                            <FiFileText size={24} className="text-indigo-400" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Default Global Terms</label>
                                <textarea
                                    value={invoiceSettings.termsAndConditions}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Client Responsibilities (Default)</label>
                                <textarea
                                    value={invoiceSettings.clientResponsibilities}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, clientResponsibilities: e.target.value })}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Payment / Bank Details (Shown on Documents)</label>
                                <textarea
                                    value={invoiceSettings.paymentDetails}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, paymentDetails: e.target.value })}
                                    rows={5}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Enter bank, branch, and account numbers..."
                                />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Footer Disclaimer / Branding</label>
                                <textarea
                                    value={invoiceSettings.footerText}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                                    rows={2}
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
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">Changes made here affect all <span className="text-brand-600 font-bold">New Documents</span> instantly. Standardized VAT is automatically applied to all line items unless overridden manually.</p>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-brand-500/40 active:scale-[0.98] flex items-center justify-center gap-4"
                        >
                            <FiSave /> {saving ? 'UPDATING...' : 'APPLY CONFIG'}
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
