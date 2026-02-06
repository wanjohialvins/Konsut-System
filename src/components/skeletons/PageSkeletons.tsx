import React from 'react';
import { PageHeaderSkeleton, TableSkeleton } from './CommonSkeletons';

/**
 * PulseBlock - Generic building block for skeletons
 */
const PulseBlock = ({ className = "" }: { className?: string }) => (
    <div className={`bg-gray-200 dark:bg-midnight-800 animate-pulse rounded-xl ${className}`}></div>
);

/**
 * CardSkeleton - Generic card container
 */
const CardSkeleton = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-[2rem] p-8 ${className}`}>
        {children}
    </div>
);

// --- Sales Skeletons ---

export const CreateDocumentSkeleton = () => (
    <div className="p-6 max-w-[1600px] mx-auto animate-pulse">
        {/* Custom Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="space-y-2">
                <PulseBlock className="h-8 w-48" />
                <PulseBlock className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex gap-2">
                <PulseBlock className="h-10 w-32 rounded-xl" />
                <PulseBlock className="h-10 w-10 rounded-xl" />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Invoice Form Header - Document Details */}
                <CardSkeleton className="space-y-6">
                    <PulseBlock className="h-4 w-32 mb-2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-midnight-800 my-2"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <PulseBlock className="h-10 w-full" />
                        <PulseBlock className="h-10 w-full" />
                        <PulseBlock className="h-10 w-full" />
                    </div>
                </CardSkeleton>

                {/* Line Items */}
                <CardSkeleton>
                    <PulseBlock className="h-6 w-32 mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <PulseBlock className="h-12 w-8" />
                                <PulseBlock className="h-12 flex-1" />
                                <PulseBlock className="h-12 w-24" />
                                <PulseBlock className="h-12 w-24" />
                            </div>
                        ))}
                    </div>
                </CardSkeleton>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <CardSkeleton>
                    <PulseBlock className="h-8 w-1/2 mb-4" />
                    <div className="space-y-4">
                        <div className="flex justify-between"><PulseBlock className="h-4 w-20" /><PulseBlock className="h-4 w-20" /></div>
                        <div className="flex justify-between"><PulseBlock className="h-4 w-20" /><PulseBlock className="h-4 w-20" /></div>
                        <div className="h-px bg-gray-100 dark:bg-midnight-800 my-4"></div>
                        <div className="flex justify-between"><PulseBlock className="h-8 w-24" /><PulseBlock className="h-8 w-32" /></div>
                    </div>
                    <PulseBlock className="h-14 w-full mt-8 rounded-2xl" />
                </CardSkeleton>
            </div>
        </div>
    </div>
);

// --- System Skeletons ---

export const AdminToolboxSkeleton = () => (
    <div className="p-8 max-w-[1600px] mx-auto animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            <div className="space-y-2">
                <PulseBlock className="h-10 w-64" />
                <PulseBlock className="h-4 w-48" />
            </div>
            <PulseBlock className="h-12 w-96 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar List */}
            <CardSkeleton className="h-[600px] flex flex-col p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-midnight-800">
                    <PulseBlock className="h-10 w-full" />
                </div>
                <div className="p-4 space-y-4 flex-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4 items-center">
                            <PulseBlock className="w-10 h-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <PulseBlock className="h-3 w-3/4" />
                                <PulseBlock className="h-2 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardSkeleton>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                <CardSkeleton>
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4">
                            <PulseBlock className="w-16 h-16 rounded-full" />
                            <div className="space-y-3">
                                <PulseBlock className="h-6 w-48" />
                                <PulseBlock className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <PulseBlock className="h-24 rounded-xl" />
                        <PulseBlock className="h-24 rounded-xl" />
                    </div>
                </CardSkeleton>
                <CardSkeleton className="bg-slate-900 border-slate-800">
                    <PulseBlock className="h-6 w-48 bg-slate-800 mb-4" />
                    <PulseBlock className="h-24 w-full bg-slate-950 rounded-xl border border-slate-800" />
                </CardSkeleton>
            </div>
        </div>
    </div>
);

export const SystemVitalsSkeleton = () => (
    <div className="p-8 max-w-[1400px] mx-auto animate-pulse space-y-8">
        <div className="flex justify-between items-center">
            <PulseBlock className="h-10 w-64" />
            <PulseBlock className="h-10 w-64 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <CardSkeleton>
                <PulseBlock className="h-6 w-40 mb-6" />
                <div className="space-y-4">
                    <PulseBlock className="h-4 w-full" />
                    <PulseBlock className="h-4 w-full" />
                    <PulseBlock className="h-4 w-full" />
                </div>
            </CardSkeleton>
            <CardSkeleton>
                <PulseBlock className="h-6 w-40 mb-6" />
                <div className="space-y-4">
                    <PulseBlock className="h-12 w-full rounded-xl" />
                    <PulseBlock className="h-12 w-full rounded-xl" />
                </div>
            </CardSkeleton>
            <CardSkeleton>
                <PulseBlock className="h-6 w-40 mb-6" />
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <PulseBlock className="h-10 w-full" />
                        <PulseBlock className="h-10 w-full" />
                    </div>
                    <PulseBlock className="h-12 w-full rounded-xl" />
                </div>
            </CardSkeleton>
        </div>

        <CardSkeleton className="bg-slate-900 border-slate-800 min-h-[300px]">
            <PulseBlock className="h-6 w-32 bg-slate-800 mb-6" />
            <div className="space-y-2">
                <PulseBlock className="h-3 w-full bg-slate-800" />
                <PulseBlock className="h-3 w-3/4 bg-slate-800" />
                <PulseBlock className="h-3 w-5/6 bg-slate-800" />
            </div>
        </CardSkeleton>
    </div>
);

export const DataCoreSkeleton = () => (
    <div className="p-8 max-w-[1400px] mx-auto animate-pulse space-y-8">
        <div className="flex justify-between items-center">
            <PulseBlock className="h-10 w-48" />
            <div className="flex gap-2">
                <PulseBlock className="h-8 w-24 rounded-lg" />
                <PulseBlock className="h-8 w-24 rounded-lg" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <CardSkeleton key={i} className="hover:border-transparent">
                    <PulseBlock className="w-12 h-12 rounded-2xl mb-6" />
                    <PulseBlock className="h-6 w-32 mb-2" />
                    <PulseBlock className="h-4 w-48" />
                </CardSkeleton>
            ))}
        </div>

        <CardSkeleton>
            <PulseBlock className="h-6 w-48 mb-6" />
            <div className="space-y-6 divide-y divide-gray-100 dark:divide-midnight-800">
                {[1, 2, 3].map(i => (
                    <div key={i} className="pt-6 flex justify-between items-center">
                        <div className="space-y-2">
                            <PulseBlock className="h-5 w-48" />
                            <PulseBlock className="h-3 w-64" />
                        </div>
                        <PulseBlock className="h-10 w-24 rounded-xl" />
                    </div>
                ))}
            </div>
        </CardSkeleton>
    </div>
);

export const CommandCentreSkeleton = () => (
    <div className="p-8 max-w-[1400px] mx-auto animate-pulse space-y-8">
        <div className="flex items-center gap-4">
            <PulseBlock className="h-10 w-10 rounded-xl" />
            <PulseBlock className="h-8 w-48" />
        </div>

        <div className="max-w-2xl mx-auto">
            <CardSkeleton className="text-center space-y-8">
                <div className="flex flex-col items-center gap-4">
                    <PulseBlock className="w-20 h-20 rounded-full" />
                    <PulseBlock className="h-8 w-48" />
                    <PulseBlock className="h-4 w-64" />
                </div>

                <div className="p-6 bg-gray-50 dark:bg-midnight-950 rounded-2xl border border-gray-100 dark:border-midnight-800 space-y-6 text-left">
                    <div>
                        <PulseBlock className="h-3 w-24 mb-3" />
                        <div className="flex gap-4">
                            <PulseBlock className="h-10 flex-1 rounded-xl" />
                            <PulseBlock className="h-10 flex-1 rounded-xl" />
                            <PulseBlock className="h-10 flex-1 rounded-xl" />
                        </div>
                    </div>
                    <div>
                        <PulseBlock className="h-3 w-32 mb-3" />
                        <PulseBlock className="h-32 w-full rounded-xl" />
                    </div>
                </div>

                <PulseBlock className="h-14 w-full rounded-xl" />
            </CardSkeleton>
        </div>
    </div>
);

export const SecuritySkeleton = () => (
    <div className="p-8 max-w-[1400px] mx-auto animate-pulse space-y-8">
        <PageHeaderSkeleton />

        {/* Lock Status */}
        <div className="p-8 rounded-[2rem] bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 flex justify-between items-center">
            <div className="flex items-center gap-6">
                <PulseBlock className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                    <PulseBlock className="h-8 w-64" />
                    <PulseBlock className="h-4 w-40" />
                </div>
            </div>
            <PulseBlock className="h-14 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CardSkeleton>
                <PulseBlock className="h-6 w-32 mb-6" />
                <PulseBlock className="h-4 w-full mb-6" />
                <PulseBlock className="h-12 w-full rounded-xl" />
            </CardSkeleton>

            <CardSkeleton>
                <PulseBlock className="h-6 w-32 mb-6" />
                <PulseBlock className="h-4 w-full mb-6" />
                <PulseBlock className="h-12 w-full rounded-xl" />
            </CardSkeleton>

            <CardSkeleton className="border-red-100 bg-red-50/50">
                <PulseBlock className="h-6 w-48 mb-6 bg-red-200 dark:bg-red-900/40" />
                <PulseBlock className="h-4 w-full mb-6 bg-red-100 dark:bg-red-900/30" />
                <div className="flex gap-4">
                    <PulseBlock className="h-12 flex-1 rounded-xl bg-red-100 dark:bg-red-900/30" />
                    <PulseBlock className="h-12 w-32 rounded-xl bg-red-300 dark:bg-red-900/50" />
                </div>
            </CardSkeleton>
        </div>
    </div>
);

// --- Support Skeletons ---

export const NewTicketSkeleton = () => (
    <div className="p-8 max-w-3xl mx-auto animate-pulse space-y-8">
        <PulseBlock className="h-4 w-32" />
        <div className="space-y-2">
            <PulseBlock className="h-10 w-64" />
            <PulseBlock className="h-4 w-96" />
        </div>

        <CardSkeleton className="space-y-6">
            <div className="space-y-2">
                <PulseBlock className="h-3 w-24" />
                <PulseBlock className="h-12 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <PulseBlock className="h-3 w-24" />
                    <PulseBlock className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                    <PulseBlock className="h-3 w-24" />
                    <PulseBlock className="h-12 w-full rounded-2xl" />
                </div>
            </div>
            <div className="space-y-2">
                <PulseBlock className="h-3 w-24" />
                <PulseBlock className="h-40 w-full rounded-2xl" />
            </div>
            <PulseBlock className="h-16 w-full rounded-[1.5rem]" />
        </CardSkeleton>
    </div>
);

export const SystemManualSkeleton = () => (
    <div className="p-6 max-w-7xl mx-auto animate-pulse flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 shrink-0 space-y-4">
            <CardSkeleton className="p-4 rounded-2xl">
                <PulseBlock className="h-4 w-20 mb-4" />
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <PulseBlock key={i} className="h-8 w-full mb-2 rounded-lg" />
                ))}
            </CardSkeleton>
        </div>
        <div className="flex-1">
            <CardSkeleton className="p-8 lg:p-12">
                <div className="border-b border-gray-100 dark:border-midnight-800 pb-8 mb-12 space-y-4">
                    <PulseBlock className="h-12 w-64" />
                    <PulseBlock className="h-4 w-96" />
                </div>

                {[1, 2].map(i => (
                    <div key={i} className="mb-12 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <PulseBlock className="w-10 h-10 rounded-lg" />
                            <PulseBlock className="h-8 w-48" />
                        </div>
                        <PulseBlock className="h-4 w-full" />
                        <PulseBlock className="h-4 w-3/4" />
                        <PulseBlock className="h-4 w-5/6" />
                    </div>
                ))}
            </CardSkeleton>
        </div>
    </div>
);

export const HelpCentreSkeleton = () => (
    <div className="p-6 max-w-6xl mx-auto animate-pulse space-y-12">
        <div className="flex flex-col items-center gap-6 py-12">
            <PulseBlock className="h-12 w-64" />
            <PulseBlock className="h-16 w-full max-w-2xl rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton className="h-64 bg-indigo-600/10 border-indigo-100 flex flex-col justify-between">
                <PulseBlock className="w-16 h-16 rounded-2xl" />
                <div className="space-y-3">
                    <PulseBlock className="h-8 w-40" />
                    <PulseBlock className="h-4 w-64" />
                </div>
            </CardSkeleton>
            <CardSkeleton className="h-64 flex flex-col justify-between">
                <PulseBlock className="w-16 h-16 rounded-2xl" />
                <div className="space-y-3">
                    <PulseBlock className="h-8 w-40" />
                    <PulseBlock className="h-4 w-64" />
                </div>
            </CardSkeleton>
        </div>

        <div className="space-y-6">
            <PulseBlock className="h-8 w-64 mb-6" />
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 border border-gray-100 dark:border-midnight-800 rounded-2xl">
                    <div className="flex justify-between">
                        <PulseBlock className="h-4 w-3/4" />
                        <PulseBlock className="h-4 w-4" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Settings Skeletons ---

export const UserProfileSkeleton = () => (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
        <div className="flex justify-between items-center mb-12">
            <div className="space-y-3">
                <PulseBlock className="h-10 w-64" />
                <PulseBlock className="h-4 w-96" />
            </div>
            <div className="flex gap-4 p-3 border border-gray-100 dark:border-midnight-800 rounded-2xl">
                <PulseBlock className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                    <PulseBlock className="h-3 w-24" />
                    <PulseBlock className="h-2 w-20" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <CardSkeleton className="space-y-8">
                    <PulseBlock className="h-6 w-32 border-b pb-4 mb-4" />
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-3">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-2xl" />
                        </div>
                        <div className="col-span-2 space-y-3">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-2xl" />
                        </div>
                    </div>
                </CardSkeleton>

                <CardSkeleton className="space-y-8">
                    <PulseBlock className="h-6 w-40 border-b pb-4 mb-4" />
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-3">
                            <PulseBlock className="h-3 w-20" />
                            <PulseBlock className="h-12 w-full rounded-2xl" />
                        </div>
                    </div>
                </CardSkeleton>
            </div>

            <div className="space-y-8">
                <CardSkeleton className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-100 space-y-6">
                    <PulseBlock className="h-4 w-32" />
                    <div className="space-y-4">
                        <PulseBlock className="h-3 w-20" />
                        <PulseBlock className="h-8 w-32" />
                        <PulseBlock className="h-3 w-20 mt-4" />
                        <PulseBlock className="h-8 w-40" />
                    </div>
                </CardSkeleton>

                <PulseBlock className="h-20 w-full rounded-3xl" />
            </div>
        </div>
    </div>
);

export const InterfaceSkeleton = () => (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
        <PageHeaderSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Theme */}
            <CardSkeleton className="space-y-6">
                <PulseBlock className="h-4 w-32 pb-3 border-b mb-2" />
                <div className="grid grid-cols-2 gap-4">
                    <PulseBlock className="h-32 w-full rounded-2xl" />
                    <PulseBlock className="h-32 w-full rounded-2xl" />
                </div>
            </CardSkeleton>

            {/* Density */}
            <CardSkeleton className="lg:col-span-2 space-y-6">
                <PulseBlock className="h-4 w-48 pb-3 border-b mb-2" />
                <div className="grid grid-cols-2 gap-6">
                    <PulseBlock className="h-32 w-full rounded-[2rem]" />
                    <PulseBlock className="h-32 w-full rounded-[2rem]" />
                </div>
            </CardSkeleton>

            {/* Colors */}
            <CardSkeleton className="md:col-span-2 lg:col-span-3 space-y-6">
                <PulseBlock className="h-4 w-40 pb-3 border-b mb-2" />
                <div className="flex gap-6 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="space-y-3 flex flex-col items-center">
                            <PulseBlock className="w-16 h-16 rounded-2xl" />
                            <PulseBlock className="h-2 w-12" />
                        </div>
                    ))}
                </div>
            </CardSkeleton>
        </div>
    </div>
);
