
import React from 'react';
import { FaSearch, FaTimes, FaPlus } from 'react-icons/fa';
import { FiBox, FiTruck, FiTool } from 'react-icons/fi';
import type { Category } from '../../types/types';

interface InventorySelectorProps {
    activeCategory: Category;
    setActiveCategory: (cat: Category) => void;
    isSearchMode: boolean;
    setIsSearchMode: (val: boolean) => void;
    itemSearch: string;
    setItemSearch: (val: string) => void;
    selectedId: Record<Category, string>;
    setSelectedId: React.Dispatch<React.SetStateAction<Record<Category, string>>>;
    selectedQty: Record<Category, number>;
    setSelectedQty: React.Dispatch<React.SetStateAction<Record<Category, number>>>;
    getFilteredForCategory: (cat: Category) => any[];
    filteredStock: any[];
    handleSearchSelect: (item: any) => void;
    handleCreateCustomItem: (name: string) => void;
    handleAddSelected: (cat: Category) => void;
}

const InventorySelector: React.FC<InventorySelectorProps> = ({
    activeCategory,
    setActiveCategory,
    isSearchMode,
    setIsSearchMode,
    itemSearch,
    setItemSearch,
    selectedId,
    setSelectedId,
    selectedQty,
    setSelectedQty,
    getFilteredForCategory,
    filteredStock,
    handleSearchSelect,
    handleCreateCustomItem,
    handleAddSelected,
}) => {
    return (
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400"><FiBox /></div>
                Add Items
            </h2>

            {/* Category Tabs */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'products', label: 'Products', icon: FiBox, color: 'brand' },
                    { id: 'mobilization', label: 'Mobilization', icon: FiTruck, color: 'purple' },
                    { id: 'services', label: 'Services', icon: FiTool, color: 'orange' }
                ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as Category)}
                            className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${activeCategory === cat.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg transform scale-105'
                                : 'bg-gray-50 dark:bg-midnight-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-midnight-700'
                                }`}
                        >
                            <Icon /> {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Selection Row */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-midnight-950 p-6 rounded-2xl border border-gray-100 dark:border-midnight-800">
                <div className="flex-1 w-full relative">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isSearchMode ? "Search Database" : "Select Item"}</label>
                        <button
                            onClick={() => { setIsSearchMode(!isSearchMode); setItemSearch(""); }}
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${isSearchMode ? 'text-rose-500 hover:text-rose-600' : 'text-brand-600 hover:text-brand-700'}`}
                        >
                            {isSearchMode ? <><FaTimes /> Cancel</> : <><FaSearch /> Search All</>}
                        </button>
                    </div>

                    {!isSearchMode ? (
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white dark:bg-midnight-900 border-none p-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-800 dark:text-white shadow-sm transition-all cursor-pointer"
                                value={selectedId[activeCategory]}
                                onChange={(e) => setSelectedId((s) => ({ ...s, [activeCategory]: e.target.value }))}
                            >
                                <option value="">-- Choose {activeCategory} --</option>
                                {getFilteredForCategory(activeCategory).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.priceKsh ? `Ksh ${p.priceKsh}` : `USD ${p.priceUSD}`})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                autoFocus
                                className="w-full bg-white dark:bg-midnight-900 border-2 border-brand-500 p-4 rounded-xl outline-none shadow-lg font-bold text-gray-800 dark:text-white"
                                placeholder="Type name or description..."
                                value={itemSearch}
                                onChange={e => setItemSearch(e.target.value)}
                            />
                            {/* Results Dropdown */}
                            {itemSearch && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto w-full animate-fade-in custom-scrollbar">
                                    {filteredStock.length === 0 ? (
                                        <button
                                            onClick={() => handleCreateCustomItem(itemSearch)}
                                            className="w-full p-4 text-left text-sm font-bold text-brand-600 hover:bg-brand-50 flex items-center gap-2 group"
                                        >
                                            <div className="p-2 bg-brand-100 rounded-lg group-hover:bg-brand-200"><FaPlus /></div>
                                            <div>
                                                <div>Create "{itemSearch}"</div>
                                                <div className="text-xs text-gray-500 font-normal">Add as new custom item</div>
                                            </div>
                                        </button>
                                    ) : (
                                        filteredStock.map(item => (
                                            <button
                                                key={`${item.type}-${item.id}`}
                                                onClick={() => handleSearchSelect(item)}
                                                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-midnight-800 border-b border-gray-50 dark:border-midnight-800 last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                                        {item.name}
                                                        <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${item.type === 'products' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                            item.type === 'services' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                                                'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] mt-0.5">{item.description}</div>
                                                </div>
                                                <div className="text-xs font-black text-gray-600 dark:text-gray-300 whitespace-nowrap ml-2 bg-gray-100 dark:bg-midnight-950 px-2 py-1 rounded-lg">
                                                    {item.priceKsh ? `Ksh ${item.priceKsh.toLocaleString()}` : `USD ${item.priceUSD?.toLocaleString()}`}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-24">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Qty</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full bg-white dark:bg-midnight-900 border-none p-4 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-brand-500 dark:text-white shadow-sm"
                        value={selectedQty[activeCategory]}
                        onChange={(e) => setSelectedQty((q) => ({ ...q, [activeCategory]: Number(e.target.value) }))}
                    />
                </div>

                <button
                    onClick={() => handleAddSelected(activeCategory)}
                    title="Add Selected Item"
                    className="w-full md:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                >
                    <FaPlus /> Add
                </button>
            </div>
        </div>
    );
};

export default InventorySelector;
