import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { api } from '../services/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError('Passwords do not match');
        if (password.length < 6) return setError('Password must be at least 6 characters');

        setLoading(true);
        try {
            // Need to implement a password update API
            await api.users.update({ id: user?.id, password, force_password_change: 0 });
            navigate('/', { replace: true });
        } catch (err) {
            setError('Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 font-sans">
            <div className="w-full max-w-md p-8 bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-red-600/20 text-red-500 mb-4">
                        <FiLock size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter">SECURE RESET REQUIRED</h1>
                    <p className="text-gray-400 text-sm mt-2">Administrative policy requires you to change your password before continuing.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-3">
                        <FiXCircle /> {error}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account Username</label>
                        <input
                            type="text"
                            value={user?.username || ''}
                            readOnly
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 outline-none font-mono cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-red-500 transition-all font-mono"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-red-500 transition-all font-mono"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Updating Security...' : 'Update Password & Enter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
