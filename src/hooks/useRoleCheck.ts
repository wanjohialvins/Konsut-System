import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for role-based access checks
 * Provides convenient boolean flags for common role checks
 * Matches the exact roles defined in config.php:
 * admin, ceo, manager, sales, storekeeper, accountant, staff, viewer, it
 */
export const useRoleCheck = () => {
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();

    const isAdmin = role === 'admin';
    const isCEO = role === 'ceo';
    const isManager = role === 'manager';
    const isSales = role === 'sales';
    const isStorekeeper = role === 'storekeeper';
    const isAccountant = role === 'accountant';
    const isStaff = role === 'staff';
    const isViewer = role === 'viewer';
    const isIT = role === 'it';

    // Convenience combinations
    const isCEOOrAdmin = isAdmin || isCEO;
    const canManage = isAdmin || isCEO || isManager;

    return {
        isAdmin,
        isCEO,
        isManager,
        isSales,
        isStorekeeper,
        isAccountant,
        isStaff,
        isViewer,
        isIT,
        isCEOOrAdmin,
        canManage,
        user,
        role
    };
};
