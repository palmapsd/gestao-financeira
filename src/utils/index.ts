/* 
 * Funções utilitárias do Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:52
 * @version 1.1.0
 */

import type { PeriodCalculation, ValidationResult, ProductionFormData, ProductionType } from '../types';
export { Logger, logger } from './logger';
export type { LogEntry, LogLevel } from './logger';

// Lista de tipos de produção válidos
export const PRODUCTION_TYPES: ProductionType[] = ['Feed', 'Story', 'Reels', 'Vídeo', 'Logo', 'Outro'];

// Formata valor para moeda BRL
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Formata data para exibição
export function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Retorna data atual no formato ISO (YYYY-MM-DD)
export function getTodayISO(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Verifica se a data é hoje
export function isToday(dateString: string): boolean {
    return dateString === getTodayISO();
}

// Calcula período 21 → 20 baseado na data da produção
export function calculatePeriod(dateString: string): PeriodCalculation {
    const date = new Date(dateString + 'T12:00:00');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    let startDate: Date;
    let endDate: Date;

    if (day >= 21) {
        // Dia >= 21: período vai do dia 21 do mês atual ao dia 20 do mês seguinte
        startDate = new Date(year, month, 21);
        endDate = new Date(year, month + 1, 20);
    } else {
        // Dia <= 20: período vai do dia 21 do mês anterior ao dia 20 do mês atual
        startDate = new Date(year, month - 1, 21);
        endDate = new Date(year, month, 20);
    }

    const formatDateBR = (d: Date) => {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const toISO = (d: Date) => {
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    return {
        data_inicio: toISO(startDate),
        data_fim: toISO(endDate),
        nome_periodo: `${formatDateBR(startDate)} a ${formatDateBR(endDate)}`
    };
}

// Valida formulário de produção
export function validateProductionForm(data: ProductionFormData): ValidationResult {
    const errors: string[] = [];

    if (!data.data) {
        errors.push('Data é obrigatória');
    }

    if (!data.cliente_id) {
        errors.push('Cliente é obrigatório');
    }

    if (!data.tipo) {
        errors.push('Tipo de produção é obrigatório');
    }

    if (!data.nome_producao.trim()) {
        errors.push('Nome da produção é obrigatório');
    }

    if (data.quantidade === '' || Number(data.quantidade) < 1) {
        errors.push('Quantidade deve ser pelo menos 1');
    }

    if (data.valor_unitario === '' || Number(data.valor_unitario) <= 0) {
        errors.push('Valor unitário deve ser maior que zero');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Calcula total da produção
export function calculateTotal(quantidade: number, valorUnitario: number): number {
    return quantidade * valorUnitario;
}

// Gera ID único
export function generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

// Agrupa produções por tipo
export function groupByType(productions: { tipo: ProductionType; total: number; quantidade: number }[]): Record<ProductionType, { quantidade: number; total: number }> {
    const groups: Record<ProductionType, { quantidade: number; total: number }> = {
        'Feed': { quantidade: 0, total: 0 },
        'Story': { quantidade: 0, total: 0 },
        'Reels': { quantidade: 0, total: 0 },
        'Vídeo': { quantidade: 0, total: 0 },
        'Logo': { quantidade: 0, total: 0 },
        'Outro': { quantidade: 0, total: 0 }
    };

    productions.forEach(p => {
        groups[p.tipo].total += p.total;
        groups[p.tipo].quantidade += p.quantidade;
    });

    return groups;
}

// Debounce para otimização de performance
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

