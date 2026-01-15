import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFileText, FiUsers, FiX, FiArrowRight } from 'react-icons/fi';
import { api } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import type { Invoice, Customer, Product } from "../types/types";

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{
        invoices: Invoice[];
        clients: Customer[];
        stock: Product[];
    }>({ invoices: [], clients: [], stock: [] });
    const { hasRole } = usePermissions();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Only Admins and CEOs can use Global Search
    const isAuthorized = hasRole(['admin', 'ceo']);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                if (isAuthorized) setIsOpen(true);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthorized]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (query.length < 2) {
            setResults({ invoices: [], clients: [], stock: [] });
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                // In a real app, we'd have a dedicated /search endpoint
                // For now, we simulate by filtering local or fetching all
                const [inv, cli, sto] = await Promise.all([
                    api.invoices.getAll(),
                    api.clients.getAll(),
                    api.stock.getAll()
                ]);

                setResults({
                    invoices: inv.filter((i: Invoice) => i.id.toLowerCase().includes(query.toLowerCase()) || i.customer?.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 3),
                    clients: cli.filter((c: Customer) => c.name.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase())).slice(0, 3),
                    stock: sto.filter((s: Product) => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
                });
            } catch (err) {
                console.error(err);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    if (!isOpen || !isAuthorized) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>

            <div className="relative w-full max-w-3xl bg-white dark:bg-midnight-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-midnight-800 flex items-center gap-4">
                    <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg ring-4 ring-brand-500/20">
                        <FiSearch size={24} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search invoices, clients, products across the entire enterprise..."
                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-xl font-bold placeholder-gray-400"
                    />
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-xl transition-colors">
                        <FiX size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Invoices */}
                    <div>
                        <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FiFileText /> Recent Orders
                        </h3>
                        <div className="space-y-2">
                            {results.invoices.map((inv) => (
                                <button key={inv.id} onClick={() => { navigate(`/invoices`); setIsOpen(false); }} className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-midnight-850 flex items-center justify-between group transition-all">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{inv.id}</p>
                                        <p className="text-xs text-gray-500">{inv.customer?.name}</p>
                                    </div>
                                    <FiArrowRight className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clients */}
                    <div>
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FiUsers /> Client Base
                        </h3>
                        <div className="space-y-2">
                            {results.clients.map((cli) => (
                                <button key={cli.id} onClick={() => { navigate(`/clients`); setIsOpen(false); }} className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-midnight-850 flex items-center justify-between group transition-all">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{cli.name}</p>
                                        <p className="text-xs text-gray-500">{cli.id}</p>
                                    </div>
                                    <FiArrowRight className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-midnight-950 border-t border-gray-100 dark:border-midnight-800 flex justify-center items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Press <span className="text-brand-600">Enter</span> for Advanced Search Hub
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
