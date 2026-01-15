import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiSearch, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2, FiEdit2, FiCalendar, FiCheckSquare, FiUser } from 'react-icons/fi';
import { useModal } from "../contexts/ModalContext";
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Task {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'progress' | 'completed';
    due_date: string;
    assignee: string;
}

const Tasks = () => {
    const { showConfirm } = useModal();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Add Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Task>>({
        title: '', priority: 'medium', status: 'pending', due_date: '', assignee: ''
    });

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.tasks.getAll();
            setTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('Delete task?');
        if (!confirmed) return;
        try {
            await api.tasks.delete(id);
            loadTasks();
            showToast('success', 'Task deleted');
        } catch (e) {
            showToast('error', 'Failed to delete task');
        }
    };

    const handleStatusChange = async (task: Task) => {
        // Cycle status
        const nextStatus = task.status === 'pending' ? 'progress' : task.status === 'progress' ? 'completed' : 'pending';
        try {
            await api.tasks.update({ id: task.id, status: nextStatus });
            loadTasks();
        } catch (e) {
            showToast('error', 'Update failed');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.tasks.create({
                ...newItem,
                id: `TASK-${Date.now()}`
            });
            showToast('success', 'Task created');
            setIsAddOpen(false);
            setNewItem({ title: '', priority: 'medium', status: 'pending', due_date: '', assignee: '' });
            loadTasks();
        } catch (e) {
            showToast('error', 'Failed to create task');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
            default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-600/20">
                            <FiCheckSquare size={28} />
                        </div>
                        Team Task Board
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Coordinate operations and manage team responsibilities</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-2xl border-none bg-white dark:bg-midnight-900 shadow-sm focus:ring-2 focus:ring-brand-500 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-900/30 transition-all active:scale-95"
                    >
                        <FiPlus /> New Task
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['pending', 'progress', 'completed'].map(status => (
                    <div key={status} className="bg-gray-50 dark:bg-midnight-950 p-4 rounded-3xl border border-gray-200 dark:border-midnight-800 h-fit">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">{status.replace('progress', 'In Progress')}</h3>
                        <div className="space-y-4">
                            {filteredTasks.filter(t => t.status === status).map(task => (
                                <div key={task.id} className="bg-white dark:bg-midnight-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-midnight-800 hover:shadow-md transition-all group relative cursor-pointer" onClick={() => handleStatusChange(task)}>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <FiTrash2 />
                                    </button>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 transition-colors pr-6">{task.title}</h4>
                                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                        <span className={`px-2 py-1 rounded-lg ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-midnight-800 text-gray-500 rounded-lg flex items-center gap-1">
                                            <FiClock size={10} /> {task.due_date}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-midnight-800 text-gray-500 rounded-lg flex items-center gap-1">
                                            <FiUser size={10} /> {task.assignee}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(t => t.status === status).length === 0 && (
                                <div className="text-center text-gray-300 text-xs py-10 font-bold uppercase tracking-widest">No Tasks</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black mb-6 dark:text-white">Create Task</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input
                                placeholder="Task Title"
                                className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none font-bold"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.priority}
                                    onChange={e => setNewItem({ ...newItem, priority: e.target.value as any })}
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                                <select
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.status}
                                    onChange={e => setNewItem({ ...newItem, status: e.target.value as any })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.due_date}
                                    onChange={e => setNewItem({ ...newItem, due_date: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Assignee"
                                    className="w-full bg-gray-50 dark:bg-midnight-950 p-3 rounded-xl border-none"
                                    value={newItem.assignee}
                                    onChange={e => setNewItem({ ...newItem, assignee: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
