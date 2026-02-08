import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeUser } from '../utils/userUtils';
import { api } from '../services/api';
import type { User, AuthContextType } from "../types/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'konsut_system_auth';
const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000; // 24 hours

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastActivity = useRef<number>(Date.now());
    const navigate = useNavigate();

    // 1. Load User from SessionStorage (Cleared on Browser Close)
    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                // Refresh activity on load
                lastActivity.current = Date.now();
            } catch (error) {
                console.error("Auth state recovery failed:", error);
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    // 2. Inactivity Tracker
    useEffect(() => {
        if (!user) return; // Only track if logged in

        const handleActivity = () => {
            lastActivity.current = Date.now();
        };

        // Throttled listeners could be better, but native events are okay for now
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        const interval = setInterval(() => {
            if (Date.now() - lastActivity.current > INACTIVITY_LIMIT) {
                console.warn("User inactive for > 24 hours. Logging out.");
                logout();
            }
        }, 60 * 1000); // Check every minute

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            clearInterval(interval);
        };
    }, [user, logout]);


    const login = async (username: string, password: string): Promise<{ success: boolean; forceReset?: boolean; message?: string }> => {
        try {
            const response = await api.auth.login({ username, password });
            if (response.success && response.user) {
                const userData = normalizeUser({ ...response.user, token: response.token });
                setUser(userData);
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                lastActivity.current = Date.now();
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
                const userData = normalizeUser({ ...response.user, token: response.token });
                setUser(userData);
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                lastActivity.current = Date.now();
                return { success: true, forceReset: response.forceReset, ...response };
            }
            return { success: false, message: response.message || 'Invalid recovery phrase' };
        } catch (error: unknown) {
            console.error('Recovery login failed:', error);
            const message = error instanceof Error ? error.message : 'Recovery failed';
            return { success: false, message };
        }
    };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...data };
        setUser(updated);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Failed to refresh user auth state", error);
        }
    }, [user]);

    useEffect(() => {
        const handleUpdate = () => refreshUser();
        const handleForceLogout = () => {
            console.warn("Session expired (Force Logout initiated)");
            logout();
        };

        window.addEventListener('permission-update', handleUpdate);
        window.addEventListener('force-logout', handleForceLogout);
        window.addEventListener('focus', handleUpdate);

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
