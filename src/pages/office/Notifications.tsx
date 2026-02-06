import { useState, useEffect, useCallback } from 'react';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle, FiBellOff, FiMail, FiMessageSquare, FiClock } from 'react-icons/fi';
import { api } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import NotificationSkeleton from '../../components/skeletons/NotificationSkeleton';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
}

const Notifications = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.admin.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await api.admin.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) {
            showToast('error', 'Failed to update notification');
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n => api.admin.markNotificationRead(n.id)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            showToast('success', 'All marked as read');
        } catch (e) {
            showToast('error', 'Failed to update all');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.admin.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            showToast('success', 'Notification deleted');
        } catch (e) {
            showToast('error', 'Failed to delete notification');
        }
    };

    const getIcon = (type: string, read: boolean) => {
        const baseClass = read ? "text-gray-400" : "text-brand-600";
        switch (type) {
            case 'success': return <FiCheckCircle className={read ? "text-gray-400" : "text-emerald-500"} />;
            case 'warning': return <FiAlertCircle className={read ? "text-gray-400" : "text-amber-500"} />;
            case 'error': return <FiBellOff className={read ? "text-gray-400" : "text-rose-500"} />;
            default: return <FiInfo className={baseClass} />;
        }
    };

    const filtered = (notifications || []).filter(n => {
        if (!n) return false;
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const renderDate = (dateStr: string) => {
        try {
            if (!dateStr) return 'Unknown date';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Invalid date';
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-500/20">
                            <FiBell size={24} />
                        </div>
                        Notifications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your system alerts and team updates</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 p-1.5 rounded-2xl flex gap-1">
                        {(['all', 'unread', 'read'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-midnight-800'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {Array.isArray(notifications) && notifications.length > 0 && notifications.some(n => n && !n.read) && (
                    <div className="flex justify-end">
                        <button onClick={markAllAsRead} className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
                            <FiCheck /> Mark all as read
                        </button>
                    </div>
                )}

                {loading ? (
                    <NotificationSkeleton />
                ) : filtered.length > 0 ? (
                    filtered.map(notification => {
                        if (!notification) return null;
                        return (
                            <div
                                key={notification.id || Math.random()}
                                className={`group bg-white dark:bg-midnight-900 p-6 rounded-[2rem] border transition-all duration-300 ${notification.read ? 'border-gray-50 dark:border-midnight-800 opacity-80' : 'border-brand-100 dark:border-brand-500/30 shadow-sm'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${notification.read ? 'bg-gray-100 dark:bg-midnight-800' : 'bg-brand-50 dark:bg-brand-500/10'}`}>
                                        {getIcon(notification.type || 'info', notification.read)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold transition-colors ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white group-hover:text-brand-600'}`}>
                                                {notification.title || 'Untitled Notification'}
                                            </h3>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-brand-600 rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{notification.message || 'No content provided.'}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1">
                                                    <FiClock size={12} />
                                                    {renderDate(notification.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.read && notification.id && (
                                                    <button onClick={() => markAsRead(notification.id)} className="p-2 text-brand-600 bg-brand-50 dark:bg-brand-900/20 rounded-xl hover:bg-brand-100 transition-colors" title="Mark Read">
                                                        <FiCheck size={16} />
                                                    </button>
                                                )}
                                                {notification.id && (
                                                    <button onClick={() => deleteNotification(notification.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-midnight-800 rounded-xl transition-colors" title="Delete">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white dark:bg-midnight-950/50 border-2 border-dashed border-gray-100 dark:border-midnight-800 rounded-[3rem] py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-midnight-900 rounded-full flex items-center justify-center text-gray-300">
                            <FiBellOff size={40} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">All caught up!</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications in this category.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
