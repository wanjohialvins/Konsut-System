import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export type UserRole = 'admin' | 'ceo' | 'manager' | 'sales' | 'storekeeper' | 'accountant' | 'staff' | 'viewer';

export interface User {
    id: string | number;
    username: string;
    role: UserRole;
    displayRole: string;
    permissions: string[];
    name: string;
    email?: string;
    is_active?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; forceReset?: boolean; message?: string }>;
    recoveryLogin: (phrase: string) => Promise<{ success: boolean; forceReset?: boolean; message?: string }>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'invoice_system_auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (error) {
                console.error("Failed to parse stored user", error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; forceReset?: boolean; message?: string }> => {
        try {
            const response = await api.auth.login({ username, password });
            if (response.success && response.user) {
                const parsePermissions = (perms: any) => {
                    if (!perms) return [];
                    if (typeof perms === 'object') return perms;
                    try {
                        if (typeof perms === 'string' && perms.trim() === '') return [];
                        return JSON.parse(perms) || [];
                    } catch (error) {
                        console.error("Failed to parse permissions", error);
                        return [];
                    }
                };

                const role = response.user.role || 'viewer';
                const userData: User = {
                    ...response.user,
                    displayRole: role === 'ceo' ? 'CEO' :
                        role === 'admin' ? 'Administrator' :
                            role.charAt(0).toUpperCase() + role.slice(1),
                    permissions: parsePermissions(response.user.permissions),
                    name: response.user.name || response.user.username || 'User'
                };
                setUser(userData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                return { success: true, forceReset: response.forceReset, message: response.message };
            }
            return { success: false, message: response.message || 'Invalid credentials' };
        } catch (error: any) {
            console.error('Login failed:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const recoveryLogin = async (phrase: string): Promise<{ success: boolean; forceReset?: boolean; message?: string }> => {
        try {
            const response = await api.auth.recoveryLogin(phrase);
            if (response.success && response.user) {
                const parsePermissions = (perms: any) => {
                    if (!perms) return [];
                    if (typeof perms === 'object') return perms;
                    try {
                        if (typeof perms === 'string' && perms.trim() === '') return [];
                        return JSON.parse(perms) || [];
                    } catch (error) {
                        console.error("Failed to parse permissions", error);
                        return [];
                    }
                };

                const role = response.user.role || 'viewer';
                const userData: User = {
                    ...response.user,
                    displayRole: role === 'ceo' ? 'CEO' :
                        role === 'admin' ? 'Administrator' :
                            role.charAt(0).toUpperCase() + role.slice(1),
                    permissions: parsePermissions(response.user.permissions),
                    name: response.user.name || response.user.username || 'User'
                };
                setUser(userData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                return { success: true, forceReset: response.forceReset, ...response };
            }
            return { success: false, message: response.message || 'Invalid recovery phrase' };
        } catch (error: any) {
            console.error('Recovery login failed:', error);
            return { success: false, message: error.message || 'Recovery failed' };
        }
    };

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, recoveryLogin, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
