/* 
 * Componente de Layout/Sidebar - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:10
 * @version 1.3.0
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    Lock,
    Users,
    FolderOpen,
    Menu,
    X,
    Palette,
    LogOut,
    UserCog,
    Tag
} from 'lucide-react';
import { SkipLink } from './ui';

interface LayoutProps {
    children: ReactNode;
}

// Links de navegação base
const baseNavLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { path: '/producoes', label: 'Produções', icon: List, adminOnly: false },
    { path: '/fechamento', label: 'Fechamento', icon: Lock, adminOnly: false },
];

// Links que só admin vê
const adminNavLinks = [
    { path: '/nova-producao', label: 'Lançar Produção', icon: PlusCircle, adminOnly: true },
    { path: '/clientes', label: 'Clientes', icon: Users, adminOnly: true },
    { path: '/projetos', label: 'Projetos', icon: FolderOpen, adminOnly: true },
    { path: '/tipos-producao', label: 'Tipos de Produção', icon: Tag, adminOnly: true },
];

export function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { authState, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Monta lista de links baseado no role
    const navLinks = isAdmin
        ? [...baseNavLinks.slice(0, 1), ...adminNavLinks.slice(0, 1), ...baseNavLinks.slice(1), ...adminNavLinks.slice(1)]
        : baseNavLinks;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
            <SkipLink />

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Abrir menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Palette className="w-6 h-6 text-primary-400" />
                        <span className="font-bold text-lg">Palma.PSD</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar flex flex-col ${sidebarOpen ? 'translate-x-0' : ''}`}
                aria-label="Navegação principal"
            >
                {/* Logo Section */}
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                                <img
                                    src="https://i.postimg.cc/CxSDFgtp/palmapsd-transp.png"
                                    alt="Palma.PSD"
                                    className="relative w-20 h-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-2">Controle de Produção</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors absolute right-4 top-4"
                            aria-label="Fechar menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navegação */}
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar" aria-label="Menu principal">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <link.icon className="w-5 h-5" aria-hidden="true" />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}

                    {/* Link de Usuários (só para admin) */}
                    {isAdmin && (
                        <NavLink
                            to="/usuarios"
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <UserCog className="w-5 h-5" aria-hidden="true" />
                            <span>Usuários</span>
                        </NavLink>
                    )}
                </nav>

                {/* Footer Section (User + Logout + Credits) */}
                <div className="border-t border-white/10 bg-slate-900/30 mt-auto p-4">
                    {authState.profile && (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/80 border border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="text-white text-xs font-semibold">
                                        {authState.profile.nome.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate max-w-[80px]">
                                        {authState.profile.nome}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {isAdmin ? 'Admin' : 'Viewer'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Sair da conta"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content pt-20 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
