import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiArrowLeft, FiHome } from 'react-icons/fi';

const AccessDenied: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white dark:bg-midnight-900 p-6 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30">
                    <FiShield className="w-20 h-20 text-red-500" />
                </div>
            </div>

            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                Access Denied
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
                You don't have the necessary permissions to view this page. If you believe this is an error, please contact your system administrator.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-white dark:bg-midnight-800 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-midnight-700 transition-all active:scale-95"
                >
                    <FiArrowLeft /> Go Back
                </button>

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-brand-600 text-white font-semibold rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95"
                >
                    <FiHome /> Back to Dashboard
                </button>
            </div>

            <div className="mt-16 text-slate-400 dark:text-slate-600 text-sm font-medium">
                Error Code: 403_FORBIDDEN_RESTRICTED_ACCESS
            </div>
        </div>
    );
};

export default AccessDenied;
