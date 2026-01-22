/* 
 * Types/Interfaces do Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 21:01
 * @version 1.1.0
 */

// Tipos de produção permitidos
export type ProductionType = 'Feed' | 'Story' | 'Reels' | 'Vídeo' | 'Logo' | 'Outro';

// Status de período e produção
export type Status = 'Aberto' | 'Fechado';

// Interface do Cliente
export interface Client {
    id: string;
    nome: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

// Interface do Projeto
export interface Project {
    id: string;
    nome: string;
    cliente_id: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

// Interface do Período (21 → 20)
export interface Period {
    id: string;
    cliente_id: string;
    data_inicio: string; // ISO date string
    data_fim: string;    // ISO date string
    nome_periodo: string;
    status: Status;
    total_periodo: number;
    created_at: string;
    updated_at: string;
}

// Interface da Produção
export interface Production {
    id: string;
    data: string;        // ISO date string  
    cliente_id: string;
    projeto_id?: string; // opcional
    tipo: ProductionType;
    nome_producao: string;
    quantidade: number;
    valor_unitario: number;
    total: number;       // calculado: quantidade * valor_unitario
    periodo_id: string;  // automático
    status: Status;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

// Interface para formulário de nova produção
export interface ProductionFormData {
    data: string;
    cliente_id: string;
    projeto_id: string;
    tipo: ProductionType | '';
    nome_producao: string;
    quantidade: number | '';
    valor_unitario: number | '';
    observacoes: string;
}

// Interface para filtros da listagem
export interface ProductionFilters {
    cliente_id: string;
    projeto_id: string;
    tipo: ProductionType | '';
    periodo_id: string;
    status: Status | '';
}

// Dados do Store
export interface StoreData {
    clients: Client[];
    projects: Project[];
    productions: Production[];
    periods: Period[];
    version: string;
}

// Resultado de validação
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// Resultado do cálculo de período
export interface PeriodCalculation {
    data_inicio: string;
    data_fim: string;
    nome_periodo: string;
}
