/* 
 * Componente de Layout/Sidebar - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:51
 * @version 1.1.0
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_VERSION, AUTHOR } from '../config';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    Lock,
    Users,
    FolderOpen,
    Menu,
    X,
    Palette
} from 'lucide-react';
import { SkipLink } from './ui';

interface LayoutProps {
    children: ReactNode;
}

// Links de navegação
const navLinks = [
    {
        path: '/',
        label: 'Dashboard',
        icon: LayoutDashboard
    },
    {
        path: '/nova-producao',
        label: 'Lançar Produção',
        icon: PlusCircle
    },
    {
        path: '/producoes',
        label: 'Produções',
        icon: List
    },
    {
        path: '/fechamento',
        label: 'Fechamento',
        icon: Lock
    },
    {
        path: '/clientes',
        label: 'Clientes',
        icon: Users
    },
    {
        path: '/projetos',
        label: 'Projetos',
        icon: FolderOpen
    },
];

export function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    <div className="w-10" /> {/* Espaçador */}
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
                className={`sidebar ${sidebarOpen ? 'translate-x-0' : ''}`}
                aria-label="Navegação principal"
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-lg">Palma.PSD</h1>
                                <span className="text-xs text-slate-500">Controle de Produção</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Fechar menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navegação */}
                <nav className="flex-1 py-4" aria-label="Menu principal">
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
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-xs text-slate-500">
                            Desenvolvido por
                        </p>
                        <a
                            href={AUTHOR.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            {AUTHOR.name}
                        </a>
                        <p className="text-xs text-slate-600 mt-1">v{APP_VERSION}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content pt-20 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
