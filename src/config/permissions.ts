
import {
    FiShield,
    FiUser,
    FiActivity,
    FiKey,
    FiBriefcase,
    FiAward,
    FiTag,
    FiShoppingBag
} from "react-icons/fi";

// ============================================================================
// UNIVERSAL PATHS
// ============================================================================
// Paths that are accessible to all authenticated users (unless explicitly blocked)
// logic previously hardcoded in usePermissions.ts
export const UNIVERSAL_PATHS = [
    '/notifications',
    '/support'
];

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================
// Centralized source of truth for role metadata (colors, icons, display names)

export interface RoleDefinition {
    id: string;
    label: string;
    description?: string;
    colorClass: string; // Tailwind simplified class pattern
    icon: any;
    defaultPermissions?: string[];
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
    admin: {
        id: 'admin',
        label: 'Administrator',
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
        icon: FiShield
    },
    ceo: {
        id: 'ceo',
        label: 'CEO',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
        icon: FiAward
    },
    manager: {
        id: 'manager',
        label: 'Manager',
        colorClass: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        icon: FiBriefcase
    },
    sales: {
        id: 'sales',
        label: 'Sales',
        colorClass: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
        icon: FiTag
    },
    storekeeper: {
        id: 'storekeeper',
        label: 'Storekeeper',
        colorClass: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        icon: FiShoppingBag
    },
    accountant: {
        id: 'accountant',
        label: 'Accountant',
        colorClass: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
        icon: FiKey
    },
    it: {
        id: 'it',
        label: 'IT Support',
        colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800',
        icon: FiActivity
    },
    staff: {
        id: 'staff',
        label: 'Staff',
        colorClass: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
        icon: FiUser
    },
    viewer: {
        id: 'viewer',
        label: 'Viewer',
        colorClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
        icon: FiUser
    }
};

// Fallback for unknown roles
export const DEFAULT_ROLE_DEF: RoleDefinition = {
    id: 'unknown',
    label: 'User',
    colorClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
    icon: FiUser
};
