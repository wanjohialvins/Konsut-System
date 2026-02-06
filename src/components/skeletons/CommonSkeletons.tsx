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

/**
 * DashboardSkeleton - For Analytics/Business Intelligence
 */
export const DashboardSkeleton = () => (
    <div className="p-6 max-w-[1600px] mx-auto animate-pulse">
        <PageHeaderSkeleton />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-midnight-900 p-6 rounded-[2rem] border border-gray-100 dark:border-midnight-800 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-midnight-800 rounded"></div>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-midnight-800"></div>
                    </div>
                    <div className="h-8 w-32 bg-gray-300 dark:bg-midnight-800 rounded"></div>
                    <div className="h-3 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"></div>
                </div>
            ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white dark:bg-midnight-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-midnight-800 h-[400px]">
                <div className="h-6 w-48 bg-gray-200 dark:bg-midnight-800 rounded mb-8"></div>
                <div className="flex items-end gap-4 h-[300px]">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="flex-1 bg-gray-100 dark:bg-midnight-800 rounded-t-xl" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-midnight-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-midnight-800 h-[400px]">
                <div className="h-6 w-48 bg-gray-200 dark:bg-midnight-800 rounded mb-8"></div>
                <div className="w-48 h-48 rounded-full border-8 border-gray-100 dark:border-midnight-800 mx-auto mt-8"></div>
            </div>
        </div>

        {/* Recent Activity Table */}
        <TableSkeleton rows={5} />
    </div>
);

/**
 * DetailSkeleton - For detailed views like Ticket Details or Profile
 */
export const DetailSkeleton = () => (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-pulse space-y-8">
        <PageHeaderSkeleton />
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="w-2/3 h-32 bg-brand-50 dark:bg-brand-900/10 rounded-[2rem] rounded-tr-none"></div>
            </div>
            <div className="flex justify-start">
                <div className="w-2/3 h-24 bg-gray-100 dark:bg-midnight-800 rounded-[2rem] rounded-tl-none"></div>
            </div>
            <div className="flex justify-end">
                <div className="w-1/2 h-16 bg-brand-50 dark:bg-brand-900/10 rounded-[2rem] rounded-tr-none"></div>
            </div>
        </div>
        <div className="h-24 w-full bg-white dark:bg-midnight-900 rounded-[2rem] border border-gray-100 dark:border-midnight-800"></div>
    </div>
);
