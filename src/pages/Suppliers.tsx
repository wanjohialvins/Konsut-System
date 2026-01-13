import React, { useState, useEffect, useCallback } from 'react';
import { FiTruck, FiPlus, FiPhone, FiMail, FiTrash2 } from 'react-icons/fi';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Supplier {
    id: string;
    name: string;
    category: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    status: 'Active' | 'Inactive';
}

const Suppliers = () => {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Add Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Supplier>>({
        name: '', category: 'General', contact_person: '', phone: '', email: '', status: 'Active'
    });

    const loadSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.suppliers.getAll();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', 'Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this supplier?')) return;
        try {
            await api.suppliers.delete(id);
            showToast('success', 'Supplier removed');
            loadSuppliers();
        } catch (e) {
            showToast('error', 'Failed to remove supplier');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.suppliers.create({
                ...newItem,
                id: `SUP-${Date.now()}` // Generate ID
            });
            showToast('success', 'Supplier added');
            setIsAddOpen(false);
            setNewItem({ name: '', category: 'General', contact_person: '', phone: '', email: '', status: 'Active' });
            loadSuppliers();
        } catch (e) {
            showToast('error', 'Failed to add supplier');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20">
                            <FiTruck size={28} />
                        </div>
                        Vendor & Suppliers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage supply chain partners and procurement channels</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <input
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-2xl border-none bg-white dark:bg-midnight-900 shadow-sm focus:ring-2 focus:ring-emerald-500 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                    >
                        <FiPlus /> New Supplier
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="py-20 text-center text-gray-400">Loading suppliers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(sup => (
                        <div key={sup.id} className="bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-gray-100 dark:border-midnight-800 shadow-sm hover:shadow-xl transition-all group relative">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <FiTruck size={24} />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sup.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {sup.status}
                                    </span>
                                    <button onClick={() => handleDelete(sup.id)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{sup.name}</h3>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-6">{sup.category}</p>
                            <p className="text-sm text-gray-500 mb-2 font-medium">Contact: {sup.contact_person || 'N/A'}</p>

                            <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-midnight-800">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <FiPhone className="text-gray-400" /> {sup.phone || '-'}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <FiMail className="text-gray-400" /> {sup.email || '-'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {suppliers.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-400">No suppliers found. Add one to get started.</div>
                    )}
                </div>
            )}

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black mb-6 dark:text-white">Add Supplier</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input
                                placeholder="Company Name"
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none font-bold"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Category (e.g. Shipping)"
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                value={newItem.category}
                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                            />
                            <input
                                placeholder="Contact Person"
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                value={newItem.contact_person}
                                onChange={e => setNewItem({ ...newItem, contact_person: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Phone"
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.phone}
                                    onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
                                />
                                <input
                                    placeholder="Email"
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.email}
                                    onChange={e => setNewItem({ ...newItem, email: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
