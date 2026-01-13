import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>; // Or a proper Loading component
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Maintenance Mode Guard
    const isMaintenance = localStorage.getItem('system_maintenance') === 'true';
    const isAdmin = user?.role === 'admin' || user?.role === 'ceo';

    if (isMaintenance && !isAdmin) {
        return <Navigate to="/maintenance" replace />;
    }

    // Permission Guard
    if (user?.permissions && user.permissions.length > 0 && !isAdmin) {
        // Check if current path is in permissions OR if it's the root path
        const isAllowed = user.permissions.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

        if (!isAllowed && location.pathname !== '/') {
            const firstAllowed = user.permissions[0];
            if (firstAllowed) {
                return <Navigate to={firstAllowed} replace />;
            }
        }

        // If at root '/' and it's not strictly allowed, also redirect to first allowed
        if (location.pathname === '/' && !user.permissions.includes('/')) {
            const firstAllowed = user.permissions[0];
            if (firstAllowed) {
                return <Navigate to={firstAllowed} replace />;
            }
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
