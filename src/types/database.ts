/* 
 * Tipos do Database Supabase - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:55
 * @version 1.3.0
 */

export type UserRole = 'admin' | 'viewer';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    nome: string
                    cliente_id: string | null
                    role: UserRole
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    nome: string
                    cliente_id?: string | null
                    role?: UserRole
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    cliente_id?: string | null
                    role?: UserRole
                    ativo?: boolean
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    nome: string
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    nome?: string
                    ativo?: boolean
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    nome: string
                    cliente_id: string
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    cliente_id: string
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    nome?: string
                    cliente_id?: string
                    ativo?: boolean
                    updated_at?: string
                }
            }
            periods: {
                Row: {
                    id: string
                    cliente_id: string
                    data_inicio: string
                    data_fim: string
                    nome_periodo: string
                    status: 'Aberto' | 'Fechado'
                    total_periodo: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    cliente_id: string
                    data_inicio: string
                    data_fim: string
                    nome_periodo: string
                    status?: 'Aberto' | 'Fechado'
                    total_periodo?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    cliente_id?: string
                    data_inicio?: string
                    data_fim?: string
                    nome_periodo?: string
                    status?: 'Aberto' | 'Fechado'
                    total_periodo?: number
                    updated_at?: string
                }
            }
            productions: {
                Row: {
                    id: string
                    data: string
                    cliente_id: string
                    projeto_id: string | null
                    tipo: 'Feed' | 'Story' | 'Reels' | 'Vídeo' | 'Logo' | 'Outro'
                    nome_producao: string
                    quantidade: number
                    valor_unitario: number
                    total: number
                    periodo_id: string
                    status: 'Aberto' | 'Fechado'
                    observacoes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    data: string
                    cliente_id: string
                    projeto_id?: string | null
                    tipo: 'Feed' | 'Story' | 'Reels' | 'Vídeo' | 'Logo' | 'Outro'
                    nome_producao: string
                    quantidade: number
                    valor_unitario: number
                    total: number
                    periodo_id: string
                    status?: 'Aberto' | 'Fechado'
                    observacoes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    data?: string
                    cliente_id?: string
                    projeto_id?: string | null
                    tipo?: 'Feed' | 'Story' | 'Reels' | 'Vídeo' | 'Logo' | 'Outro'
                    nome_producao?: string
                    quantidade?: number
                    valor_unitario?: number
                    total?: number
                    periodo_id?: string
                    status?: 'Aberto' | 'Fechado'
                    observacoes?: string | null
                    updated_at?: string
                }
            }
        }
    }
}

// Tipos convenientes
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Period = Database['public']['Tables']['periods']['Row'];
export type Production = Database['public']['Tables']['productions']['Row'];
