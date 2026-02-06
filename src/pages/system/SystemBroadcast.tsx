import React, { useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { DashboardSkeleton } from "../../components/skeletons/CommonSkeletons";
import { useAuth } from "../../contexts/AuthContext";

const SystemBroadcast = () => {
    const { user } = useAuth();
    if (!user) return <DashboardSkeleton />;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [priority, setPriority] = useState("system"); // system, warning, critical

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return showToast('error', 'Message cannot be empty');
        setLoading(true);
        try {
            await api.admin.runAction('broadcast', broadcastMsg, priority);
            showToast('success', `Broadcast sent as ${priority.toUpperCase()}`);
            setBroadcastMsg("");
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Broadcast failed';
            showToast('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <span className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20">
                        <FiMessageSquare size={20} className="md:w-6 md:h-6" />
                    </span>
                    Command Center
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-lg md:ml-1 hidden md:block">System-wide communications and announcements</p>
            </header>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:hidden">System-wide communications</p>

            <div className="bg-white dark:bg-midnight-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-gray-100 dark:border-midnight-800">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <FiMessageSquare size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">System Broadcast</h2>
                        <p className="text-sm md:text-base text-gray-500 mt-2">Send an instant notification to everyone currently logged into the system.</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-midnight-950 p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-midnight-800 text-left space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Priority Level</label>
                            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                                {['system', 'warning', 'critical'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setPriority(level)}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold uppercase text-xs transition-all ${priority === level
                                            ? level === 'critical' ? 'bg-red-500 border-red-500 text-white'
                                                : level === 'warning' ? 'bg-amber-500 border-amber-500 text-white'
                                                    : 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-transparent border-gray-200 dark:border-midnight-800 text-gray-400 hover:border-gray-300'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Announcement Message</label>
                            <textarea
                                value={broadcastMsg}
                                onChange={e => setBroadcastMsg(e.target.value)}
                                placeholder="Important maintenance scheduled for tonight..."
                                className="w-full h-32 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white font-medium p-0 focus:ring-0 text-sm md:text-base"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleBroadcast}
                        disabled={loading}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
                    >
                        Broadcast Message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemBroadcast;
