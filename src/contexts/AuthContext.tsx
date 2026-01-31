import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePermissions } from '../utils/permissionUtils';
import { normalizeUser } from '../utils/userUtils';
import { api } from '../services/api';
import type { User, UserRole, AuthContextType } from "../types/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'konsut_system_auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (error) {
                console.error("Auth state recovery failed:", error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; forceReset?: boolean; message?: string }> => {
        try {
            const response = await api.auth.login({ username, password });
            if (response.success && response.user) {
                const userData = normalizeUser(response.user);
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
                const userData = normalizeUser(response.user);
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

    const navigate = useNavigate();

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const lastRefreshRef = React.useRef<number>(0);
    const refreshUser = useCallback(async () => {
        if (!user) return;

        const now = Date.now();
        if (now - lastRefreshRef.current < 5000) return;
        lastRefreshRef.current = now;

        try {
            const self = await api.users.getSelf();
            if (self) {
                const updatedUser = normalizeUser({ ...user, ...self });
                setUser(updatedUser);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Failed to refresh user auth state", error);
        }
    }, [user]);

    useEffect(() => {
        const handleUpdate = () => refreshUser();
        const handleForceLogout = () => {
            console.warn("Session expired (Force Logout initiated)");
            logout(); // Clear state and redirect to login
            // detailed message is handled by api.ts error or we can show toast here if we had toast access
        };

        window.addEventListener('permission-update', handleUpdate);
        window.addEventListener('force-logout', handleForceLogout);
        window.addEventListener('focus', handleUpdate);

        // Poll every 30 seconds for real-time permission updates
        const interval = setInterval(handleUpdate, 30 * 1000);

        return () => {
            window.removeEventListener('permission-update', handleUpdate);
            window.removeEventListener('force-logout', handleForceLogout);
            window.removeEventListener('focus', handleUpdate);
            clearInterval(interval);
        };
    }, [refreshUser, logout]);

    const [permissionMap, setPermissionMap] = useState<Record<string, string[]>>({});

    const fetchMeta = useCallback(async () => {
        try {
            const meta = await api.meta.get();
            if (meta && meta.routeMap) {
                setPermissionMap(meta.routeMap);
            }
        } catch (error) {
            console.error("Failed to fetch system meta:", error);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            recoveryLogin,
            logout,
            updateUser,
            refreshUser,
            isAuthenticated: !!user,
            loading: isLoading,
            permissionMap
        }}>
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
