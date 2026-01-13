import React, { useState } from 'react';
import { FiLifeBuoy, FiPlus, FiAlertCircle, FiMessageCircle, FiClock, FiStar } from 'react-icons/fi';

const Support = () => {
    const [tickets] = useState([
        { id: '#SUP-102', title: 'Unable to export large CSV files', status: 'open', priority: 'high', date: '10m ago' },
        { id: '#SUP-101', title: 'Printer Connection Error (HR Office)', status: 'closed', priority: 'medium', date: '2h ago' },
        { id: '#SUP-100', title: 'New User Account Request', status: 'pending', priority: 'low', date: 'Yesterday' },
    ]);

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-600/20">
                            <FiLifeBuoy size={28} />
                        </div>
                        System Support Hub
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Internal helpdesk for troubleshooting and technical requests</p>
                </div>
                <button className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all active:scale-95">
                    <FiPlus /> Open Ticket
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Live Stats</h4>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-gray-500">Response Rate</span>
                                    <span className="text-rose-600">92%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-midnight-950 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full w-[92%]"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-midnight-950 rounded-2xl text-center">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">12</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Active</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-midnight-950 rounded-2xl text-center">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">84</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Resolved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gray-50/30 dark:bg-midnight-950/30">
                            <h3 className="font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Active Incident Reports</h3>
                            <button className="text-xs font-bold text-rose-600 hover:underline hover:underline-offset-4">View All Archive</button>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-midnight-800">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-midnight-800/20 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ticket.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <FiAlertCircle size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-midnight-950 px-2 py-0.5 rounded leading-none">{ticket.id}</span>
                                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">{ticket.title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                                <FiClock size={12} /> Reported {ticket.date} • <span className="capitalize">{ticket.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 border border-gray-100 dark:border-midnight-800 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-midnight-800 transition-all">Engage</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
