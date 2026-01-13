import React, { useState, useEffect } from "react";
import { FiSliders, FiSun, FiMoon, FiMonitor, FiCheckCircle } from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";

const Preferences = () => {
    const { theme, toggleTheme, uiDensity, setUiDensity, accentColor, setAccentColor } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const settings = await api.settings.get();
            await api.settings.save({
                ...settings,
                preferences: { theme, uiDensity, accentColor }
            });
            showToast('success', 'Atmospheric settings synchronized');
        } catch (e) {
            showToast('error', 'Cloud sync failed');
        } finally {
            setLoading(false);
        }
    };

    const DensityCard = ({ value, label, desc }: { value: 'compact' | 'spacious', label: string, desc: string }) => (
        <button
            onClick={() => setUiDensity(value)}
            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-2 ${uiDensity === value
                ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                : 'border-gray-100 dark:border-midnight-800 hover:border-gray-300 dark:hover:border-midnight-700'}`}
        >
            <div className={`p-4 rounded-2xl mb-2 ${uiDensity === value ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-midnight-950 text-gray-400'}`}>
                <FiSliders size={24} />
            </div>
            <p className="font-black uppercase tracking-tight text-gray-900 dark:text-white">{label}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{desc}</p>
        </button>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-amber-500 text-white rounded-[2rem] shadow-2xl shadow-amber-500/20">
                            <FiSliders size={32} />
                        </div>
                        Interface Experience
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Tailor the visual ecosystem to your operational style</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-10 py-5 bg-slate-950 dark:bg-brand-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'SYNCING...' : 'SAVE VIBE'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Theme Card */}
                <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-xl space-y-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-3">Chroma Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => theme !== 'light' && toggleTheme()}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === 'light' ? 'border-brand-600 bg-brand-50' : 'border-transparent bg-gray-50 dark:bg-midnight-950 opacity-40 hover:opacity-100'}`}
                        >
                            <FiSun size={32} className="text-amber-500" />
                            <span className="font-black uppercase text-xs">Radiant</span>
                        </button>
                        <button
                            onClick={() => theme !== 'dark' && toggleTheme()}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-brand-600 bg-midnight-800' : 'border-transparent bg-gray-50 dark:bg-midnight-950 opacity-40 hover:opacity-100'}`}
                        >
                            <FiMoon size={32} className="text-brand-400" />
                            <span className="font-black uppercase text-xs">Midnight</span>
                        </button>
                    </div>
                </div>

                {/* Density Card */}
                <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-xl space-y-8 lg:col-span-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-3">Display Information Density</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DensityCard value="compact" label="Tactical (Compact)" desc="High data density for monitors" />
                        <DensityCard value="spacious" label="Command (Spacious)" desc="Better focus and readability" />
                    </div>
                </div>

                {/* Accent Colors */}
                <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 shadow-xl space-y-6 md:col-span-2 lg:col-span-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-midnight-800 pb-3">Primary Action Hue</h3>
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                        {[
                            { name: 'Classic Blue', color: '#2563eb', value: 'blue' },
                            { name: 'Royal Indigo', color: '#4f46e5', value: 'indigo' },
                            { name: 'Tech Slate', color: '#0f172a', value: 'slate' },
                            { name: 'Emerald', color: '#10b981', value: 'emerald' },
                            { name: 'Rose', color: '#f43f5e', value: 'rose' }
                        ].map(c => (
                            <button
                                key={c.value}
                                onClick={() => setAccentColor(c.value as any)}
                                className={`group relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all ${accentColor === c.value ? 'bg-gray-50 dark:bg-midnight-950 scale-110' : 'hover:scale-105'}`}
                            >
                                <div style={{ backgroundColor: c.color }} className="w-16 h-16 rounded-2xl shadow-2xl shadow-black/10 relative">
                                    {accentColor === c.value && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20 rounded-2xl animate-scale-up">
                                            <FiCheckCircle size={24} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preferences;
