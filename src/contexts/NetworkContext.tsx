import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

interface NetworkContextType {
    isOnline: boolean;
    isSyncing: boolean;
    queuedCount: number;
    triggerSync: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [queuedCount, setQueuedCount] = useState(0);
    const { showToast } = useToast();

    // Update online status
    const handleOnline = useCallback(() => {
        setIsOnline(true);
        showToast('success', 'Connection restored');
        // Trigger sync when coming back online
        triggerSync();
    }, [showToast]);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        showToast('warning', 'You are offline. Changes will sync when reconnected.');
    }, [showToast]);

    // Trigger sync function (will be implemented with sync queue)
    const triggerSync = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            // Sync queue processing will be implemented here
            const { processQueue, getQueueCount } = await import('../services/syncQueue');
            await processQueue();
            const count = await getQueueCount();
            setQueuedCount(count);
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing]);

    // Update queue count periodically
    useEffect(() => {
        const updateQueueCount = async () => {
            try {
                const { getQueueCount } = await import('../services/syncQueue');
                const count = await getQueueCount();
                setQueuedCount(count);
            } catch (error) {
                console.error('Failed to get queue count:', error);
            }
        };

        updateQueueCount();
        const interval = setInterval(updateQueueCount, 5000); // Update every 5s
        return () => clearInterval(interval);
    }, []);

    // Listen for online/offline events
    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    // Periodic connectivity check (ping API every 30s)
    useEffect(() => {
        const checkConnectivity = async () => {
            try {
                const response = await fetch('/public_html/api/meta.php', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                const online = response.ok;
                if (online !== isOnline) {
                    setIsOnline(online);
                    if (online) {
                        handleOnline();
                    } else {
                        handleOffline();
                    }
                }
            } catch {
                if (isOnline) {
                    setIsOnline(false);
                    handleOffline();
                }
            }
        };

        const interval = setInterval(checkConnectivity, 30000);
        return () => clearInterval(interval);
    }, [isOnline, handleOnline, handleOffline]);

    return (
        <NetworkContext.Provider value={{ isOnline, isSyncing, queuedCount, triggerSync }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within NetworkProvider');
    }
    return context;
};
