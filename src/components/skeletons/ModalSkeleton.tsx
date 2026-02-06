import React from 'react';

export const ModalSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center mb-8">
            <div className="h-6 w-48 bg-gray-200 dark:bg-midnight-800 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-100 dark:bg-midnight-800 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                    <div className="h-3 w-24 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
                    <div className="h-12 w-full bg-gray-100 dark:bg-midnight-800 rounded-xl"></div>
                </div>
            ))}
        </div>

        <div className="h-40 w-full bg-gray-100 dark:bg-midnight-800 rounded-2xl md:col-span-2"></div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-midnight-800">
            <div className="h-12 w-32 bg-gray-100 dark:bg-midnight-800 rounded-xl"></div>
            <div className="h-12 w-48 bg-gray-300 dark:bg-midnight-800 rounded-xl"></div>
        </div>
    </div>
);

export default ModalSkeleton;
