/* 
 * Componente de Rota Protegida - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { authState } = useAuth();
    const location = useLocation();

    if (!authState.isAuthenticated) {
        // Redireciona para login, salvando a localização atual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verifica role se especificado
    if (requiredRole && authState.user?.role !== requiredRole && authState.user?.role !== 'admin') {
        // Admin tem acesso a tudo
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
