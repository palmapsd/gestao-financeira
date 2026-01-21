/* 
 * Context/Store do Sistema Palma.PSD
 * @author Starmannweb (https://starmannweb.com.br)
 * @date 2026-01-21 19:30
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
    Client, Project, Production, Period, StoreData,
    ProductionFormData, Status, ValidationResult
} from '../types';
import {
    calculatePeriod, calculateTotal, validateProductionForm,
    generateId, getTodayISO, isToday, logger
} from '../utils';

// Versão atual do sistema
const STORE_VERSION = '1.0.0';
const STORAGE_KEY = 'palma_psd_data';

// Estado inicial
const initialState: StoreData = {
    clients: [],
    projects: [],
    productions: [],
    periods: [],
    version: STORE_VERSION
};

// Tipos de ações
type Action =
    | { type: 'LOAD_DATA'; payload: StoreData }
    | { type: 'ADD_CLIENT'; payload: Client }
    | { type: 'UPDATE_CLIENT'; payload: Client }
    | { type: 'DELETE_CLIENT'; payload: string }
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'ADD_PRODUCTION'; payload: Production }
    | { type: 'UPDATE_PRODUCTION'; payload: Production }
    | { type: 'DELETE_PRODUCTION'; payload: string }
    | { type: 'ADD_PERIOD'; payload: Period }
    | { type: 'UPDATE_PERIOD'; payload: Period }
    | { type: 'CLOSE_PERIOD'; payload: string }
    | { type: 'RECALCULATE_PERIOD_TOTAL'; payload: string };

// Reducer principal
function storeReducer(state: StoreData, action: Action): StoreData {
    switch (action.type) {
        case 'LOAD_DATA':
            return { ...action.payload, version: STORE_VERSION };

        case 'ADD_CLIENT':
            return { ...state, clients: [...state.clients, action.payload] };

        case 'UPDATE_CLIENT':
            return {
                ...state,
                clients: state.clients.map(c =>
                    c.id === action.payload.id ? action.payload : c
                )
            };

        case 'DELETE_CLIENT':
            return {
                ...state,
                clients: state.clients.filter(c => c.id !== action.payload)
            };

        case 'ADD_PROJECT':
            return { ...state, projects: [...state.projects, action.payload] };

        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: state.projects.map(p =>
                    p.id === action.payload.id ? action.payload : p
                )
            };

        case 'DELETE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter(p => p.id !== action.payload)
            };

        case 'ADD_PRODUCTION':
            return { ...state, productions: [...state.productions, action.payload] };

        case 'UPDATE_PRODUCTION':
            return {
                ...state,
                productions: state.productions.map(p =>
                    p.id === action.payload.id ? action.payload : p
                )
            };

        case 'DELETE_PRODUCTION':
            return {
                ...state,
                productions: state.productions.filter(p => p.id !== action.payload)
            };

        case 'ADD_PERIOD':
            return { ...state, periods: [...state.periods, action.payload] };

        case 'UPDATE_PERIOD':
            return {
                ...state,
                periods: state.periods.map(p =>
                    p.id === action.payload.id ? action.payload : p
                )
            };

        case 'CLOSE_PERIOD': {
            const periodId = action.payload;
            return {
                ...state,
                periods: state.periods.map(p =>
                    p.id === periodId ? { ...p, status: 'Fechado' as Status, updated_at: new Date().toISOString() } : p
                ),
                productions: state.productions.map(prod =>
                    prod.periodo_id === periodId ? { ...prod, status: 'Fechado' as Status, updated_at: new Date().toISOString() } : prod
                )
            };
        }

        case 'RECALCULATE_PERIOD_TOTAL': {
            const periodId = action.payload;
            const total = state.productions
                .filter(p => p.periodo_id === periodId)
                .reduce((sum, p) => sum + p.total, 0);
            return {
                ...state,
                periods: state.periods.map(p =>
                    p.id === periodId ? { ...p, total_periodo: total, updated_at: new Date().toISOString() } : p
                )
            };
        }

        default:
            return state;
    }
}

// Interface do contexto
interface StoreContextType {
    state: StoreData;

    // Clientes
    addClient: (nome: string) => Client;
    updateClient: (id: string, nome: string, ativo: boolean) => void;
    deleteClient: (id: string) => boolean;
    getActiveClients: () => Client[];

    // Projetos
    addProject: (nome: string, clienteId: string) => Project;
    updateProject: (id: string, nome: string, ativo: boolean) => void;
    deleteProject: (id: string) => boolean;
    getProjectsByClient: (clienteId: string) => Project[];

    // Produções
    addProduction: (formData: ProductionFormData) => { success: boolean; errors: string[]; production?: Production };
    updateProduction: (id: string, formData: ProductionFormData) => { success: boolean; errors: string[] };
    deleteProduction: (id: string) => { success: boolean; error?: string };
    duplicateProduction: (id: string) => { success: boolean; production?: Production; error?: string };
    canEditProduction: (production: Production) => boolean;

    // Períodos
    getOpenPeriodsByClient: (clienteId: string) => Period[];
    getProductionsByPeriod: (periodId: string) => Production[];
    closePeriod: (periodId: string) => { success: boolean; error?: string };

    // Utilitários
    getClientById: (id: string) => Client | undefined;
    getProjectById: (id: string) => Project | undefined;
    getPeriodById: (id: string) => Period | undefined;
}

// Criação do contexto
const StoreContext = createContext<StoreContextType | null>(null);

// Provider
export function StoreProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(storeReducer, initialState);

    // Carrega dados do localStorage na inicialização
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData) as StoreData;
                logger.info('Dados carregados do localStorage', {
                    clients: parsed.clients.length,
                    productions: parsed.productions.length
                });
                dispatch({ type: 'LOAD_DATA', payload: parsed });
            }
        } catch (error) {
            logger.error('Erro ao carregar dados do localStorage', error);
        }
    }, []);

    // Salva dados no localStorage sempre que mudar
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            logger.info('Dados salvos no localStorage');
        } catch (error) {
            logger.error('Erro ao salvar dados no localStorage', error);
        }
    }, [state]);

    // === CLIENTES ===
    const addClient = (nome: string): Client => {
        const now = new Date().toISOString();
        const client: Client = {
            id: generateId(),
            nome: nome.trim(),
            ativo: true,
            created_at: now,
            updated_at: now
        };
        dispatch({ type: 'ADD_CLIENT', payload: client });
        logger.info('Cliente adicionado', client);
        return client;
    };

    const updateClient = (id: string, nome: string, ativo: boolean) => {
        const existing = state.clients.find(c => c.id === id);
        if (existing) {
            const updated: Client = {
                ...existing,
                nome: nome.trim(),
                ativo,
                updated_at: new Date().toISOString()
            };
            dispatch({ type: 'UPDATE_CLIENT', payload: updated });
        }
    };

    const deleteClient = (id: string): boolean => {
        const hasProductions = state.productions.some(p => p.cliente_id === id);
        if (hasProductions) {
            logger.warn('Tentativa de excluir cliente com produções', { id });
            return false;
        }
        dispatch({ type: 'DELETE_CLIENT', payload: id });
        return true;
    };

    const getActiveClients = (): Client[] => {
        return state.clients.filter(c => c.ativo);
    };

    // === PROJETOS ===
    const addProject = (nome: string, clienteId: string): Project => {
        const now = new Date().toISOString();
        const project: Project = {
            id: generateId(),
            nome: nome.trim(),
            cliente_id: clienteId,
            ativo: true,
            created_at: now,
            updated_at: now
        };
        dispatch({ type: 'ADD_PROJECT', payload: project });
        return project;
    };

    const updateProject = (id: string, nome: string, ativo: boolean) => {
        const existing = state.projects.find(p => p.id === id);
        if (existing) {
            const updated: Project = {
                ...existing,
                nome: nome.trim(),
                ativo,
                updated_at: new Date().toISOString()
            };
            dispatch({ type: 'UPDATE_PROJECT', payload: updated });
        }
    };

    const deleteProject = (id: string): boolean => {
        const hasProductions = state.productions.some(p => p.projeto_id === id);
        if (hasProductions) {
            return false;
        }
        dispatch({ type: 'DELETE_PROJECT', payload: id });
        return true;
    };

    const getProjectsByClient = (clienteId: string): Project[] => {
        return state.projects.filter(p => p.cliente_id === clienteId && p.ativo);
    };

    // === PRODUÇÕES ===

    // Encontra ou cria período baseado na data
    const findOrCreatePeriod = (clienteId: string, data: string): Period => {
        const periodCalc = calculatePeriod(data);

        // Busca período existente
        let period = state.periods.find(p =>
            p.cliente_id === clienteId &&
            p.data_inicio === periodCalc.data_inicio &&
            p.data_fim === periodCalc.data_fim
        );

        if (!period) {
            // Cria novo período
            const now = new Date().toISOString();
            period = {
                id: generateId(),
                cliente_id: clienteId,
                data_inicio: periodCalc.data_inicio,
                data_fim: periodCalc.data_fim,
                nome_periodo: periodCalc.nome_periodo,
                status: 'Aberto',
                total_periodo: 0,
                created_at: now,
                updated_at: now
            };
            dispatch({ type: 'ADD_PERIOD', payload: period });
            logger.info('Período criado automaticamente', period);
        }

        return period;
    };

    const addProduction = (formData: ProductionFormData): { success: boolean; errors: string[]; production?: Production } => {
        // Validação
        const validation = validateProductionForm(formData);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        // Encontra ou cria período
        const period = findOrCreatePeriod(formData.cliente_id, formData.data);

        // Verifica se período está fechado
        if (period.status === 'Fechado') {
            return {
                success: false,
                errors: ['Não é possível adicionar produções a um período fechado']
            };
        }

        const now = new Date().toISOString();
        const quantidade = Number(formData.quantidade);
        const valorUnitario = Number(formData.valor_unitario);

        const production: Production = {
            id: generateId(),
            data: formData.data,
            cliente_id: formData.cliente_id,
            projeto_id: formData.projeto_id || undefined,
            tipo: formData.tipo as Production['tipo'],
            nome_producao: formData.nome_producao.trim(),
            quantidade,
            valor_unitario: valorUnitario,
            total: calculateTotal(quantidade, valorUnitario),
            periodo_id: period.id,
            status: 'Aberto',
            observacoes: formData.observacoes?.trim() || undefined,
            created_at: now,
            updated_at: now
        };

        dispatch({ type: 'ADD_PRODUCTION', payload: production });

        // Recalcula total do período
        setTimeout(() => {
            dispatch({ type: 'RECALCULATE_PERIOD_TOTAL', payload: period.id });
        }, 0);

        logger.info('Produção adicionada', production);
        return { success: true, errors: [], production };
    };

    const canEditProduction = (production: Production): boolean => {
        // Regra 4: só pode editar no mesmo dia da criação
        if (production.status === 'Fechado') return false;

        const createdDate = production.created_at.split('T')[0];
        return isToday(createdDate);
    };

    const updateProduction = (id: string, formData: ProductionFormData): { success: boolean; errors: string[] } => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, errors: ['Produção não encontrada'] };
        }

        // Verifica se pode editar
        if (!canEditProduction(existing)) {
            return { success: false, errors: ['Edição bloqueada. Produções só podem ser editadas no mesmo dia da criação.'] };
        }

        // Validação
        const validation = validateProductionForm(formData);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        const quantidade = Number(formData.quantidade);
        const valorUnitario = Number(formData.valor_unitario);

        const updated: Production = {
            ...existing,
            data: formData.data,
            cliente_id: formData.cliente_id,
            projeto_id: formData.projeto_id || undefined,
            tipo: formData.tipo as Production['tipo'],
            nome_producao: formData.nome_producao.trim(),
            quantidade,
            valor_unitario: valorUnitario,
            total: calculateTotal(quantidade, valorUnitario),
            observacoes: formData.observacoes?.trim() || undefined,
            updated_at: new Date().toISOString()
        };

        dispatch({ type: 'UPDATE_PRODUCTION', payload: updated });
        dispatch({ type: 'RECALCULATE_PERIOD_TOTAL', payload: existing.periodo_id });

        return { success: true, errors: [] };
    };

    const deleteProduction = (id: string): { success: boolean; error?: string } => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, error: 'Produção não encontrada' };
        }

        if (existing.status === 'Fechado') {
            return { success: false, error: 'Não é possível excluir produções de um período fechado' };
        }

        if (!canEditProduction(existing)) {
            return { success: false, error: 'Exclusão bloqueada. Produções só podem ser excluídas no mesmo dia da criação.' };
        }

        const periodId = existing.periodo_id;
        dispatch({ type: 'DELETE_PRODUCTION', payload: id });

        setTimeout(() => {
            dispatch({ type: 'RECALCULATE_PERIOD_TOTAL', payload: periodId });
        }, 0);

        return { success: true };
    };

    const duplicateProduction = (id: string): { success: boolean; production?: Production; error?: string } => {
        const existing = state.productions.find(p => p.id === id);
        if (!existing) {
            return { success: false, error: 'Produção não encontrada' };
        }

        if (existing.status === 'Fechado') {
            return { success: false, error: 'Não é possível duplicar produções de um período fechado' };
        }

        const today = getTodayISO();
        const result = addProduction({
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

    const getProductionsByPeriod = (periodId: string): Production[] => {
        return state.productions.filter(p => p.periodo_id === periodId);
    };

    const closePeriod = (periodId: string): { success: boolean; error?: string } => {
        const period = state.periods.find(p => p.id === periodId);
        if (!period) {
            return { success: false, error: 'Período não encontrado' };
        }

        if (period.status === 'Fechado') {
            return { success: false, error: 'Período já está fechado' };
        }

        dispatch({ type: 'CLOSE_PERIOD', payload: periodId });
        logger.info('Período fechado', { periodId });

        return { success: true };
    };

    // === UTILITÁRIOS ===
    const getClientById = (id: string) => state.clients.find(c => c.id === id);
    const getProjectById = (id: string) => state.projects.find(p => p.id === id);
    const getPeriodById = (id: string) => state.periods.find(p => p.id === id);

    const contextValue: StoreContextType = {
        state,
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
        getProductionsByPeriod,
        closePeriod,
        getClientById,
        getProjectById,
        getPeriodById
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
}

// Hook para usar o store
export function useStore(): StoreContextType {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore deve ser usado dentro de StoreProvider');
    }
    return context;
}
