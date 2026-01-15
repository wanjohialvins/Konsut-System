// src/types/auth.ts

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

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; forceReset?: boolean; message?: string }>;
    recoveryLogin: (phrase: string) => Promise<{ success: boolean; forceReset?: boolean; message?: string }>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}
