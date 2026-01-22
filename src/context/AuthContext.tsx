/* 
 * Contexto de Autenticação com Supabase - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:00
 * @version 1.3.0
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, logSupabaseError } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '../types/database';

export interface AuthState {
    isAuthenticated: boolean;
    user: SupabaseUser | null;
    profile: Profile | null;
    loading: boolean;
}

export interface AuthContextType {
    authState: AuthState;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, nome: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
    isAdmin: boolean;
    isViewer: boolean;
}

const initialAuthState: AuthState = {
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>(initialAuthState);

    // Carrega perfil do usuário
    const loadProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                logSupabaseError('loadProfile', error);
                return null;
            }

            return data;
        } catch (error) {
            logSupabaseError('loadProfile catch', error);
            return null;
        }
    };

    // Atualiza estado baseado na sessão
    const handleSession = async (session: Session | null) => {
        if (session?.user) {
            const profile = await loadProfile(session.user.id);
            setAuthState({
                isAuthenticated: true,
                user: session.user,
                profile,
                loading: false
            });
        } else {
            setAuthState({
                isAuthenticated: false,
                user: null,
                profile: null,
                loading: false
            });
        }
    };

    // Inicialização e listener de auth
    useEffect(() => {
        // Verifica sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session);
        });

        // Listener de mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth Event]', event);
                handleSession(session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Login
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                logSupabaseError('login', error);
                return { success: false, error: error.message };
            }

            if (data.user) {
                const profile = await loadProfile(data.user.id);
                if (profile && !profile.ativo) {
                    await supabase.auth.signOut();
                    return { success: false, error: 'Usuário desativado' };
                }
            }

            return { success: true };
        } catch (error) {
            logSupabaseError('login catch', error);
            return { success: false, error: 'Erro ao fazer login' };
        }
    };

    // Logout
    const logout = async () => {
        await supabase.auth.signOut();
    };

    // Cadastro (apenas admin pode criar com role admin)
    const signUp = async (
        email: string,
        password: string,
        nome: string,
        role: UserRole = 'viewer'
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nome,
                        role
                    }
                }
            });

            if (error) {
                logSupabaseError('signUp', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            logSupabaseError('signUp catch', error);
            return { success: false, error: 'Erro ao criar conta' };
        }
    };

    // Helpers
    const isAdmin = authState.profile?.role === 'admin';
    const isViewer = authState.profile?.role === 'viewer';

    return (
        <AuthContext.Provider value={{
            authState,
            login,
            logout,
            signUp,
            isAdmin,
            isViewer
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
