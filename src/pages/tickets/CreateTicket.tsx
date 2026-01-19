import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiTag, FiFlag, FiLayers } from 'react-icons/fi';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const CreateTicket = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) return showToast('error', 'Please fill in all required fields');

        setLoading(true);
        try {
            const res = await api.tickets.create(formData);
            if (res.success) {
                showToast('success', 'Support ticket created successfully');
                navigate(`/tickets/${res.id}`);
            }
        } catch (e: any) {
            showToast('error', e.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
            <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-600 font-bold uppercase text-[10px] tracking-widest transition-colors mb-4"
            >
                <FiArrowLeft /> Back to Tickets
            </button>

            <header>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Support Request</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Describe your issue and our team will assist you shortly.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <FiTag /> Subject
                    </label>
                    <input
                        type="text"
                        placeholder="What's the issue about?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium text-slate-900 dark:text-white"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <FiLayers /> Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold uppercase text-[11px] tracking-widest text-slate-700 dark:text-slate-300"
                        >
                            <option value="general">General Support</option>
                            <option value="billing">Billing & Tenders</option>
                            <option value="inventory">Inventory Issues</option>
                            <option value="account">Account & Security</option>
                            <option value="bug">Report a Bug</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <FiFlag /> Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold uppercase text-[11px] tracking-widest text-slate-700 dark:text-slate-300"
                        >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message</label>
                    <textarea
                        rows={6}
                        placeholder="Provide as much detail as possible..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium text-slate-900 dark:text-white resize-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-brand-600/20 transition-all flex items-center justify-center gap-3"
                >
                    {loading ? 'Creating...' : <><FiSend /> Submit Request</>}
                </button>
            </form>
        </div>
    );
};

export default CreateTicket;
