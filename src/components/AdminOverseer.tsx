import React, { useEffect, useState } from "react";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaUsers, FaBolt } from "react-icons/fa";
import { api } from "../services/api";

interface AuditLog {
    id: number;
    user_name?: string;
    action: string;
    details: string;
    timestamp: string;
}

const AdminOverseer: React.FC = () => {
    const [stats, setStats] = useState({
        databaseStatus: "Optimal",
        activeUsers: 0,
        lowStockAlerts: 0,
        recentAudits: [] as AuditLog[]
    });

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [logs, users, stock] = await Promise.all([
                    api.admin.getAuditLogs(),
                    api.users.getAll(),
                    api.stock.getAll()
                ]);

                // Filter for low stock
                const lowStock = (stock as any[]).filter(item => (item.quantity || 0) < 5).length;

                // Get latest significant audits
                const recentLogins = (logs as AuditLog[])
                    .filter(log => log.action === 'login')
                    .slice(0, 3);

                setStats({
                    databaseStatus: "Stable",
                    activeUsers: (users as any[]).length,
                    lowStockAlerts: lowStock,
                    recentAudits: recentLogins
                });
            } catch (e) {
                console.error("Overseer failed to fetch data:", e);
            }
        };
        fetchAdminData();
    }, []);

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
                {stats.recentAudits.map((audit: AuditLog, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                        <span className="font-bold text-gray-300">{audit.user_name || 'System'}</span>
                        <span className="text-gray-500">{new Date(audit.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminOverseer;
