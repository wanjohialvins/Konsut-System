import React from 'react';
import { FiCloud, FiCloudOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

interface SavingIndicatorProps {
    isSaving: boolean;
    lastSaved?: string;
    isOffline?: boolean;
}

const SavingIndicator: React.FC<SavingIndicatorProps> = ({ isSaving, lastSaved, isOffline }) => {
    if (isOffline) {
        return (
            <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                <FiCloudOff size={12} />
                <span>Offline - Not Saving</span>
            </div>
        );
    }

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
                <FiRefreshCw size={12} className="animate-spin" />
                <span>Saving draft...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
            <FiCheckCircle size={12} />
            <span>Draft Saved {lastSaved && `(${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}</span>
        </div>
    );
};

export default SavingIndicator;
