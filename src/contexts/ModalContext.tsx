import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { FiAlertCircle, FiCheck, FiInfo, FiHelpCircle, FiX } from 'react-icons/fi';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    defaultValue?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
}

interface ModalState extends ModalOptions {
    isOpen: boolean;
    type: ModalType;
    message: string;
}

interface ModalContextType {
    showAlert: (message: string, options?: Omit<ModalOptions, 'defaultValue' | 'onConfirm' | 'onCancel'>) => Promise<void>;
    showConfirm: (message: string, options?: Omit<ModalOptions, 'defaultValue'>) => Promise<boolean>;
    showPrompt: (message: string, defaultValue?: string, options?: ModalOptions) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: 'alert',
        message: '',
    });

    const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);
    const [promptValue, setPromptValue] = useState("");

    const openModal = (type: ModalType, message: string, options: ModalOptions = {}) => {
        setModal({
            isOpen: true,
            type,
            message,
            ...options
        });
        setPromptValue(options.defaultValue || "");
        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
        });
    };

    const close = (result: any) => {
        setModal(prev => ({ ...prev, isOpen: false }));
        if (resolvePromise) resolvePromise(result);
    };

    const showAlert = (message: string, options?: ModalOptions) =>
        openModal('alert', message, options) as Promise<void>;

    const showConfirm = (message: string, options?: ModalOptions) =>
        openModal('confirm', message, options) as Promise<boolean>;

    const showPrompt = (message: string, defaultValue?: string, options?: ModalOptions) =>
        openModal('prompt', message, { ...options, defaultValue }) as Promise<string | null>;

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-midnight-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-midnight-800 overflow-hidden animate-scale-up">
                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className={`p-4 rounded-2xl ${modal.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                                    modal.type === 'confirm' ? 'bg-brand-100 text-brand-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {modal.type === 'alert' && <FiAlertCircle size={32} />}
                                    {modal.type === 'confirm' && <FiHelpCircle size={32} />}
                                    {modal.type === 'prompt' && <FiInfo size={32} />}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center mb-4">
                                {modal.title || (modal.type === 'alert' ? 'Notification' : modal.type === 'confirm' ? 'Confirm Action' : 'Input Required')}
                            </h3>

                            <p className="text-gray-500 dark:text-midnight-text-secondary text-center font-medium leading-relaxed mb-8">
                                {modal.message}
                            </p>

                            {modal.type === 'prompt' && (
                                <input
                                    autoFocus
                                    value={promptValue}
                                    onChange={e => setPromptValue(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl mb-8 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    onKeyDown={e => e.key === 'Enter' && close(promptValue)}
                                />
                            )}

                            <div className="flex gap-3">
                                {modal.type !== 'alert' && (
                                    <button
                                        onClick={() => close(modal.type === 'confirm' ? false : null)}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs bg-gray-100 dark:bg-midnight-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-all"
                                    >
                                        {modal.cancelLabel || 'Cancel'}
                                    </button>
                                )}
                                <button
                                    onClick={() => close(modal.type === 'prompt' ? promptValue : true)}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-white transition-all shadow-xl ${modal.type === 'alert' ? 'bg-amber-600 shadow-amber-600/20' :
                                        modal.type === 'confirm' ? 'bg-brand-600 shadow-brand-600/20' : 'bg-emerald-600 shadow-emerald-600/20'
                                        }`}
                                >
                                    {modal.confirmLabel || (modal.type === 'alert' ? 'Got it' : 'Confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within ModalProvider');
    return context;
};
