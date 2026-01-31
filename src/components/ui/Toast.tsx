import React from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
    const config = {
        success: { icon: FaCheckCircle, bg: 'bg-green-500', text: 'text-white' },
        error: { icon: FaExclamationCircle, bg: 'bg-red-500', text: 'text-white' },
        info: { icon: FaInfoCircle, bg: 'bg-blue-500', text: 'text-white' },
        warning: { icon: FaExclamationCircle, bg: 'bg-yellow-500', text: 'text-white' }
    };

    const { icon: Icon, bg, text } = config[type];

    React.useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${bg} ${text} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up`}>
            <Icon className="text-xl" />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-auto text-xl hover:opacity-75">
                ×
            </button>
        </div>
    );
};
