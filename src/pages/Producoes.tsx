/* 
 * Página Lista de Produções (Tela 2) - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:30
 * @version 1.4.0
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Filter,
    Copy,
    Trash2,
    Edit,
    FileText,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store';
import type { ProductionFilters, Production } from '../types';
import { PRODUCTION_TYPES, formatCurrency, formatDate } from '../utils';
import {
    PageHeader,
    Button,
    Select,
    Card,
    StatusBadge,
    Modal,
    Alert,
    EmptyState
} from '../components/ui';

export function Producoes() {
    const {
        state,
        getProjectsByClient,
        canEditProduction,
        deleteProduction,
        duplicateProduction,
        getClientById,
        getProjectById
    } = useStore();

    const { isAdmin } = useAuth();

    // Filtros
    const [filters, setFilters] = useState<ProductionFilters>({
        cliente_id: '',
        projeto_id: '',
        tipo: '',
        periodo_id: '',
        status: ''
    });

    const [deleteModal, setDeleteModal] = useState<Production | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const allClients = state.clients;
    const projects = filters.cliente_id ? getProjectsByClient(filters.cliente_id) : [];
    const periods = state.periods;

    // Filtra produções
    const filteredProductions = useMemo(() => {
        return state.productions
            .filter(p => {
                if (filters.cliente_id && p.cliente_id !== filters.cliente_id) return false;
                if (filters.projeto_id && p.projeto_id !== filters.projeto_id) return false;
                if (filters.tipo && p.tipo !== filters.tipo) return false;
                if (filters.periodo_id && p.periodo_id !== filters.periodo_id) return false;
                if (filters.status && p.status !== filters.status) return false;
                return true;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [state.productions, filters]);

    // Total filtrado
    const totalFiltered = filteredProductions.reduce((sum, p) => sum + p.total, 0);

    // Handlers
    const handleDelete = async (prod: Production) => {
        const result = await deleteProduction(prod.id);
        if (result.success) {
            setAlert({ type: 'success', message: 'Produção excluída com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao excluir' });
        }
        setDeleteModal(null);
    };

    const handleDuplicate = async (prod: Production) => {
        const result = await duplicateProduction(prod.id);
        if (result.success) {
            setAlert({ type: 'success', message: 'Produção duplicada com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao duplicar' });
        }
    };

    const clearFilters = () => {
        setFilters({
            cliente_id: '',
            projeto_id: '',
            tipo: '',
            periodo_id: '',
            status: ''
        });
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Produções"
                subtitle={`${filteredProductions.length} produção(ões) encontrada(s)`}
                actions={
                    isAdmin ? (
                        <Link to="/nova-producao">
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Nova Produção
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            {/* Alert */}
            {alert && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            {/* Filtros */}
            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-primary-400" />
                    <span className="font-semibold text-white">Filtros</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <Select
                        label="Cliente"
                        value={filters.cliente_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, cliente_id: e.target.value, projeto_id: '' }))}
                        options={allClients.map(c => ({ value: c.id, label: c.nome }))}
                        placeholder="Todos"
                    />

                    <Select
                        label="Projeto"
                        value={filters.projeto_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, projeto_id: e.target.value }))}
                        options={projects.map(p => ({ value: p.id, label: p.nome }))}
                        placeholder="Todos"
                        disabled={!filters.cliente_id}
                    />

                    <Select
                        label="Tipo"
                        value={filters.tipo}
                        onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value as typeof filters.tipo }))}
                        options={PRODUCTION_TYPES.map(t => ({ value: t, label: t }))}
                        placeholder="Todos"
                    />

                    <Select
                        label="Período"
                        value={filters.periodo_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, periodo_id: e.target.value }))}
                        options={periods.map(p => ({ value: p.id, label: p.nome_periodo }))}
                        placeholder="Todos"
                    />

                    <Select
                        label="Status"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as typeof filters.status }))}
                        options={[
                            { value: 'Aberto', label: 'Aberto' },
                            { value: 'Fechado', label: 'Fechado' }
                        ]}
                        placeholder="Todos"
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="secondary" onClick={clearFilters}>
                        Limpar Filtros
                    </Button>
                </div>
            </Card>

            {/* Tabela */}
            {filteredProductions.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<FileText className="w-16 h-16" />}
                        title="Nenhuma produção encontrada"
                        description="Ainda não há produções registradas ou os filtros não retornaram resultados."
                        action={
                            isAdmin ? (
                                <Link to="/nova-producao">
                                    <Button icon={<Plus className="w-4 h-4" />}>
                                        Lançar Produção
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                </Card>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Projeto</th>
                                    <th>Tipo</th>
                                    <th>Produção</th>
                                    <th className="text-right">Qtd</th>
                                    <th className="text-right">Valor Unit.</th>
                                    <th className="text-right">Total</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProductions.map(prod => {
                                    const client = getClientById(prod.cliente_id);
                                    const project = prod.projeto_id ? getProjectById(prod.projeto_id) : null;
                                    const canEdit = canEditProduction(prod);

                                    return (
                                        <tr key={prod.id}>
                                            <td className="whitespace-nowrap">{formatDate(prod.data)}</td>
                                            <td>{client?.nome || '-'}</td>
                                            <td>{project?.nome || '-'}</td>
                                            <td>
                                                <span className="px-2 py-1 rounded-lg bg-slate-700 text-xs font-medium">
                                                    {prod.tipo}
                                                </span>
                                            </td>
                                            <td className="max-w-[200px] truncate" title={prod.nome_producao}>
                                                {prod.nome_producao}
                                            </td>
                                            <td className="text-right">{prod.quantidade}</td>
                                            <td className="text-right">{formatCurrency(prod.valor_unitario)}</td>
                                            <td className="text-right font-semibold text-green-400">
                                                {formatCurrency(prod.total)}
                                            </td>
                                            <td>
                                                <StatusBadge status={prod.status} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    {isAdmin && canEdit && prod.status === 'Aberto' && (
                                                        <>
                                                            <Link
                                                                to={`/editar-producao/${prod.id}`}
                                                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit className="w-4 h-4 text-slate-400 hover:text-primary-400" />
                                                            </Link>
                                                            <button
                                                                onClick={() => setDeleteModal(prod)}
                                                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {isAdmin && prod.status === 'Aberto' && (
                                                        <button
                                                            onClick={() => handleDuplicate(prod)}
                                                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                                            title="Duplicar"
                                                        >
                                                            <Copy className="w-4 h-4 text-slate-400 hover:text-green-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer com total */}
                    <div className="p-4 border-t border-white/10 bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">
                                Mostrando {filteredProductions.length} de {state.productions.length} produções
                            </span>
                            <div className="text-right">
                                <span className="text-slate-400 text-sm">Total Filtrado:</span>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalFiltered)}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Modal de confirmação de exclusão */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title="Confirmar Exclusão"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={() => deleteModal && handleDelete(deleteModal)}>
                            Excluir
                        </Button>
                    </>
                }
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-red-500/20">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-slate-300">
                            Tem certeza que deseja excluir a produção:
                        </p>
                        <p className="font-semibold text-white mt-2">
                            "{deleteModal?.nome_producao}"?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Esta ação não pode ser desfeita.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
