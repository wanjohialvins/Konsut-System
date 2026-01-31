import React, { useEffect, useState } from "react";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaUsers, FaBolt } from "react-icons/fa";
import { api } from "../../services/api";

interface AuditLog {
    id: number;
    user_name?: string;
    action: string;
    details: string;
    timestamp: string;
}

interface AdminOverseerProps {
    stats: {
        databaseStatus: string;
        activeUsers: number;
        lowStockAlerts: number;
        recentLogins: any[];
    }
}

const AdminOverseer: React.FC<AdminOverseerProps> = ({ stats }) => {
    // Removed internal fetching logic
    // Using props passed from Dashboard parent


    return (
        <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><FaShieldAlt size={100} /></div>

            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FaBolt className="text-brand-500 animate-pulse" /> System Overseer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">State</p>
                    <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-emerald-500" />
                        <span className="text-sm font-bold">{stats.databaseStatus}</span>
                    </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Live Users</p>
                    <div className="flex items-center gap-2">
                        <FaUsers className="text-blue-400" />
                        <span className="text-sm font-bold">{stats.activeUsers} Registered</span>
                    </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-rose-400">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Critical Stock</p>
                    <div className="flex items-center gap-2">
                        <FaExclamationTriangle />
                        <span className="text-sm font-bold">{stats.lowStockAlerts} Warning(s)</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recent Access</p>
                {stats.recentLogins.map((log: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0">
                        <span className="text-slate-300 flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-500" size={10} />
                            {log.action}
                        </span>
                        <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminOverseer;
