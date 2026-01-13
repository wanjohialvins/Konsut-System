import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiInfo, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { api } from '../services/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    created_at: string;
}

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.admin.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await api.admin.markNotificationRead(id);
    };

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await api.admin.deleteNotification(id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        // In real world, call bulk API
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20 shadow-green-500/10';
            case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 shadow-amber-500/10';
            case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20 shadow-red-500/10';
            default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-blue-500/10';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <FiCheckCircle size={20} />;
            case 'warning': return <FiAlertTriangle size={20} />;
            case 'error': return <FiAlertTriangle size={20} />;
            default: return <FiInfo size={20} />;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in mb-20">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                        <div className="p-4 bg-brand-600 text-white rounded-[2rem] shadow-2xl shadow-brand-500/20">
                            <FiBell size={32} />
                        </div>
                        Inbound Notifications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium text-lg">Manage your system alerts and team updates</p>
                </div>
                <div className="flex gap-3 h-fit mt-auto">
                    <button
                        onClick={markAllRead}
                        className="px-6 py-3 bg-white dark:bg-midnight-900 text-gray-700 dark:text-white border border-gray-200 dark:border-midnight-800 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-all shadow-sm"
                    >
                        <FiCheck /> Mark all as read
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Syncing with cloud...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white dark:bg-midnight-900 p-20 rounded-[3rem] border border-gray-100 dark:border-midnight-800 text-center shadow-xl shadow-gray-200/50 dark:shadow-none">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-midnight-950 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <FiBell size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Workspace clear!</h3>
                        <p className="text-gray-500 font-medium">You don't have any unread notifications right now.</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`group relative p-8 rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/5 flex gap-6 items-start ${n.read ? 'bg-white/50 dark:bg-midnight-900/50 border-gray-100 dark:border-midnight-800 opacity-80' : 'bg-white dark:bg-midnight-900 border-brand-100 dark:border-midnight-700 shadow-xl shadow-gray-200/40 dark:shadow-none font-medium'}`}
                        >
                            <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-lg ${getTypeStyles(n.type)}`}>
                                {getTypeIcon(n.type)}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`text-xl font-bold leading-tight ${n.read ? 'text-gray-600 dark:text-gray-400 font-bold' : 'text-gray-900 dark:text-white font-black'}`}>
                                        {n.title}
                                    </h3>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <FiClock size={12} /> {new Date(n.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={`text-gray-500 dark:text-gray-300 leading-relaxed mb-4 ${n.read ? 'text-sm' : 'text-base'}`}>
                                    {n.message}
                                </p>

                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!n.read && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="text-xs font-black text-brand-600 uppercase tracking-widest hover:underline underline-offset-4"
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(n.id)}
                                        className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline underline-offset-4"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>

                            {!n.read && (
                                <div className="absolute top-8 right-8 w-3 h-3 bg-brand-600 rounded-full animate-pulse shadow-lg shadow-brand-600/50"></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
