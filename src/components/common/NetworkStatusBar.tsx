import React from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { FaWifi, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NetworkStatusBar Component
 * Displays connection status at the top of the screen
 * - Green: Online (auto-hides after 3s)
 * - Red: Offline (persistent, shows queue count)
 * - Yellow: Syncing (shows progress)
 */
const NetworkStatusBar: React.FC = () => {
    const { isOnline, isSyncing, queuedCount } = useNetwork();
    const [showOnline, setShowOnline] = React.useState(false);

    // Show online banner briefly when coming back online
    React.useEffect(() => {
        if (isOnline && !isSyncing) {
            setShowOnline(true);
            const timer = setTimeout(() => setShowOnline(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, isSyncing]);

    // Don't show anything if online and not syncing
    if (isOnline && !isSyncing && !showOnline) {
        return null;
    }

    const getStatusConfig = () => {
        if (isSyncing) {
            return {
                bg: 'bg-yellow-500',
                icon: <FaSync className="animate-spin" size={16} />,
                text: `Syncing ${queuedCount} change${queuedCount !== 1 ? 's' : ''}...`,
                textColor: 'text-yellow-900'
            };
        }
        if (!isOnline) {
            return {
                bg: 'bg-red-500',
                icon: <FaExclamationTriangle size={16} />,
                text: queuedCount > 0
                    ? `You're offline. ${queuedCount} change${queuedCount !== 1 ? 's' : ''} pending sync.`
                    : "You're offline. Changes will sync when reconnected.",
                textColor: 'text-white'
            };
        }
        return {
            bg: 'bg-emerald-500',
            icon: <FaWifi size={16} />,
            text: 'All changes synced!',
            textColor: 'text-white'
        };
    };

    const config = getStatusConfig();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed top-0 left-0 right-0 z-[9999] ${config.bg} shadow-lg`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
                    <span className={config.textColor}>{config.icon}</span>
                    <span className={`${config.textColor} font-bold text-sm`}>
                        {config.text}
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NetworkStatusBar;
