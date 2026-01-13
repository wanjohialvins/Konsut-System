import React, { useState, useEffect, useCallback } from 'react';
import { FiFolder, FiFile, FiUpload, FiDownload, FiTrash2, FiSearch } from 'react-icons/fi';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface VaultDoc {
    id: string;
    name: string;
    type: string;
    size: string;
    upload_date: string;
    path: string;
}

const Documents = () => {
    const { showToast } = useToast();
    const [docs, setDocs] = useState<VaultDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const loadDocs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.vault.getAll();
            setDocs(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    const handleUpload = async () => {
        // Simulation of file upload logic
        const dummyName = prompt("Enter document name (Simulation):");
        if (!dummyName) return;

        try {
            await api.vault.add({
                id: `DOC - ${Date.now()} `,
                name: dummyName,
                type: 'PDF',
                size: '1.2 MB',
                upload_date: new Date().toISOString().split('T')[0],
                path: '/uploads/simulated.pdf'
            });
            showToast('success', 'Document uploaded (Metadata only)');
            loadDocs();
        } catch (e) {
            showToast('error', 'Upload failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this document?")) return;
        try {
            await api.vault.delete(id);
            showToast('success', 'Document deleted');
            loadDocs();
        } catch (e) {
            showToast('error', 'Delete failed');
        }
    };

    const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                            <FiFolder size={28} />
                        </div>
                        Company Doc Vault
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Centralized repository for licenses, contracts, and digital assets</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleUpload} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-all active:scale-95">
                        <FiUpload /> Upload File
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-midnight-800 flex items-center gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search the vault..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading documents...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-midnight-950 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Document Name</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">Modified</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-midnight-800">
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-midnight-800/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-lg">
                                                    <FiFile size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{doc.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest">{doc.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-500 font-medium">{doc.size}</td>
                                        <td className="px-6 py-5 text-sm text-gray-500 font-medium">{doc.upload_date}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="Download"><FiDownload /></button>
                                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete"><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Documents;
