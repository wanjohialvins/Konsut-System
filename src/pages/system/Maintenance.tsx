import React from "react";
import { FiLock, FiClock } from "react-icons/fi";

const Maintenance: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-brand-600/20 rounded-[2rem] flex items-center justify-center mx-auto border border-brand-500/30">
                        <FiLock className="text-brand-500 animate-pulse" size={48} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">System Lockdown</h1>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        An administrator has initiated a high-priority maintenance protocol. Access is temporarily restricted to ensure data integrity during system upgrades.
                    </p>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 text-left">
                    <div className="p-3 bg-brand-600 rounded-xl">
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Estimated Duration</p>
                        <p className="text-sm font-bold text-slate-200">15 - 30 Minutes</p>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/10"
                    >
                        Check Status
                    </button>
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol Code: MAINT-403-ALPHA</p>
            </div>
        </div>
    );
};

export default Maintenance;
