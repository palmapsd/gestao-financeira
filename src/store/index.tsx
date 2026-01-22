/* 
 * Context/Store do Sistema Palma.PSD com Supabase
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:10
 * @version 1.3.0
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, logSupabaseError } from '../lib/supabase';
import type { Client, Project, Production, Period } from '../types/database';
import type { ProductionFormData } from '../types';
import { calculatePeriod, calculateTotal, validateProductionForm } from '../utils';

interface StoreData {
    clients: Client[];
    projects: Project[];
    productions: Production[];
    periods: Period[];
    loading: boolean;
    error: string | null;
}

interface StoreContextType {
    state: StoreData;
    refreshData: () => Promise<void>;

    // Clientes
    addClient: (nome: string) => Promise<{ success: boolean; error?: string; client?: Client }>;
    updateClient: (id: string, nome: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>;
    deleteClient: (id: string) => Promise<{ success: boolean; error?: string }>;
    getActiveClients: () => Client[];

    // Projetos
    addProject: (nome: string, clienteId: string) => Promise<{ success: boolean; error?: string; project?: Project }>;
    updateProject: (id: string, nome: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>;
    deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
    getProjectsByClient: (clienteId: string) => Project[];

    // Produções
    addProduction: (formData: ProductionFormData) => Promise<{ success: boolean; errors: string[]; production?: Production }>;
    updateProduction: (id: string, formData: ProductionFormData) => Promise<{ success: boolean; errors: string[] }>;
    deleteProduction: (id: string) => Promise<{ success: boolean; error?: string }>;
    duplicateProduction: (id: string) => Promise<{ success: boolean; production?: Production; error?: string }>;
    canEditProduction: (production: Production) => boolean;

    // Períodos
    getOpenPeriodsByClient: (clienteId: string) => Period[];
    getAllPeriodsByClient: (clienteId: string) => Period[];
    getProductionsByPeriod: (periodId: string) => Production[];
    closePeriod: (periodId: string) => Promise<{ success: boolean; error?: string }>;

    // Utilitários
    getClientById: (id: string) => Client | undefined;
    getProjectById: (id: string) => Project | undefined;
    getPeriodById: (id: string) => Period | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<StoreData>({
        clients: [],
        projects: [],
        productions: [],
        periods: [],
        loading: true,
        error: null
    });

    // Carrega todos os dados
    const refreshData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const [clientsRes, projectsRes, periodsRes, productionsRes] = await Promise.all([
                supabase.from('clients').select('*').order('nome'),
                supabase.from('projects').select('*').order('nome'),
                supabase.from('periods').select('*').order('data_inicio', { ascending: false }),
                supabase.from('productions').select('*').order('data', { ascending: false })
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (projectsRes.error) throw projectsRes.error;
            if (periodsRes.error) throw periodsRes.error;
            if (productionsRes.error) throw productionsRes.error;

            setState({
                clients: clientsRes.data || [],
                projects: projectsRes.data || [],
                periods: periodsRes.data || [],
                productions: productionsRes.data || [],
                loading: false,
                error: null
            });
        } catch (error) {
            logSupabaseError('refreshData', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Erro ao carregar dados'
            }));
        }
    }, []);

    // Carrega dados na inicialização
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // === CLIENTES ===
    const addClient = async (nome: string): Promise<{ success: boolean; error?: string; client?: Client }> => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert({ nome: nome.trim() })
                .select()
                .single();

            if (error) {
                logSupabaseError('addClient', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({ ...prev, clients: [...prev.clients, data] }));
            return { success: true, client: data };
        } catch (error) {
            logSupabaseError('addClient catch', error);
            return { success: false, error: 'Erro ao criar cliente' };
        }
    };

    const updateClient = async (id: string, nome: string, ativo: boolean): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({ nome: nome.trim(), ativo, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                logSupabaseError('updateClient', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({
                ...prev,
                clients: prev.clients.map(c => c.id === id ? { ...c, nome: nome.trim(), ativo } : c)
            }));
            return { success: true };
        } catch (error) {
            logSupabaseError('updateClient catch', error);
            return { success: false, error: 'Erro ao atualizar cliente' };
        }
    };

    const deleteClient = async (id: string): Promise<{ success: boolean; error?: string }> => {
        const hasProductions = state.productions.some(p => p.cliente_id === id);
        if (hasProductions) {
            return { success: false, error: 'Cliente tem produções associadas' };
        }

        try {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) {
                logSupabaseError('deleteClient', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({
                ...prev,
                clients: prev.clients.filter(c => c.id !== id),
                projects: prev.projects.filter(p => p.cliente_id !== id)
            }));
            return { success: true };
        } catch (error) {
            logSupabaseError('deleteClient catch', error);
            return { success: false, error: 'Erro ao excluir cliente' };
        }
    };

    const getActiveClients = (): Client[] => state.clients.filter(c => c.ativo);

    // === PROJETOS ===
    const addProject = async (nome: string, clienteId: string): Promise<{ success: boolean; error?: string; project?: Project }> => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert({ nome: nome.trim(), cliente_id: clienteId })
                .select()
                .single();

            if (error) {
                logSupabaseError('addProject', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({ ...prev, projects: [...prev.projects, data] }));
            return { success: true, project: data };
        } catch (error) {
            logSupabaseError('addProject catch', error);
            return { success: false, error: 'Erro ao criar projeto' };
        }
    };

    const updateProject = async (id: string, nome: string, ativo: boolean): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('projects')
                .update({ nome: nome.trim(), ativo, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                logSupabaseError('updateProject', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({
                ...prev,
                projects: prev.projects.map(p => p.id === id ? { ...p, nome: nome.trim(), ativo } : p)
            }));
            return { success: true };
        } catch (error) {
            logSupabaseError('updateProject catch', error);
            return { success: false, error: 'Erro ao atualizar projeto' };
        }
    };

    const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
        const hasProductions = state.productions.some(p => p.projeto_id === id);
        if (hasProductions) {
            return { success: false, error: 'Projeto tem produções associadas' };
        }

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) {
                logSupabaseError('deleteProject', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
            return { success: true };
        } catch (error) {
            logSupabaseError('deleteProject catch', error);
            return { success: false, error: 'Erro ao excluir projeto' };
        }
    };

    const getProjectsByClient = (clienteId: string): Project[] => {
        return state.projects.filter(p => p.cliente_id === clienteId && p.ativo);
    };

    // === PRODUÇÕES ===
    const findOrCreatePeriod = async (clienteId: string, data: string): Promise<Period | null> => {
        const periodCalc = calculatePeriod(data);

        // Busca período existente localmente
        let period = state.periods.find(p =>
            p.cliente_id === clienteId &&
            p.data_inicio === periodCalc.data_inicio &&
            p.data_fim === periodCalc.data_fim
        );

        if (period) return period;

        // Cria novo período
        try {
            const { data: newPeriod, error } = await supabase
                .from('periods')
                .insert({
                    cliente_id: clienteId,
                    data_inicio: periodCalc.data_inicio,
                    data_fim: periodCalc.data_fim,
                    nome_periodo: periodCalc.nome_periodo,
                    status: 'Aberto',
                    total_periodo: 0
                })
                .select()
                .single();

            if (error) {
                logSupabaseError('findOrCreatePeriod', error);
                return null;
            }

            setState(prev => ({ ...prev, periods: [...prev.periods, newPeriod] }));
            return newPeriod;
        } catch (error) {
            logSupabaseError('findOrCreatePeriod catch', error);
            return null;
        }
    };

    const addProduction = async (formData: ProductionFormData): Promise<{ success: boolean; errors: string[]; production?: Production }> => {
        const validation = validateProductionForm(formData);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        const period = await findOrCreatePeriod(formData.cliente_id, formData.data);
        if (!period) {
            return { success: false, errors: ['Erro ao criar período'] };
        }

        if (period.status === 'Fechado') {
            return { success: false, errors: ['Período está fechado'] };
        }

        const quantidade = Number(formData.quantidade);
        const valorUnitario = Number(formData.valor_unitario);

        try {
            const { data, error } = await supabase
                .from('productions')
                .insert({
                    data: formData.data,
                    cliente_id: formData.cliente_id,
                    projeto_id: formData.projeto_id || null,
                    tipo: formData.tipo,
                    nome_producao: formData.nome_producao.trim(),
                    quantidade,
                    valor_unitario: valorUnitario,
                    total: calculateTotal(quantidade, valorUnitario),
                    periodo_id: period.id,
                    status: 'Aberto',
                    observacoes: formData.observacoes?.trim() || null
                })
                .select()
                .single();

            if (error) {
                logSupabaseError('addProduction', error);
                return { success: false, errors: [error.message] };
            }

            setState(prev => ({ ...prev, productions: [data, ...prev.productions] }));

            // Refresh para atualizar totais dos períodos (trigger no banco faz isso)
            setTimeout(() => refreshData(), 500);

            return { success: true, errors: [], production: data };
        } catch (error) {
            logSupabaseError('addProduction catch', error);
            return { success: false, errors: ['Erro ao criar produção'] };
        }
    };

    const canEditProduction = (production: Production): boolean => {
        if (production.status === 'Fechado') return false;
        const createdDate = production.created_at.split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return createdDate === today;
    };

    const updateProduction = async (id: string, formData: ProductionFormData): Promise<{ success: boolean; errors: string[] }> => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, errors: ['Produção não encontrada'] };
        }

        if (!canEditProduction(existing)) {
            return { success: false, errors: ['Edição bloqueada. Só pode editar no mesmo dia.'] };
        }

        const validation = validateProductionForm(formData);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        const quantidade = Number(formData.quantidade);
        const valorUnitario = Number(formData.valor_unitario);

        try {
            const { error } = await supabase
                .from('productions')
                .update({
                    data: formData.data,
                    cliente_id: formData.cliente_id,
                    projeto_id: formData.projeto_id || null,
                    tipo: formData.tipo,
                    nome_producao: formData.nome_producao.trim(),
                    quantidade,
                    valor_unitario: valorUnitario,
                    total: calculateTotal(quantidade, valorUnitario),
                    observacoes: formData.observacoes?.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                logSupabaseError('updateProduction', error);
                return { success: false, errors: [error.message] };
            }

            await refreshData();
            return { success: true, errors: [] };
        } catch (error) {
            logSupabaseError('updateProduction catch', error);
            return { success: false, errors: ['Erro ao atualizar produção'] };
        }
    };

    const deleteProduction = async (id: string): Promise<{ success: boolean; error?: string }> => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, error: 'Produção não encontrada' };
        }

        if (existing.status === 'Fechado') {
            return { success: false, error: 'Não pode excluir produção de período fechado' };
        }

        if (!canEditProduction(existing)) {
            return { success: false, error: 'Exclusão bloqueada. Só pode excluir no mesmo dia.' };
        }

        try {
            const { error } = await supabase.from('productions').delete().eq('id', id);
            if (error) {
                logSupabaseError('deleteProduction', error);
                return { success: false, error: error.message };
            }

            setState(prev => ({
                ...prev,
                productions: prev.productions.filter(p => p.id !== id)
            }));

            setTimeout(() => refreshData(), 500);
            return { success: true };
        } catch (error) {
            logSupabaseError('deleteProduction catch', error);
            return { success: false, error: 'Erro ao excluir produção' };
        }
    };

    const duplicateProduction = async (id: string): Promise<{ success: boolean; production?: Production; error?: string }> => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, error: 'Produção não encontrada' };
        }

        if (existing.status === 'Fechado') {
            return { success: false, error: 'Não pode duplicar produção de período fechado' };
        }

        const today = new Date().toISOString().split('T')[0];
        const result = await addProduction({
            data: today,
            cliente_id: existing.cliente_id,
            projeto_id: existing.projeto_id || '',
            tipo: existing.tipo,
            nome_producao: existing.nome_producao,
            quantidade: existing.quantidade,
            valor_unitario: existing.valor_unitario,
            observacoes: existing.observacoes || ''
        });

        if (result.success) {
            return { success: true, production: result.production };
        }
        return { success: false, error: result.errors.join(', ') };
    };

    // === PERÍODOS ===
    const getOpenPeriodsByClient = (clienteId: string): Period[] => {
        return state.periods.filter(p => p.cliente_id === clienteId && p.status === 'Aberto');
    };

    const getAllPeriodsByClient = (clienteId: string): Period[] => {
        return state.periods
            .filter(p => p.cliente_id === clienteId)
            .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
    };

    const getProductionsByPeriod = (periodId: string): Production[] => {
        return state.productions.filter(p => p.periodo_id === periodId);
    };

    const closePeriod = async (periodId: string): Promise<{ success: boolean; error?: string }> => {
        const period = state.periods.find(p => p.id === periodId);
        if (!period) {
            return { success: false, error: 'Período não encontrado' };
        }

        if (period.status === 'Fechado') {
            return { success: false, error: 'Período já está fechado' };
        }

        try {
            // Atualiza período
            const { error: periodError } = await supabase
                .from('periods')
                .update({ status: 'Fechado', updated_at: new Date().toISOString() })
                .eq('id', periodId);

            if (periodError) {
                logSupabaseError('closePeriod period', periodError);
                return { success: false, error: periodError.message };
            }

            // Atualiza produções do período
            const { error: prodError } = await supabase
                .from('productions')
                .update({ status: 'Fechado', updated_at: new Date().toISOString() })
                .eq('periodo_id', periodId);

            if (prodError) {
                logSupabaseError('closePeriod productions', prodError);
            }

            await refreshData();
            return { success: true };
        } catch (error) {
            logSupabaseError('closePeriod catch', error);
            return { success: false, error: 'Erro ao fechar período' };
        }
    };

    // === UTILITÁRIOS ===
    const getClientById = (id: string) => state.clients.find(c => c.id === id);
    const getProjectById = (id: string) => state.projects.find(p => p.id === id);
    const getPeriodById = (id: string) => state.periods.find(p => p.id === id);

    return (
        <StoreContext.Provider value={{
            state,
            refreshData,
            addClient,
            updateClient,
            deleteClient,
            getActiveClients,
            addProject,
            updateProject,
            deleteProject,
            getProjectsByClient,
            addProduction,
            updateProduction,
            deleteProduction,
            duplicateProduction,
            canEditProduction,
            getOpenPeriodsByClient,
            getAllPeriodsByClient,
            getProductionsByPeriod,
            closePeriod,
            getClientById,
            getProjectById,
            getPeriodById
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore(): StoreContextType {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore deve ser usado dentro de StoreProvider');
    }
    return context;
}
