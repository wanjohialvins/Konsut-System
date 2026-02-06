// src/services/api.ts
import type { Invoice, Product, Customer } from "../types/types";
import type { User } from "../types/types";
import { toCamelCase, normalizeInvoice } from "../utils/formatters";

const getBaseUrl = () => {
    const hostname = window.location.hostname;

    // Local development (using Vite proxy or direct PHP serve)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost/eragon/api'; // Or whatever your local PHP path is
    }

    // Production: API is relative to the root
    return '/api';
};

export const API_BASE_URL = getBaseUrl();
// Re-triggering deployment with correct domain settings


const request = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const userJson = localStorage.getItem('konsut_system_auth');
    const user = userJson ? JSON.parse(userJson) : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(user ? {
            'Authorization': user.token ? `Bearer ${user.token}` : '',
            'X-User-Role': user.role,
            'X-User-Permissions': JSON.stringify(user.permissions || []),
            'X-User-Id': user.id // Fallback for transition
        } : {}),
        ...options.headers,
    };

    const url = `${API_BASE_URL}/${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            headers,
        });

        if (response.headers.get('X-Action') === 'refresh-auth') {
            window.dispatchEvent(new CustomEvent('permission-update'));
        }

        if (!response.ok) {
            if (response.status === 503) {
                const errorData = await response.clone().json().catch(() => ({}));
                if (errorData.maintenance) {
                    localStorage.setItem('system_maintenance', 'true');
                    if (!window.location.pathname.includes('/maintenance')) {
                        window.location.href = '/maintenance';
                    }
                    return null as any;
                }
            }
            if (response.status === 403) {
                window.dispatchEvent(new CustomEvent('permission-update'));
            }
            if (response.status === 401) {
                // Check if it's a forced logout
                try {
                    const error = await response.clone().json();
                    if (error.forceLogout) {
                        window.dispatchEvent(new CustomEvent('force-logout'));
                    }
                } catch (e) { /* ignore */ }
            }
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
        if (!text || text.trim() === '') return null as any;

        try {
            const json = JSON.parse(text);
            return toCamelCase(json) as T;
        } catch {
            console.error('Failed to parse JSON response:', text);
            if (endpoint.includes('.php') && !endpoint.includes('?id=')) return [] as any;
            throw new Error(`Malformed data from ${url}`);
        }
    } catch (error: unknown) {
        console.error(`API Error [${endpoint}]:`, error);

        const isNetworkError = error instanceof Error &&
            (error.message === 'Failed to fetch' || error.message.includes('NetworkError'));

        if (isNetworkError && ['POST', 'PUT', 'DELETE'].includes(method)) {
            // Offline sync logic
            console.warn(`Offline operation detected: ${endpoint}`);

            try {
                const { enqueueOperation } = await import('./syncQueue');
                const payload = options.body ? JSON.parse(options.body as string) : null;
                await enqueueOperation(endpoint, method as 'POST' | 'PUT' | 'DELETE', payload);


                // Return fake success response to keep UI optimistic
                return { success: true, queued: true } as any;
            } catch (queueError) {
                console.error('Failed to queue operation:', queueError);
            }
        }

        if (error instanceof Error && error.message === 'Failed to fetch') {
            throw new Error(`Failed to fetch from ${url}. Check your internet connection or server availability.`);
        }
        throw error;
    }
}

export const api = {
    auth: {
        login: (credentials: Record<string, string>) => request<any>('auth.php?action=login', { method: 'POST', body: JSON.stringify(credentials) }),
        recoveryLogin: (phrase: string) => request<any>('auth.php?action=recovery_login', { method: 'POST', body: JSON.stringify({ phrase }) }),
        requestPasswordReset: (identity: string) => request<{ success: boolean; message: string }>('auth.php?action=request_reset', { method: 'POST', body: JSON.stringify({ identity }) }),
        addUser: (userData: User) => request<{ success: boolean; message: string }>('auth.php?action=add_user', { method: 'POST', body: JSON.stringify(userData) }),
        impersonate: (userId: number) => request<{ success: boolean; user: User; isImpersonation: boolean }>('auth.php?action=impersonate', { method: 'POST', body: JSON.stringify({ target_user_id: userId }) }),
        forceLogout: (userId: number) => request<{ success: boolean; message: string }>('auth.php?action=force_logout', { method: 'POST', body: JSON.stringify({ target_user_id: userId }) }),
        listUsers: () => request<User[]>('auth.php?action=list_users'),
    },
    clients: {
        getAll: () => request<Customer[]>('clients.php'),
        create: (data: Customer) => request<{ success: boolean }>('clients.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Customer) => request<{ success: boolean }>('clients.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<{ success: boolean }>(`clients.php?id=${id}`, { method: 'DELETE' }),
        bulkCreateOrUpdate: async (clients: Customer[]) => {
            for (const client of clients) {
                await request<{ success: boolean }>('clients.php', { method: 'POST', body: JSON.stringify(client) });
            }
        },
        deleteAll: async () => {
            await request<{ success: boolean }>('clients.php?all=true', { method: 'DELETE' });
        }
    },
    stock: {
        getAll: () => request<Product[]>('stock.php'),
        create: (data: Product) => request<{ success: boolean }>('stock.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Product) => request<{ success: boolean }>('stock.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<{ success: boolean }>(`stock.php?id=${id}`, { method: 'DELETE' }),
        bulkCreateOrUpdate: async (items: Product[]) => {
            for (const item of items) {
                await request<{ success: boolean }>('stock.php', { method: 'POST', body: JSON.stringify(item) });
            }
        },
        deleteAll: async () => {
            await request<{ success: boolean }>('stock.php?all=true', { method: 'DELETE' });
        }
    },
    invoices: {
        getAll: async (type?: string, clientId?: string) => {
            let query = '';
            if (type && clientId) query = `?type=${type}&clientId=${clientId}`;
            else if (type) query = `?type=${type}`;
            else if (clientId) query = `?clientId=${clientId}`;
            const data = await request<any[]>(`invoices.php${query}`);
            return Array.isArray(data) ? data.map(normalizeInvoice) : [];
        },
        getOne: (id: string) => request<Invoice>(`invoices.php?id=${id}`),
        create: (data: Invoice) => request<{ success: boolean; clientUpdated: boolean; id: string }>('invoices.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: Invoice) => request<{ success: boolean; clientUpdated: boolean; id: string }>('invoices.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<{ success: boolean }>(`invoices.php?id=${id}`, { method: 'DELETE' }),
        deleteAll: async () => {
            await request<{ success: boolean }>('invoices.php?all=true', { method: 'DELETE' });
        },
    },
    sequences: {
        next: (type: 'invoice' | 'quotation' | 'proforma') => request<{ number: string; value: number }>(`sequences.php?action=next&type=${type}`, { method: 'POST' }),
        peek: (type: 'invoice' | 'quotation' | 'proforma') => request<{ number: string; value: number }>(`sequences.php?action=peek&type=${type}`)
    },
    meta: {
        get: () => request<any>('meta.php'),
    },
    settings: {
        get: () => request<any>('settings.php'),
        save: (data: Record<string, any>) => request<{ success: boolean }>('settings.php', { method: 'POST', body: JSON.stringify(data) }),
        clearAll: () => request<{ success: boolean }>('settings.php?action=clear', { method: 'DELETE' }),
    },
    users: {
        getAll: () => request<User[]>('users.php'),
        getSelf: () => request<User>('users.php?action=get_self'),
        create: (data: User) => request<{ success: boolean }>('users.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: User) => request<{ success: boolean }>('users.php', { method: 'PUT', body: JSON.stringify(data) }),
        updateSelf: (data: Partial<User>) => request<{ success: boolean }>('users.php?action=update_self', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<{ success: boolean }>(`users.php?id=${id}`, { method: 'DELETE' }),
        resetPassword: (id: string) => request<{ success: boolean }>(`users.php?id=${id}&action=reset_password`, { method: 'PATCH' }),
        getAssignable: () => request<User[]>('users.php?action=get_assignable'),
    },
    admin: {
        getSystemLogs: () => request<{ logs: string }>('admin/get_error_logs.php'),
        clearSystemLogs: () => request('admin/get_error_logs.php', { method: 'DELETE' }),
        getAuditLogs: () => request('admin/audit_logs.php'),
        loginHistory: () => request('admin/login_history.php'),
        accountability: () => request('admin/accountability.php'),
        revertAudit: (id: number) => request<{ success: boolean; message: string }>('admin/revert_audit.php', { method: 'POST', body: JSON.stringify({ audit_id: id }) }),

        runAction: (action: string, payload?: unknown, type?: string) => {
            let query = `admin/actions.php?action=${action}`;
            if (action === 'broadcast' && payload) {
                query += `&message=${encodeURIComponent(String(payload))}`;
                if (type) query += `&type=${type}`;
            }
            return request<any>(query, { method: 'POST' });
        },
        getActiveUsers: () => request<{ success: boolean; users: any[] }>('admin/actions.php?action=get-active-users', { method: 'POST' }),
        debugAuth: (credentials: Record<string, string>) => request<{ success: boolean; debugInfo: any }>('admin/debug_auth.php', { method: 'POST', body: JSON.stringify(credentials) }),
        getSystemHealth: () => request<any>('admin/health.php'),
        getNotifications: () => request('notifications.php'),
        getNotificationsCount: () => request<{ unreadCount: number }>('notifications.php?action=count'),
        markNotificationRead: (id: string) => request(`notifications.php?id=${id}`, { method: 'PUT' }),
        deleteNotification: (id: string) => request(`notifications.php?id=${id}`, { method: 'DELETE' }),
        backup: () => request<any>('admin/backup.php'),
        cleanupDuplicates: (type: 'all' | 'stock' | 'clients' = 'all', mode: 'commit' | 'dry_run' = 'commit') => request<{ merged: { stock: number; clients: number } }>(`admin/cleanup_duplicates.php?type=${type}&mode=${mode}`, { method: 'POST' }),
        getDashboardStats: (start?: string, end?: string) => {
            let query = 'admin/dashboard_stats.php';
            if (start && end) {
                query += `?start=${start}&end=${end}`;
            }
            return request<any>(query);
        },
        getAnalyticsStats: (days: number) => request<any>(`admin/analytics_stats.php?days=${days}`),
        executeSql: (query: string) => request<{ success: boolean; results?: any[]; count?: number; message?: string; error?: string }>('admin/sql.php', { method: 'POST', body: JSON.stringify({ query }) }),
        getCrons: () => request<{ tasks: any[] }>('admin/crons.php'),
        runCron: (taskId: string) => request<{ success: boolean; message: string; last_run: string }>('admin/crons.php?action=run', { method: 'POST', body: JSON.stringify({ task_id: taskId }) }),
        updateCronSchedule: (taskId: string, schedule: string, frequency: string, enabled: boolean) => request<{ success: boolean; message: string }>('admin/crons.php?action=update_schedule', { method: 'POST', body: JSON.stringify({ task_id: taskId, schedule, frequency, enabled }) }),
        getConfig: () => request<{ config: Record<string, string> }>('admin/config_editor.php'),
        updateConfig: (config: Record<string, string>) => request<{ success: boolean; message: string }>('admin/config_editor.php', { method: 'POST', body: JSON.stringify({ config }) }),
        getFiles: () => request<{ files: any[] }>('admin/files.php'),
        deleteFile: (filename: string) => request<{ success: boolean }>('admin/files.php?action=delete&file=' + filename, { method: 'DELETE' }),

        // Advanced Utils
        killAllSessions: () => request<{ success: boolean; message: string }>('auth.php?action=global_logout', { method: 'POST' }),
        clearSystemCache: () => request<{ success: boolean; message: string }>('admin/actions.php?action=clear_system_cache', { method: 'POST' }),
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
            const token = localStorage.getItem('konsut_system_auth');
            const headers: any = {};
            if (token) {
                const user = JSON.parse(token);
                headers['Authorization'] = user.token ? `Bearer ${user.token}` : '';
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
    tickets: {
        getAll: () => request('tickets.php'),
        getById: (id: string) => request(`tickets.php?id=${id}`),
        create: (data: { subject: string; category: string; priority: string; message: string }) =>
            request<{ success: boolean; id: string }>('tickets.php', { method: 'POST', body: JSON.stringify(data) }),
        addMessage: (data: { ticket_id: string; message: string; is_internal?: boolean }) =>
            request<{ success: boolean; id: string }>('tickets.php', { method: 'POST', body: JSON.stringify({ action: 'add_message', ...data }) }),
        updateStatus: (id: string, status: string) =>
            request(`tickets.php?id=${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
        delete: (id: string) => request(`tickets.php?id=${id}`, { method: 'DELETE' }),
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
        update: (data: Record<string, any>) => request('memos.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request(`memos.php?id=${id}`, { method: 'DELETE' }),
    }
};
