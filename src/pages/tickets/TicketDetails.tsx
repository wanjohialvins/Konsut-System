import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiClock, FiCheckCircle, FiMoreVertical, FiPaperclip } from 'react-icons/fi';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchTicket = async () => {
        try {
            const data = await api.tickets.getById(id!);
            setTicket(data);
        } catch (e: any) {
            showToast('error', 'Failed to load ticket details');
            navigate('/tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    useEffect(scrollToBottom, [ticket?.messages]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        try {
            await api.tickets.addMessage({
                ticket_id: id!,
                message: reply,
                is_internal: false // For now, simple reply
            });
            setReply("");
            fetchTicket();
        } catch (e: any) {
            showToast('error', 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const toggleStatus = async () => {
        const newStatus = ticket.status === 'closed' ? 'open' : 'closed';
        try {
            await api.tickets.updateStatus(id!, newStatus);
            showToast('success', `Ticket marked as ${newStatus}`);
            fetchTicket();
        } catch (e) {
            showToast('error', 'Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] animate-pulse">
            <div className="p-12 bg-slate-100 dark:bg-slate-900 rounded-[3rem] w-full max-w-2xl" />
        </div>
    );

    const isAdmin = user?.role === 'admin' || user?.role === 'ceo';

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-100px)] animate-fade-in relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/tickets')}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-brand-600 shadow-sm transition-all"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticket.id}</span>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ticket.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {ticket.status}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{ticket.subject}</h1>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={toggleStatus}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${ticket.status === 'closed'
                                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                : 'bg-red-600 text-white shadow-red-600/20'
                            }`}
                    >
                        {ticket.status === 'closed' ? <><FiCheckCircle /> Reopen Ticket</> : <><FiCheckCircle /> Mark as Closed</>}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar mb-6">
                {ticket.messages.map((msg: any) => {
                    const isOwnMessage = msg.user_id == user?.id;
                    const isSupport = msg.author_role === 'admin' || msg.author_role === 'ceo';

                    return (
                        <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`flex items-center gap-3 px-2 ${isOwnMessage ? 'justify-end flex-row-reverse' : ''}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{msg.author_name}</span>
                                    <span className="text-[10px] text-slate-300 dark:text-slate-600">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-6 rounded-[2rem] shadow-sm relative ${isOwnMessage
                                        ? 'bg-brand-600 text-white rounded-tr-none'
                                        : isSupport
                                            ? 'bg-slate-900 text-white rounded-tl-none border border-brand-500/30'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative z-20 shrink-0">
                <form onSubmit={handleReply} className="flex gap-4">
                    <button type="button" className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-400 rounded-2xl hover:text-brand-600 transition-colors">
                        <FiPaperclip size={20} />
                    </button>
                    <textarea
                        rows={1}
                        placeholder={ticket.status === 'closed' ? "This ticket is closed" : "Write a response..."}
                        disabled={ticket.status === 'closed' || sending}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all resize-none text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={ticket.status === 'closed' || !reply.trim() || sending}
                        className="p-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-30 text-white rounded-2xl shadow-xl shadow-brand-600/20 transition-all active:scale-95"
                    >
                        <FiSend size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TicketDetails;
