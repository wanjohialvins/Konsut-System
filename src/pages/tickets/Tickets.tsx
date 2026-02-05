import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMessageSquare, FiClock, FiCheckCircle, FiAlertCircle, FiSearch, FiFilter } from 'react-icons/fi';
import { SmartTableToolbar } from "../../components/ui/SmartTableToolbar";
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const Tickets = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();

    const fetchTickets = async () => {
        try {
            const data = await api.tickets.getAll();
            setTickets(Array.isArray(data) ? data : []);
        } catch (e: any) {
            showToast('error', 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || t.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-emerald-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-brand-600 text-white rounded-[2rem] shadow-xl shadow-brand-600/20">
                            <FiMessageSquare size={32} />
                        </div>
                        Support Tickets
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage and track your support requests</p>
                </div>
            </header>

            <SmartTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search tickets by subject or ID..."
                filterOptions={[
                    { value: 'all', label: 'All Status' },
                    { value: 'open', label: 'Open' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'closed', label: 'Closed' }
                ]}
                activeFilter={filter}
                onFilterChange={setFilter}
                actions={
                    <button
                        onClick={() => navigate('/tickets/new')}
                        className="flex items-center gap-3 bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-brand-600/20"
                    >
                        <FiPlus /> New Ticket
                    </button>
                }
            />

            <div className="grid gap-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse" />
                    ))
                ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex gap-6 items-center">
                                <div className={`p-4 rounded-2xl ${getStatusColor(ticket.status)} transition-colors`}>
                                    {ticket.status === 'open' ? <FiMessageSquare size={24} /> :
                                        ticket.status === 'closed' ? <FiCheckCircle size={24} /> : <FiClock size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticket.id}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>• {ticket.priority} Priority</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{ticket.subject}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Created on {new Date(ticket.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <div className="text-slate-300 dark:text-slate-700">
                                    <FiPlus className="rotate-45" size={20} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-6">
                            <FiAlertCircle size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Tickets Found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your filters or create a new request.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tickets;
