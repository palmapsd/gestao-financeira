/* 
 * Tipos de Autenticação - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    username: string;
    password: string; // Hash simples para localStorage
    nome: string;
    role: UserRole;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthContextType {
    authState: AuthState;
    login: (credentials: LoginCredentials) => { success: boolean; error?: string };
    logout: () => void;
    users: User[];
    addUser: (username: string, password: string, nome: string, role: UserRole) => { success: boolean; error?: string; user?: User };
    updateUser: (id: string, nome: string, role: UserRole, ativo: boolean, newPassword?: string) => { success: boolean; error?: string };
    deleteUser: (id: string) => { success: boolean; error?: string };
}
