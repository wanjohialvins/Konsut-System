import React from 'react';

/**
 * PageHeaderSkeleton - Unified header loading state
 */
export const PageHeaderSkeleton = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-pulse">
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-midnight-800 rounded-2xl"></div>
                <div className="h-8 w-48 bg-gray-300 dark:bg-midnight-800 rounded-xl"></div>
            </div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
        </div>
        <div className="w-48 h-10 bg-gray-100 dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-2xl"></div>
    </div>
);

/**
 * TableSkeleton - Standard row-based loading
 */
export const TableSkeleton = ({ rows = 5 }) => (
    <div className="bg-white dark:bg-midnight-900 rounded-[2rem] border border-gray-100 dark:border-midnight-800 overflow-hidden animate-pulse">
        <div className="bg-gray-50 dark:bg-midnight-800/50 p-4 border-b border-gray-100 dark:border-midnight-800 flex gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 flex-1 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>)}
        </div>
        <div className="p-4 space-y-6">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    {[1, 2, 3, 4, 5].map(j => <div key={j} className="h-3 flex-1 bg-gray-100 dark:bg-midnight-800/30 rounded"></div>)}
                </div>
            ))}
        </div>
    </div>
);

/**
 * CardGridSkeleton - For Clients, Inventory items, etc.
 */
export const CardGridSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-midnight-900 p-6 rounded-[2rem] border border-gray-100 dark:border-midnight-800 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-midnight-800"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/4 bg-gray-300 dark:bg-midnight-800 rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 dark:bg-midnight-800/30 rounded"></div>
                    <div className="h-2 w-5/6 bg-gray-100 dark:bg-midnight-800/30 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

/**
 * SettingsSkeleton - For configuration pages
 */
export const SettingsSkeleton = () => (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-midnight-900 rounded-[3rem] p-10 border border-gray-100 dark:border-midnight-800 space-y-8">
                    <div className="h-6 w-1/3 bg-gray-200 dark:bg-midnight-800 rounded mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="h-3 w-24 bg-gray-200 dark:bg-midnight-800 rounded"></div>
                            <div className="h-14 w-full bg-gray-100 dark:bg-midnight-800 rounded-2xl"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-3 w-24 bg-gray-200 dark:bg-midnight-800 rounded"></div>
                            <div className="h-14 w-full bg-gray-100 dark:bg-midnight-800 rounded-2xl"></div>
                        </div>
                    </div>
                    <div className="pt-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 w-full bg-gray-50 dark:bg-midnight-950 rounded-3xl border border-gray-100 dark:border-midnight-800"></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-8">
                <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-midnight-800 h-64"></div>
            </div>
        </div>
    </div>
);
