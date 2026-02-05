import React, { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';

// --- Suggestion Registry ---
// In a real app, this could come from an API or AI model
// ... existing imports ...

// --- Suggestion Registry ---
// In a real app, this could come from an API or AI model
const SUGGESTIONS: Record<string, string[]> = {
    'invoice_desc_service': [
        "Consultation services for [Project Name]",
        "Monthly retainer for IT support (April 2026)",
        "Professional fees for architectural design",
        "Labor charges for installation of X"
    ],
    'invoice_desc_product': [
        "Bulk supply of [Item Name]",
        "Warranty replacement for invoice #123",
        "spare parts for maintenance unit",
        "Includes delivery and handling"
    ],
    'ticket_subject': [
        "Login issue: Cannot access account",
        "Bug Report: Dashboard not loading",
        "Feature Request: Add dark mode",
        "Billing Inquiry: Invoice #999"
    ],
    'ticket_desc': [
        "I am experiencing an issue when trying to...",
        "The system throws an error 500 when I click...",
        "Please provide an update on the status of...",
        "I would like to request access to module X..."
    ],
    'inventory_desc': [
        "Standard stock item, reorder level 10",
        "Perishable goods - check expiry",
        "Imported from Main Supplier, Batch A",
        "Includes standard accessories"
    ],
    'memo_content': [
        "Please be advised that the server maintenance will occur on...",
        "Meeting reminder: All department heads to attend...",
        "New policy update regarding remote work...",
        "Congratulations to the sales team for reaching the quarterly target!"
    ],
    'task_title': [
        "Review monthly financial reports",
        "Client meeting with [Client Name]",
        "Update inventory records",
        "Prepare presentation for board meeting"
    ],
    'search_clients': [
        "Search by Company Name",
        "Find by KRA PIN",
        "Lookup by Email Address",
        "Search by Phone Number"
    ],
    'search_suppliers': [
        "Search by Supplier Name",
        "Find by Category (e.g., Electronics)",
        "Lookup by Contact Person",
        "Search by Payment Terms"
    ],
    'search_vault': [
        "Search by Document Name",
        "Find by File Type (pdf, jpg)",
        "Lookup by Upload Date",
        "Search by Uploader Name"
    ],
    'search_help': [
        "How do I create an invoice?",
        "Reset password",
        "Export inventory report",
        "Contact support"
    ],
    'search_general': [
        "Search...",
        "Type to find...",
        "Filter results...",
        "Start typing..."
    ],
    'default': [
        "Type to start...",
        "Enter details here...",
        "Be specific for better records..."
    ]
};

interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    context?: string; // e.g., 'invoice_desc_service'
    label?: string;
    enableSmartGuide?: boolean;
    ghostOffset?: string;
}

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    context?: string;
    label?: string;
    enableSmartGuide?: boolean;
    ghostOffset?: string;
}

export const SmartTextarea: React.FC<SmartTextareaProps> = ({
    context = 'default',
    label,
    enableSmartGuide = true,
    ghostOffset,
    className = "",
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    ...props
}) => {
    // ... existing implementation ...
    const [suggestion, setSuggestion] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Rotate suggestions
    useEffect(() => {
        if (!enableSmartGuide) return;

        const key = Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default';
        const pool = SUGGESTIONS[key] || SUGGESTIONS['default'];

        setSuggestion(pool[Math.floor(Math.random() * pool.length)]);

        const interval = setInterval(() => {
            if (!value) {
                setSuggestion(pool[Math.floor(Math.random() * pool.length)]);
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [context, enableSmartGuide, value]);

    return (
        <div className="w-full space-y-2 group">
            {label && (
                <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{label}</label>
                    {isFocused && enableSmartGuide && !value && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-500 animate-pulse font-bold">
                            <FiZap size={10} />
                            <span>Suggestion: {suggestion}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="relative">
                <textarea
                    {...props}
                    value={value}
                    onChange={onChange}
                    onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
                    placeholder={enableSmartGuide && !value && !isFocused ? "" : placeholder}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-brand-500/10 transition-all resize-none ${className}`}
                />

                {enableSmartGuide && !value && !isFocused && (
                    <div
                        className="absolute top-4 left-5 text-gray-400 pointer-events-none opacity-50 italic truncate max-w-[90%]"
                        style={ghostOffset ? { left: ghostOffset } : {}}
                    >
                        e.g., "{suggestion}"
                    </div>
                )}
            </div>

            {isFocused && !value && enableSmartGuide && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(SUGGESTIONS[Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default'] || []).slice(0, 3).map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                                if (nativeInputValueSetter && e.currentTarget.parentElement?.previousElementSibling?.querySelector('textarea')) {
                                    const textarea = e.currentTarget.parentElement.previousElementSibling.querySelector('textarea');
                                    nativeInputValueSetter.call(textarea, s);
                                    textarea?.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }}
                            className="text-[10px] whitespace-nowrap px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-full transition-colors cursor-pointer border border-brand-200"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SmartInput: React.FC<SmartInputProps> = ({
    context = 'default',
    label,
    enableSmartGuide = true,
    ghostOffset,
    className = "",
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    ...props
}) => {
    const [suggestion, setSuggestion] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!enableSmartGuide) return;
        const key = Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default';
        const pool = SUGGESTIONS[key] || SUGGESTIONS['default'];
        setSuggestion(pool[Math.floor(Math.random() * pool.length)]);
        const interval = setInterval(() => {
            if (!value) setSuggestion(pool[Math.floor(Math.random() * pool.length)]);
        }, 8000);
        return () => clearInterval(interval);
    }, [context, enableSmartGuide, value]);

    return (
        <div className="w-full space-y-2 group">
            {label && (
                <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{label}</label>
                    {isFocused && enableSmartGuide && !value && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-500 animate-pulse font-bold">
                            <FiZap size={10} />
                            <span>Suggestion: {suggestion}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    {...props}
                    value={value}
                    onChange={onChange}
                    onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
                    placeholder={enableSmartGuide && !value && !isFocused ? "" : placeholder}
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-brand-500/10 transition-all ${className}`}
                />

                {enableSmartGuide && !value && !isFocused && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 left-5 text-gray-400 pointer-events-none opacity-50 italic truncate max-w-[90%]"
                        style={ghostOffset ? { left: ghostOffset } : {}}
                    >
                        e.g., "{suggestion}"
                    </div>
                )}
            </div>

            {isFocused && !value && enableSmartGuide && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(SUGGESTIONS[Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default'] || []).slice(0, 3).map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                                if (nativeInputValueSetter && e.currentTarget.parentElement?.previousElementSibling?.querySelector('input')) {
                                    const input = e.currentTarget.parentElement.previousElementSibling.querySelector('input');
                                    nativeInputValueSetter.call(input, s);
                                    input?.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }}
                            className="text-[10px] whitespace-nowrap px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-full transition-colors cursor-pointer border border-brand-200"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
