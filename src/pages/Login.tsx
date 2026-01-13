import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaLock, FaSignInAlt, FaExclamationCircle } from 'react-icons/fa';
import logo from '../assets/logo.jpg';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, recoveryLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Recovery State
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryPhrase, setRecoveryPhrase] = useState('');
    const [recoveryError, setRecoveryError] = useState('');

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                if (result.forceReset) {
                    navigate('/reset-password', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                setError(result.message || 'Invalid username or password');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setRecoveryError('');
        setLoading(true);

        try {
            const result = await recoveryLogin(recoveryPhrase);
            if (result.success) {
                setShowRecovery(false);
                navigate('/reset-password', { replace: true });
            } else {
                setRecoveryError('Invalid recovery phrase');
            }
        } catch (err) {
            setRecoveryError('Recovery failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black font-sans bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-white/30 dark:bg-black/60 backdrop-blur-md"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-white/10">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-white dark:bg-midnight-800 shadow-lg mb-4">
                        <img src={logo} alt="Konsut Logo" className="h-12 w-12 object-contain rounded-full" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/50"} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to access your dashboard</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
                        <FaExclamationCircle /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <FaUser />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-midnight-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <FaLock />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-midnight-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => setShowRecovery(true)}
                                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <FaSignInAlt />}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Konsut Ltd. All rights reserved.
                </div>
            </div>

            {/* Recovery Modal */}
            {showRecovery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Account Recovery</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your recovery phrase to regain access.</p>

                        {recoveryError && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 text-xs rounded">
                                {recoveryError}
                            </div>
                        )}

                        <form onSubmit={handleRecovery}>
                            <input
                                type="password"
                                value={recoveryPhrase}
                                onChange={(e) => setRecoveryPhrase(e.target.value)}
                                className="w-full p-3 border rounded-lg mb-4 bg-gray-50 dark:bg-black dark:border-gray-700 dark:text-white"
                                placeholder="Enter recovery phrase"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRecovery(false)}
                                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Recover'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
