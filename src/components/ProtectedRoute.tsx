/* 
 * Componente de Rota Protegida - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:00
 * @version 1.3.0
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'admin' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { authState, isAdmin } = useAuth();
    const location = useLocation();

    // Loading inicial
    if (authState.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!authState.isAuthenticated) {
        // Redireciona para login, salvando a localização atual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verifica role se especificado
    if (requiredRole === 'admin' && !isAdmin) {
        // Não é admin, redireciona para home
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
