import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiPlus, FiStar, FiClock } from 'react-icons/fi';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Memo {
    id: string;
    title: string;
    content: string;
    date: string;
    urgent: boolean;
    author: string;
}

const Memos = () => {
    const { showToast } = useToast();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Add Modal
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Memo>>({
        title: '', content: '', urgent: false, author: 'Admin'
    });

    const loadMemos = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.memos.getAll();
            setMemos(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', 'Failed to load memos');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadMemos();
    }, [loadMemos]);

    const filteredMemos = memos.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.memos.create({
                ...newItem,
                id: `MEMO-${Date.now()}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            });
            showToast('success', 'Memo posted');
            setIsAddOpen(false);
            setNewItem({ title: '', content: '', urgent: false, author: 'Admin' });
            loadMemos();
        } catch (e) {
            showToast('error', 'Failed to post memo');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-600/20">
                            <FiMessageSquare size={28} />
                        </div>
                        Internal Communications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Broadcast announcements and internal notices to all staff</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <input
                            placeholder="Search memos..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-2xl border-none bg-white dark:bg-midnight-900 shadow-sm focus:ring-2 focus:ring-amber-500 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all active:scale-95"
                    >
                        <FiPlus /> Post Memo
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center text-gray-400 py-10">Loading communications...</div>
                ) : (
                    filteredMemos.map(memo => (
                        <div key={memo.id} className={`bg-white dark:bg-midnight-900 p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${memo.urgent ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-midnight-800'}`}>
                            {memo.urgent && (
                                <div className="absolute top-0 right-10 px-4 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg">Urgent</div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 transition-colors">{memo.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        <span>{memo.author}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><FiClock size={12} /> {memo.date}</span>
                                    </div>
                                </div>
                                <button className="text-gray-300 hover:text-amber-500 transition-colors"><FiStar size={20} /></button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                        </div>
                    ))
                )}
                {memos.length === 0 && !loading && (
                    <div className="text-center text-gray-400 py-10">No messages posted.</div>
                )}
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black mb-6 dark:text-white">Post Memo</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input
                                placeholder="Title"
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none font-bold"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Content..."
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none h-32"
                                value={newItem.content}
                                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                required
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="urgent"
                                    checked={newItem.urgent}
                                    onChange={e => setNewItem({ ...newItem, urgent: e.target.checked })}
                                />
                                <label htmlFor="urgent" className="text-sm font-bold text-gray-600 dark:text-gray-300">Mark as Urgent</label>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700">Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Memos;
