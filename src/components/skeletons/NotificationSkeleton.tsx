import React from 'react';

export const NotificationSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-midnight-900 p-6 rounded-[2rem] border border-gray-50 dark:border-midnight-800">
                <div className="flex items-start gap-4">
                    <div className="p-6 bg-gray-100 dark:bg-midnight-800 rounded-2xl w-12 h-12"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-1/3 bg-gray-200 dark:bg-midnight-800 rounded"></div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-gray-100 dark:bg-midnight-800/50 rounded"></div>
                            <div className="h-3 w-5/6 bg-gray-100 dark:bg-midnight-800/50 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <div className="h-2 w-20 bg-gray-100 dark:bg-midnight-800/30 rounded"></div>
                            <div className="h-8 w-8 bg-gray-100 dark:bg-midnight-800 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default NotificationSkeleton;
