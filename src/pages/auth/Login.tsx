import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaLock, FaSignInAlt, FaExclamationCircle, FaCheckCircle, FaTicketAlt } from 'react-icons/fa';
import { api } from '../../services/api';
import logo from '../../assets/logo.jpg';
import loginBg from '../../assets/login.jpg';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, recoveryLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Recovery State (Secret)
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryPhrase, setRecoveryPhrase] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);

    // Reset Request State (Public)
    const [showReset, setShowReset] = useState(false);
    const [resetIdentity, setResetIdentity] = useState('');
    const [resetMessage, setResetMessage] = useState(''); // Success or error message
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const from = location.state?.from?.pathname || "/";

    // Secret Sequence Logic
    const [logoClicks, setLogoClicks] = useState(0);
    const [protocolPhase, setProtocolPhase] = useState(0);

    const handleProtocolClick = (type: 'logo' | 'user' | 'pass') => {
        if (type === 'logo') {
            const nextClicks = logoClicks + 1;
            setLogoClicks(nextClicks);
            if (nextClicks === 10) {
                setProtocolPhase(1);
                setLogoClicks(0);
            }
        } else if (type === 'user' && protocolPhase === 1) {
            setProtocolPhase(2);
        } else if (type === 'pass' && protocolPhase === 2) {
            setShowRecovery(true);
            setProtocolPhase(0);
            setLogoClicks(0);
        }
    };

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
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred during login';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoveryLoading(true);

        try {
            if (recoveryLogin) {
                const result = await recoveryLogin(recoveryPhrase);
                if (result?.success) {
                    setShowRecovery(false);
                    navigate('/reset-password', { replace: true });
                } else {
                    setRecoveryError(result?.message || 'Invalid recovery phrase');
                }
            } else {
                setRecoveryError('Recovery service unavailable');
            }
        } catch {
            setRecoveryError('Recovery failed');
        } finally {
            setRecoveryLoading(false);
        }
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setResetMessage('');
        setResetSuccess(false);

        try {
            const res = await api.auth.requestPasswordReset(resetIdentity);
            if (res.success) {
                setResetSuccess(true);
                setResetMessage(res.message);
                setTimeout(() => {
                    setShowReset(false);
                    setResetMessage('');
                    setResetIdentity('');
                    setResetSuccess(false);
                }, 3000);
            } else {
                setResetMessage(res.message || 'Request failed');
            }
        } catch (err) {
            setResetMessage('An error occurred. Please try again.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black font-sans bg-cover bg-center"
            style={{ backgroundImage: `url(${loginBg})` }}
        >
            <div className="absolute inset-0 bg-white/40 dark:bg-black/80 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md p-6 md:p-8 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-white/10 mx-4">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-white dark:bg-midnight-800 shadow-lg mb-4">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-12 w-12 object-contain rounded-full cursor-pointer active:scale-95 transition-transform select-none"
                            onClick={() => handleProtocolClick('logo')}
                            onError={(e) => e.currentTarget.src = "https://via.placeholder.com/50"}
                            title="Konsut Invoicing"
                        />
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
                        <label
                            onClick={() => handleProtocolClick('user')}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-default select-none"
                        >
                            Username
                        </label>
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
                        <label
                            onClick={() => handleProtocolClick('pass')}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-default select-none"
                        >
                            Password
                        </label>
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
                                onClick={() => setShowReset(true)}
                                className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <FaSignInAlt />}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Konsut Ltd. All rights reserved.
                </div>
            </div>

            {/* Secret Recovery Modal */}
            {showRecovery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <FaExclamationCircle size={24} />
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">Emergency Override</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-6 font-mono">AUTHORIZED PERSONNEL ONLY. SYSTEM ACCESS LOGGED.</p>

                        {recoveryError && (
                            <div className="mb-4 p-2 bg-red-900/30 text-red-400 text-xs rounded border border-red-900/50">
                                {recoveryError}
                            </div>
                        )}

                        <form onSubmit={handleRecovery}>
                            <input
                                type="password"
                                value={recoveryPhrase}
                                onChange={(e) => setRecoveryPhrase(e.target.value)}
                                className="w-full p-3 border border-gray-700 rounded-lg mb-4 bg-black text-white font-mono placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                placeholder="Enter Access Phrase"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowRecovery(false); setRecoveryPhrase(''); }}
                                    className="flex-1 py-3 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                >
                                    ABORT
                                </button>
                                <button
                                    type="submit"
                                    disabled={recoveryLoading}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-900/20"
                                >
                                    {recoveryLoading ? 'AUTHENTICATING...' : 'ACCESS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Reset Modal */}
            {showReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-midnight-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-midnight-800">
                        <div className="text-center mb-6">
                            <div className="inline-block p-3 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 mb-3">
                                <FaTicketAlt size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your details to request a reset ticket from the admin.</p>
                        </div>

                        {resetMessage && (
                            <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${resetSuccess ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                                {resetSuccess ? <FaCheckCircle className="mt-0.5 shrink-0" /> : <FaExclamationCircle className="mt-0.5 shrink-0" />}
                                <div>{resetMessage}</div>
                            </div>
                        )}

                        {!resetSuccess && (
                            <form onSubmit={handleRequestReset}>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Username or Email</label>
                                    <input
                                        type="text"
                                        value={resetIdentity}
                                        onChange={(e) => setResetIdentity(e.target.value)}
                                        className="w-full p-3 border border-gray-200 dark:border-midnight-700 rounded-xl bg-gray-50 dark:bg-midnight-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="e.g. john.doe"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowReset(false); setResetIdentity(''); setResetMessage(''); }}
                                        className="flex-1 py-3 bg-white dark:bg-midnight-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-midnight-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-midnight-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-70 shadow-lg shadow-brand-600/20 transition-all"
                                    >
                                        {resetLoading ? 'Sending Request...' : 'Send Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
