// src/services/api.ts
import type { Invoice, Product, Customer } from "../types/types";
import type { User } from "../types/types";

const API_BASE_URL = 'http://127.0.0.1/public_html/api';

const request = async (endpoint: string, options: RequestInit = {}) => {
    // Get user info from localStorage (as stored by AuthContext)
    const userJson = localStorage.getItem('invoice_system_auth');
    const user = userJson ? JSON.parse(userJson) : null;

    const headers = {
        'Content-Type': 'application/json',
        // 'Cache-Control': 'no-cache', // usage simplified
        ...(user ? {
            'X-User-Role': user.role,
            'X-User-Permissions': JSON.stringify(user.permissions || []),
            'X-User-Id': user.id
        } : {}),
        ...options.headers,
    };

    const url = `${API_BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors', // Explicitly request CORS
            headers,
        });

        if (!response.ok) {
            let errorMsg = `API request failed: ${response.statusText} (${response.status})`;
            try {
                const error = await response.json();
                errorMsg = error.message || error.error || errorMsg;
            } catch {
                // Not JSON
            }
            throw new Error(errorMsg);
        }

        const text = await response.text();
        if (!text || text.trim() === '') return null;

        try {
            return JSON.parse(text);
        } catch {
            console.error('Failed to parse JSON response:', text);
            if (endpoint.includes('.php') && !endpoint.includes('?id=')) return [];
            throw new Error(`Malformed data from ${url}`);
        }
    } catch (error: unknown) {
        console.error(`API Error [${endpoint}]:`, error);
        // Enhance error with URL if it's a fetch error
        if (error instanceof Error && error.message === 'Failed to fetch') {
            throw new Error(`Failed to fetch from ${url}. Check if XAMPP is running and CORS is allowed.`);
        }
        throw error;
    }
}

export const api = {
    auth: {
        login: (credentials: Record<string, string>) => request('auth.php?action=login', { method: 'POST', body: JSON.stringify(credentials) }),
        recoveryLogin: (phrase: string) => request('auth.php?action=recovery_login', { method: 'POST', body: JSON.stringify({ phrase }) }),
        addUser: (userData: User) => request('auth.php?action=add_user', { method: 'POST', body: JSON.stringify(userData) }),
        listUsers: () => request('auth.php?action=list_users'),
    },
    clients: {
        getAll: () => request('clients.php'),
        create: (data: Customer) => request('clients.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Customer) => request('clients.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`clients.php?id=${id}`, { method: 'DELETE' }),
        bulkCreateOrUpdate: async (clients: Customer[]) => {
            for (const client of clients) {
                await request('clients.php', { method: 'POST', body: JSON.stringify(client) });
            }
        },
        deleteAll: async () => {
            await request('clients.php?all=true', { method: 'DELETE' });
        }
    },
    stock: {
        getAll: () => request('stock.php'),
        create: (data: Product) => request('stock.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Product) => request('stock.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`stock.php?id=${id}`, { method: 'DELETE' }),
        bulkCreateOrUpdate: async (items: Product[]) => {
            for (const item of items) {
                await request('stock.php', { method: 'POST', body: JSON.stringify(item) });
            }
        },
        deleteAll: async () => {
            await request('stock.php?all=true', { method: 'DELETE' });
        }
    },
    invoices: {
        getAll: (type?: string) => request(`invoices.php${type ? `?type=${type}` : ''}`),
        getOne: (id: string) => request(`invoices.php?id=${id}`),
        create: (data: Invoice) => request('invoices.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Invoice) => request('invoices.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`invoices.php?id=${id}`, { method: 'DELETE' }),
        deleteAll: async () => {
            await request('invoices.php?all=true', { method: 'DELETE' });
        },
    },
    settings: {
        get: () => request('settings.php'),
        save: (data: Record<string, any>) => request('settings.php', { method: 'POST', body: JSON.stringify(data) }),
        clearAll: () => request('settings.php?action=clear', { method: 'DELETE' }),
    },
    users: {
        getAll: () => request('users.php'),
        create: (data: User) => request('users.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: User) => request('users.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`users.php?id=${id}`, { method: 'DELETE' }),
        resetPassword: (id: string) => request(`users.php?id=${id}&action=reset_password`, { method: 'PATCH' }),
    },
    admin: {
        getAuditLogs: () => request('admin/audit_logs.php'),
        loginHistory: () => request('admin/login_history.php'),
        accountability: () => request('admin/accountability.php'),
        revertAudit: (id: number) => request('admin/revert_audit.php', { method: 'POST', body: JSON.stringify({ audit_id: id }) }),

        runAction: (action: string, payload?: unknown) => {
            let query = `admin/actions.php?action=${action}`;
            if (action === 'broadcast' && payload) query += `&message=${encodeURIComponent(String(payload))}`;
            return request(query, { method: 'POST' });
        },
        debugAuth: (credentials: Record<string, string>) => request('admin/debug_auth.php', { method: 'POST', body: JSON.stringify(credentials) }),
        getSystemHealth: () => request('admin/health.php'),
        getNotifications: () => request('notifications.php'),
        markNotificationRead: (id: string) => request(`notifications.php?id=${id}`, { method: 'PUT' }),
        deleteNotification: (id: string) => request(`notifications.php?id=${id}`, { method: 'DELETE' }),
    },
    suppliers: {
        getAll: () => request('suppliers.php'),
        create: (data: Record<string, any>) => request('suppliers.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Record<string, any>) => request('suppliers.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`suppliers.php?id=${id}`, { method: 'DELETE' }),
    },
    vault: {
        getAll: () => request('vault.php'),
        add: (data: Record<string, any>) => request('vault.php', { method: 'POST', body: JSON.stringify(data) }),
        upload: (formData: FormData) => {
            const token = localStorage.getItem('invoice_system_auth');
            const headers: any = {};
            if (token) {
                const user = JSON.parse(token);
                headers['X-User-Id'] = user.id;
                headers['X-User-Role'] = user.role;
            }
            return fetch(`${API_BASE_URL}/vault.php`, {
                method: 'POST',
                headers,
                body: formData
            }).then(async res => {
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error('Server response was not JSON: ' + text);
                }
            });
        },
        delete: (id: string) => request(`vault.php?id=${id}`, { method: 'DELETE' }),
    },
    tasks: {
        getAll: () => request('tasks.php'),
        create: (data: Partial<any>) => request('tasks.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Partial<any>) => request('tasks.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`tasks.php?id=${id}`, { method: 'DELETE' }),
    },
    memos: {
        getAll: () => request('memos.php'),
        create: (data: Record<string, any>) => request('memos.php', { method: 'POST', body: JSON.stringify(data) }),
    }
};
