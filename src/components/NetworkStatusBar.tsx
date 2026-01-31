import React, { useEffect, useState } from 'react';
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { useNetwork } from '../contexts/NetworkContext';
import { AnimatePresence, motion } from 'framer-motion';

const NetworkStatusBar: React.FC = () => {
    const { isOnline, isSyncing, queuedCount } = useNetwork();
    const [showOnline, setShowOnline] = useState(false);

    // Show "Back Online" message for 3 seconds
    useEffect(() => {
        if (isOnline) {
            setShowOnline(true);
            const timer = setTimeout(() => setShowOnline(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setShowOnline(false);
        }
    }, [isOnline]);

    // Don't show anything if online and timer expired (normal state)
    // But DO show if syncing (even if online)
    if (isOnline && !isSyncing && !showOnline) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative z-50 flex-shrink-0"
            >
                {/* Offline State */}
                {!isOnline && (
                    <div className="bg-red-500 text-white px-4 py-2 flex justify-center items-center gap-3 text-sm font-bold shadow-md">
                        <FiWifiOff className="animate-pulse" />
                        <span>You are offline. {queuedCount > 0 ? `${queuedCount} changes pending sync.` : 'Changes will be saved locally.'}</span>
                    </div>
                )}

                {/* Syncing State */}
                {isOnline && isSyncing && (
                    <div className="bg-amber-400 text-amber-900 px-4 py-2 flex justify-center items-center gap-3 text-sm font-bold shadow-md">
                        <FiRefreshCw className="animate-spin" />
                        <span>Syncing data with server... {queuedCount > 0 && `(${queuedCount} remaining)`}</span>
                    </div>
                )}

                {/* Back Online State */}
                {isOnline && !isSyncing && showOnline && (
                    <div className="bg-emerald-500 text-white px-4 py-2 flex justify-center items-center gap-3 text-sm font-bold shadow-md">
                        <FiCheckCircle />
                        <span>Connection restored. All systems operational.</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default NetworkStatusBar;
