import React from 'react';
import { FiSearch, FiFilter, FiDownload, FiColumns, FiGrid, FiList, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { SmartInput } from './SmartGuide';

interface SortOption {
    key: string;
    label: string;
}

interface FilterOption {
    value: string;
    label: string;
}

interface SmartTableToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    searchPlaceholder?: string;
    searchContext?: string;

    sortOptions?: SortOption[];
    activeSort?: { key: string; direction: 'asc' | 'desc' };
    onSortChange?: (key: string, direction: 'asc' | 'desc') => void;

    filterOptions?: FilterOption[];
    activeFilter?: string;
    onFilterChange?: (val: string) => void;

    onExport?: () => void;

    actions?: React.ReactNode; // Extra buttons like "New Item"
    ghostOffset?: string;
    className?: string;
}

export const SmartTableToolbar: React.FC<SmartTableToolbarProps> = ({
    search,
    onSearchChange,
    searchPlaceholder = "Search...",
    searchContext = "search_general",
    sortOptions = [],
    activeSort,
    onSortChange,
    filterOptions = [],
    activeFilter,
    onFilterChange,
    onExport,
    actions,
    ghostOffset,
    className = ""
}) => {
    return (
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-center mb-6 animate-fade-in ${className}`}>
            {/* Search Area */}
            <div className="relative w-full md:w-96 group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors z-10" />
                <SmartInput
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-brand-500 bg-white dark:bg-midnight-900 border-gray-100 dark:border-midnight-800"
                    context={searchContext}
                    ghostOffset={ghostOffset || "3rem"}
                />
            </div>

            {/* Tools Area */}
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                {/* Sort */}
                {sortOptions.length > 0 && onSortChange && (
                    <div className="relative group">
                        <select
                            className="appearance-none pl-10 pr-8 py-3 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm hover:border-gray-200 dark:hover:border-midnight-700 transition-all"
                            value={activeSort?.key}
                            onChange={(e) => onSortChange(e.target.value, activeSort?.direction || 'desc')}
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            {activeSort?.direction === 'asc' ? <FiTrendingUp /> : <FiTrendingDown />}
                        </div>
                        {/* Direction Toggle */}
                        <button
                            onClick={() => onSortChange(activeSort?.key || sortOptions[0].key, activeSort?.direction === 'asc' ? 'desc' : 'asc')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-midnight-800 text-gray-400 hover:text-brand-600 transition-colors"
                            title={activeSort?.direction === 'asc' ? "Ascending" : "Descending"}
                        >
                            <FiFilter className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Filter */}
                {filterOptions.length > 0 && onFilterChange && (
                    <div className="relative">
                        <select
                            className="appearance-none pl-10 pr-8 py-3 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm hover:border-gray-200 dark:hover:border-midnight-700 transition-all"
                            value={activeFilter}
                            onChange={(e) => onFilterChange(e.target.value)}
                        >
                            {filterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                )}

                {/* Export */}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="p-3 bg-white dark:bg-midnight-900 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-midnight-800 shadow-sm hover:text-brand-600 hover:border-brand-200 transition-all"
                        title="Export CSV"
                    >
                        <FiDownload />
                    </button>
                )}

                {/* Extra Actions */}
                {actions}
            </div>
        </div>
    );
};
