/* 
 * Contexto de Autenticação - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, AuthState, LoginCredentials, AuthContextType } from '../types/auth';
import { generateId } from '../utils';

const AUTH_STORAGE_KEY = 'palma_psd_auth';
const USERS_STORAGE_KEY = 'palma_psd_users';

// Hash simples para senhas (apenas para demo - não use em produção real)
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

// Usuário admin padrão
const DEFAULT_ADMIN: User = {
    id: 'admin-default-001',
    username: 'admin',
    password: simpleHash('admin123'),
    nome: 'Administrador',
    role: 'admin',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const initialAuthState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>(initialAuthState);
    const [users, setUsers] = useState<User[]>([]);

    // Carrega usuários e estado de autenticação do localStorage
    useEffect(() => {
        // Carrega usuários
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
            const parsed = JSON.parse(savedUsers) as User[];
            // Garante que admin padrão existe
            const hasAdmin = parsed.some(u => u.username === 'admin');
            if (!hasAdmin) {
                parsed.push(DEFAULT_ADMIN);
            }
            setUsers(parsed);
        } else {
            setUsers([DEFAULT_ADMIN]);
        }

        // Carrega autenticação
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
            const parsed = JSON.parse(savedAuth) as AuthState;
            if (parsed.isAuthenticated && parsed.user) {
                setAuthState(parsed);
            }
        }
    }, []);

    // Salva usuários no localStorage
    useEffect(() => {
        if (users.length > 0) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
    }, [users]);

    // Salva estado de autenticação
    useEffect(() => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    }, [authState]);

    const login = (credentials: LoginCredentials): { success: boolean; error?: string } => {
        const { username, password } = credentials;

        if (!username.trim() || !password.trim()) {
            return { success: false, error: 'Preencha todos os campos' };
        }

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        if (!user.ativo) {
            return { success: false, error: 'Usuário desativado' };
        }

        const hashedPassword = simpleHash(password);
        if (user.password !== hashedPassword) {
            return { success: false, error: 'Senha incorreta' };
        }

        // Login bem-sucedido
        const token = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setAuthState({
            isAuthenticated: true,
            user,
            token
        });

        return { success: true };
    };

    const logout = () => {
        setAuthState(initialAuthState);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const addUser = (
        username: string,
        password: string,
        nome: string,
        role: UserRole
    ): { success: boolean; error?: string; user?: User } => {
        if (!username.trim() || !password.trim() || !nome.trim()) {
            return { success: false, error: 'Preencha todos os campos' };
        }

        if (password.length < 6) {
            return { success: false, error: 'A senha deve ter no mínimo 6 caracteres' };
        }

        const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (exists) {
            return { success: false, error: 'Nome de usuário já existe' };
        }

        const now = new Date().toISOString();
        const newUser: User = {
            id: generateId(),
            username: username.trim().toLowerCase(),
            password: simpleHash(password),
            nome: nome.trim(),
            role,
            ativo: true,
            created_at: now,
            updated_at: now
        };

        setUsers(prev => [...prev, newUser]);
        return { success: true, user: newUser };
    };

    const updateUser = (
        id: string,
        nome: string,
        role: UserRole,
        ativo: boolean,
        newPassword?: string
    ): { success: boolean; error?: string } => {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Não permite desativar o próprio usuário admin logado
        if (authState.user?.id === id && !ativo) {
            return { success: false, error: 'Você não pode desativar seu próprio usuário' };
        }

        if (newPassword && newPassword.length < 6) {
            return { success: false, error: 'A senha deve ter no mínimo 6 caracteres' };
        }

        const updated: User = {
            ...users[userIndex],
            nome: nome.trim(),
            role,
            ativo,
            updated_at: new Date().toISOString()
        };

        if (newPassword) {
            updated.password = simpleHash(newPassword);
        }

        setUsers(prev => prev.map(u => u.id === id ? updated : u));

        // Atualiza o usuário logado se for o mesmo
        if (authState.user?.id === id) {
            setAuthState(prev => ({ ...prev, user: updated }));
        }

        return { success: true };
    };

    const deleteUser = (id: string): { success: boolean; error?: string } => {
        const user = users.find(u => u.id === id);
        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Não permite excluir o próprio usuário
        if (authState.user?.id === id) {
            return { success: false, error: 'Você não pode excluir seu próprio usuário' };
        }

        // Não permite excluir o admin padrão
        if (user.username === 'admin') {
            return { success: false, error: 'O usuário admin padrão não pode ser excluído' };
        }

        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
    };

    return (
        <AuthContext.Provider value={{
            authState,
            login,
            logout,
            users,
            addUser,
            updateUser,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
}
