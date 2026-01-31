import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import AccessDenied from '../../pages/core/AccessDenied';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Maintenance Mode Guard
    const isMaintenance = localStorage.getItem('system_maintenance') === 'true';
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'ceo';

    if (isMaintenance && !isAdmin) {
        return <Navigate to="/maintenance" replace />;
    }

    // Permission Guard
    const { can } = usePermissions();
    if (!isAdmin && user?.permissions && user.permissions.length > 0) {
        const path = location.pathname;
        const isAllowed = can(path);

        if (!isAllowed && path !== '/') {
            return <AccessDenied />;
        }

        // If at root '/' and it's not strictly allowed, also redirect to first allowed
        if (path === '/' && !user.permissions.includes('/')) {
            const firstAllowed = user.permissions[0];
            if (firstAllowed) {
                return <Navigate to={firstAllowed} replace />;
            }
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
