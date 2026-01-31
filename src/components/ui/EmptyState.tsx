import React from 'react';

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Icon className="text-gray-300 text-6xl mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/30"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
