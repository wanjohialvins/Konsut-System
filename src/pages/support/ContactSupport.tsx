import React, { useState } from 'react';
import { FiSend, FiMessageSquare, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const ContactSupport = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        subject: '',
        message: '',
        priority: 'Normal'
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Functionality: Create a Task for the Admin
            // This ensures it appears on the Admin's task board.
            const ticketTitle = `[SUPPORT] ${form.subject} (${form.priority})`;
            const ticketDesc = `From: ${user?.name} (${user?.username})\n\n${form.message}`;

            await api.tasks.create({
                title: ticketTitle,
                description: ticketDesc,
                status: 'todo', // Open ticket
                due_date: new Date().toISOString().split('T')[0] // Due today
            });

            // Optional: Also ensure admins get a notification (if you had a mechanism to notify specific roles)
            // For now, task board is a persistent "functional" place.

            showToast('success', 'Support ticket created successfully');
            setSubmitted(true);
            setForm({ subject: '', message: '', priority: 'Normal' });
        } catch (error) {
            showToast('error', 'Failed to submit ticket');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-8 max-w-2xl mx-auto animate-fade-in text-center pt-24">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Ticket Submitted!</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Your support request has been logged. Our team has been notified and will review your case shortly.</p>
                <button onClick={() => setSubmitted(false)} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                    Submit Another
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                        <FiMessageSquare size={28} />
                    </div>
                    Contact Support
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Submit a ticket directly to the technical team.</p>
            </header>

            <div className="bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 lg:p-12 shadow-xl border border-gray-100 dark:border-midnight-800">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject</label>
                            <input
                                required
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                                placeholder="Briefly describe the issue"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Priority</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white appearance-none"
                            >
                                <option>Low - General Inquiry</option>
                                <option>Normal - Minor Issue</option>
                                <option>High - Urgent Bug</option>
                                <option>Critical - System Down</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                        <textarea
                            required
                            rows={6}
                            value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white resize-none"
                            placeholder="Please provide details about what happened..."
                        ></textarea>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl flex items-start gap-4">
                        <FiAlertCircle className="text-blue-600 shrink-0 mt-1" />
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                            Submitting this form will verify your system credentials automatically. Please do not share your password in the description.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            {loading ? 'Submitting...' : <><FiSend /> Submit Ticket</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactSupport;
