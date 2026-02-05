import React, { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';

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
    'inventory_desc': [
        "Standard stock item, reorder level 10",
        "Perishable goods - check expiry",
        "Imported from Main Supplier, Batch A",
        "Includes standard accessories"
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
}

export const SmartTextarea: React.FC<SmartTextareaProps> = ({
    context = 'default',
    label,
    enableSmartGuide = true,
    className = "",
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const [suggestion, setSuggestion] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Rotate suggestions
    useEffect(() => {
        if (!enableSmartGuide) return;

        const key = Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default';
        const pool = SUGGESTIONS[key] || SUGGESTIONS['default'];

        // Pick one at random initially
        setSuggestion(pool[Math.floor(Math.random() * pool.length)]);

        // Optional: Rotate every 10s if user hasn't typed
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
                    className={`w-full bg-gray-50 dark:bg-midnight-950 border-none rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-brand-500/10 transition-all resize-none ${className}`}
                />

                {/* Visual Ghost Text (Overlay) - Only visible when empty and not focused (or focused but we want to show hint) */}
                {enableSmartGuide && !value && !isFocused && (
                    <div className="absolute top-4 left-5 text-gray-400 pointer-events-none opacity-50 italic truncate max-w-[90%]">
                        e.g., "{suggestion}"
                    </div>
                )}
            </div>

            {/* Quick Insert Helper (Visible when focused and empty) */}
            {isFocused && !value && enableSmartGuide && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(SUGGESTIONS[Object.keys(SUGGESTIONS).find(k => context.includes(k)) || 'default'] || []).slice(0, 3).map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                                // Hack to trigger change event compatible with React state
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
