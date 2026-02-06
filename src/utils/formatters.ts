
import type { Invoice } from '../types/types';

// Recursively convert object keys to camelCase
export const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const camelKey = key.replace(/([-_][a-z])/g, (group) =>
                    group.toUpperCase().replace('-', '').replace('_', '')
                );
                result[camelKey] = toCamelCase(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
};

// Normalize invoice data to ensure structure matches Invoice interface
export const normalizeInvoice = (raw: any): Invoice => {
    // Ensure nested customer object exists if fields are flat
    const customer = {
        id: raw.customer?.id || raw.customerId || '',
        name: raw.customer?.name || raw.customerName || 'N/A',
        phone: raw.customer?.phone || raw.customerPhone || '',
        email: raw.customer?.email || raw.customerEmail || '',
        address: raw.customer?.address || raw.customerAddress || '',
        kraPin: raw.customer?.kraPin || raw.customerKraPin || ''
    };

    return {
        ...raw,
        customer,
        subtotal: Number(raw.subtotal || 0),
        taxAmount: Number(raw.taxAmount || 0),
        grandTotal: Number(raw.grandTotal || 0),
        items: (function () {
            let items = raw.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch { items = []; }
            }
            return Array.isArray(items) ? items.map((item: any) => ({
                ...item,
                unitPrice: Number(item.unitPrice || 0),
                total: Number(item.total || 0),
                quantity: Number(item.quantity || 0)
            })) : [];
        })(),
        // Ensure arrays are initialized
        permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    } as Invoice;
};

// Input Masking Utilities
export const InputMasks = {
    /**
     * Masks phone number to +254 XXX XXX XXX format or similar
     */
    phone: (val: string): string => {
        const digits = val.replace(/\D/g, '');
        if (digits.startsWith('0')) {
            // Local format 07... -> +254 7...
            const sliced = digits.slice(1);
            return `+254 ${sliced.slice(0, 3)} ${sliced.slice(3, 6)} ${sliced.slice(6, 9)}`.trim();
        }
        if (digits.startsWith('254')) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`.trim();
        }
        return val; // Allow freeform if it doesn't match expected patterns
    },

    /**
     * Standardizes KRA PIN (11 chars, Alpha-Numeric, Uppercase)
     */
    kraPin: (val: string): string => {
        return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    }
};

