import { useAuth } from '../contexts/AuthContext';
import { UNIVERSAL_PATHS } from '../config/permissions';

export const usePermissions = () => {
    const { user, permissionMap } = useAuth();

    const can = (path: string) => {
        if (!user) return false;

        const role = (user.role || '').toLowerCase();

        // 1. Global Admin Bypass (CEO now follows standard permissions)
        if (role === 'admin') return true;

        // 2. Personal Settings (Always Allowed)
        if (path.startsWith('/settings/profile') || path.startsWith('/settings/preferences')) return true;

        const isViewer = role === 'viewer';

        // 3. Centralized Universal Paths
        if (!isViewer) {
            if (UNIVERSAL_PATHS.some(p => path === p || path.startsWith(p + '/'))) return true;
        }

        // 4. Explicit Permissions from Backend
        const perms = user.permissions || [];
        if (!Array.isArray(perms)) return false;

        // Check for exact match (Route string in perms)
        if (perms.includes(path)) return true;

        // Check for mapped action (Action slug in perms grants access to current path)
        return perms.some(p => {
            const mappedRoutes = (permissionMap as any)[p] || [];
            return mappedRoutes.some((r: string) => path === r || path.startsWith(r + '/'));
        });
    };

    const hasRole = (roles: string | string[]) => {
        if (!user) return false;
        const currentRole = (user.role || '').toLowerCase();
        if (currentRole === 'admin') return true;

        const roleList = (Array.isArray(roles) ? roles : [roles]).map(r => r.toLowerCase());
        return roleList.includes(currentRole);
    };

    return { can, hasRole, user };
};
