import React, { useState, useEffect } from "react";
import { FiBriefcase, FiSave, FiMapPin, FiPhone, FiMail, FiGlobe, FiFileText } from "react-icons/fi";
import logoUrl from '../assets/logo.jpg';
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";

const CompanyProfile = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    // Initial state moved to below DEFAULT_COMPANY definition

    const DEFAULT_COMPANY = {
        name: "Konsut Ltd",
        address: "P.O. Box 12345, Nairobi, Kenya\nWestlands, Mirage Tower 2",
        phone: "+254 700 000 000",
        email: "info@konsut.com",
        website: "www.konsut.com",
        pin: "P051234567Z",
        logo: logoUrl
    };

    const [company, setCompany] = useState(DEFAULT_COMPANY);

    useEffect(() => {
        api.settings.get().then(s => {
            if (s?.company) {
                // Merge API data with defaults to ensure no missing fields
                setCompany(prev => ({ ...prev, ...s.company }));
            }
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const current = await api.settings.get();
            await api.settings.save({ ...current, company });
            showToast('success', 'Business identity updated');
        } catch (error) {
            showToast('error', 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="p-4 bg-brand-600 text-white rounded-[2rem] shadow-2xl shadow-brand-500/20">
                        <FiBriefcase size={32} />
                    </div>
                    Company Profile
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Manage your official business information for invoices</p>
            </header>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white dark:bg-midnight-900 rounded-[3rem] p-10 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-midnight-800 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                <FiBriefcase /> Legal Entity Name
                            </label>
                            <input
                                value={company.name}
                                onChange={e => setCompany({ ...company, name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                <FiFileText /> KRA PIN / Tax ID
                            </label>
                            <input
                                value={company.pin}
                                onChange={e => setCompany({ ...company, pin: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                            <FiMapPin /> Registered Address
                        </label>
                        <textarea
                            value={company.address}
                            onChange={e => setCompany({ ...company, address: e.target.value })}
                            rows={3}
                            className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-medium text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                <FiPhone /> Contact Number
                            </label>
                            <input
                                value={company.phone}
                                onChange={e => setCompany({ ...company, phone: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                <FiMail /> Support Email
                            </label>
                            <input
                                type="email"
                                value={company.email}
                                onChange={e => setCompany({ ...company, email: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl p-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-700 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-4"
                        >
                            <FiSave /> {loading ? 'Saving Changes...' : 'Synchronize Identity'}
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-midnight-800 shadow-xl">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-midnight-800 pb-2">Business Logo</h3>
                        <div className="aspect-square bg-gray-50 dark:bg-midnight-950 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-midnight-800 flex items-center justify-center relative overflow-hidden group">
                            {company.logo ? (
                                <img src={company.logo} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain transition-transform group-hover:scale-110" />
                            ) : (
                                <FiBriefcase className="text-gray-300" size={48} />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <span className="text-white font-black uppercase text-xs tracking-widest">Update Logo</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={company.logo}
                            onChange={e => setCompany({ ...company, logo: e.target.value })}
                            placeholder="Logo URL (Cloudinary/S3)"
                            className="w-full mt-6 bg-gray-50 dark:bg-midnight-950 border-none rounded-xl p-4 text-xs font-bold text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div className="bg-brand-600 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-brand-500/20 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Web Identity</p>
                        <div className="flex items-center gap-4">
                            <FiGlobe size={24} />
                            <input
                                value={company.website}
                                onChange={e => setCompany({ ...company, website: e.target.value })}
                                className="bg-transparent border-none p-0 text-xl font-black placeholder-white/40 focus:ring-0 w-full"
                                placeholder="www.yoursite.com"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CompanyProfile;
