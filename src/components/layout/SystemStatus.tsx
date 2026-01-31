import React from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi';

const SystemStatus: React.FC = () => {
    const { isOnline, isSyncing, queuedCount } = useNetwork();

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-midnight-800 rounded-full border border-gray-100 dark:border-midnight-700 shadow-sm transition-all duration-300">
            {/* Online/Offline Icon */}
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {isOnline ? (
                    <FiWifi size={14} className="animate-pulse-slow" />
                ) : (
                    <FiWifiOff size={14} />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                    {isOnline ? 'System Live' : 'Offline'}
                </span>
            </div>

            {/* Sync Status */}
            {(isSyncing || queuedCount > 0) && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-midnight-700">
                    <FiRefreshCw
                        size={12}
                        className={`text-brand-600 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                    {queuedCount > 0 && (
                        <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400">
                            {queuedCount}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default SystemStatus;
