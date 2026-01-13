// Error Boundary Component
// Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details to console for debugging
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // Fallback UI when an error occurs
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-midnight-950 p-4 transition-colors">
                    <div className="max-w-md w-full bg-white dark:bg-midnight-900 rounded-3xl shadow-xl shadow-red-500/10 p-10 text-center border border-gray-100 dark:border-midnight-800">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaExclamationTriangle className="text-red-500 text-4xl" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">System Interruption</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                            An unexpected execution error occurred. We've captured the diagnostics to help stabilize the system.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Restart Application
                            </button>
                            <button
                                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                className="w-full px-6 py-3 bg-white dark:bg-midnight-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-midnight-700 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-midnight-700 transition-all"
                            >
                                Reset System Cache
                            </button>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/5 rounded-2xl text-left border border-red-100 dark:border-red-900/10 overflow-hidden">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Stack Trace</p>
                                <p className="text-xs font-mono text-red-800 dark:text-red-400 break-all leading-relaxed opacity-80">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
