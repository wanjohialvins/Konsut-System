import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, required, children }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <FaExclamationCircle />
                    {error}
                </p>
            )}
        </div>
    );
};
