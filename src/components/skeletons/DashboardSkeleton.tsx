import React from 'react';

const CardSkeleton = () => (
    <div className="bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="space-y-3 w-full">
                <div className="h-3 w-20 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
                <div className="h-8 w-32 bg-gray-300 dark:bg-midnight-800 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-midnight-800 rounded-xl"></div>
        </div>
    </div>
);

const ChartSkeleton = () => (
    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800 animate-pulse h-[400px]">
        <div className="h-4 w-40 bg-gray-200 dark:bg-midnight-800 rounded mb-8"></div>
        <div className="h-64 w-full bg-gray-100 dark:bg-midnight-800/30 rounded-xl"></div>
    </div>
);

const ListSkeleton = () => (
    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-midnight-800 animate-pulse h-[400px]">
        <div className="h-4 w-40 bg-gray-200 dark:bg-midnight-800 rounded mb-6"></div>
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-midnight-800"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
                        <div className="h-2 w-1/2 bg-gray-100 dark:bg-midnight-800/30 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="p-6 min-h-screen pb-24 max-w-[1600px] mx-auto space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end animate-pulse">
                <div className="space-y-3">
                    <div className="h-10 w-64 bg-gray-300 dark:bg-midnight-800 rounded-xl"></div>
                    <div className="h-4 w-48 bg-gray-200 dark:bg-midnight-800/50 rounded"></div>
                </div>
                <div className="h-8 w-32 bg-gray-200 dark:bg-midnight-800/50 rounded hidden md:block"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <ChartSkeleton />
                </div>
                <div className="space-y-8">
                    <div className="h-[200px] bg-white dark:bg-midnight-900 rounded-3xl p-6 border border-gray-100 dark:border-midnight-800 animate-pulse">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-midnight-800 rounded mb-4"></div>
                        <div className="space-y-4">
                            <div className="h-12 w-full bg-rose-50 dark:bg-rose-900/10 rounded-2xl"></div>
                            <div className="h-12 w-full bg-amber-50 dark:bg-amber-900/10 rounded-2xl"></div>
                        </div>
                    </div>
                    <ListSkeleton />
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
