import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

import type { User, UserRole, AuthContextType } from "../types/types";

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
                const parsePermissions = (perms: unknown) => {
                    if (!perms) return [];
                    if (Array.isArray(perms)) return perms;
                    if (typeof perms === 'object' && perms !== null) return perms as string[];
                    try {
                        if (typeof perms === 'string' && perms.trim() === '') return [];
                        const parsed = typeof perms === 'string' ? JSON.parse(perms) : perms;
                        return Array.isArray(parsed) ? parsed : [];
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
        } catch (error: unknown) {
            console.error('Login failed:', error);
            const message = error instanceof Error ? error.message : 'Login failed';
            return { success: false, message };
        }
    };

    const recoveryLogin = async (phrase: string): Promise<{ success: boolean; forceReset?: boolean; message?: string }> => {
        try {
            const response = await api.auth.recoveryLogin(phrase);
            if (response.success && response.user) {
                const parsePermissions = (perms: unknown) => {
                    if (!perms) return [];
                    if (Array.isArray(perms)) return perms;
                    if (typeof perms === 'object' && perms !== null) return perms as string[];
                    try {
                        if (typeof perms === 'string' && perms.trim() === '') return [];
                        const parsed = typeof perms === 'string' ? JSON.parse(perms) : perms;
                        return Array.isArray(parsed) ? parsed : [];
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
        } catch (error: unknown) {
            console.error('Recovery login failed:', error);
            const message = error instanceof Error ? error.message : 'Recovery failed';
            return { success: false, message };
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
        <AuthContext.Provider value={{ user, isLoading, login, recoveryLogin, logout, updateUser, isAuthenticated: !!user, loading: isLoading }}>
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
