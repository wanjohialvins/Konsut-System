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
                const [logs, users, stockData] = await Promise.all([
                    api.admin.getAuditLogs().catch(() => []), // Fallback to empty array on fail
                    api.users.getAll().catch(() => []),       // Fallback to empty array
                    api.stock.getAll().catch(() => [])        // Fallback to empty array
                ]);

                // Safely handle stock - check if it's flat array or object
                let stockItems: any[] = [];
                if (Array.isArray(stockData)) {
                    stockItems = stockData;
                } else if (stockData && typeof stockData === 'object') {
                    stockItems = (stockData as any).products || [];
                }

                // Filter for low stock safely
                const lowStock = stockItems.filter((p: any) => {
                    if (!p) return false;
                    // Logic: price missing OR quantity < 5
                    return !p.priceKsh || (p.quantity !== undefined && Number(p.quantity) < 5);
                }).length;

                // Safely handle logs
                const logArray = Array.isArray(logs) ? logs : [];
                const recentLogins = (logArray as AuditLog[])
                    .filter(log => log && (log.action === 'login' || log.action?.includes('login')))
                    .slice(0, 3);

                const userCount = Array.isArray(users) ? users.length : 0;

                setStats({
                    databaseStatus: "Stable",
                    activeUsers: userCount,
                    lowStockAlerts: lowStock,
                    recentAudits: recentLogins
                });
            } catch (err) {
                console.error("Overseer failed to fetch data", err);
                // Keep default state or set error state - preventing crash
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
                {stats.recentAudits.length > 0 ? (
                    stats.recentAudits.map((audit: AuditLog, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                            <span className="font-bold text-gray-300">{audit.user_name || 'System'}</span>
                            <span className="text-gray-500">{audit.timestamp ? new Date(audit.timestamp).toLocaleTimeString() : '--:--'}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-600 italic">No recent login activity.</p>
                )}
            </div>
        </div>
    );
};

export default AdminOverseer;
