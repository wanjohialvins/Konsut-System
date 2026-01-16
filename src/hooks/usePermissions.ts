import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
    const { user } = useAuth();

    const can = (path: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (!user.permissions || !Array.isArray(user.permissions)) return false;
        return user.permissions.includes(path);
    };

    const hasRole = (roles: string | string[]) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        const roleList = Array.isArray(roles) ? roles : [roles];
        return roleList.includes(user.role);
    };

    return { can, hasRole, user };
};
