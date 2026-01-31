import React from 'react';
import { FaSpinner } from 'react-icons/fa';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <FaSpinner className={`${sizeClasses[size]} animate-spin text-brand-500`} />
        </div>
    );
};
