/* 
 * Página Editar Produção - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:49
 * @version 1.1.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { ProductionFormData, ProductionType } from '../types';
import { PRODUCTION_TYPES, formatCurrency, calculatePeriod } from '../utils';
import {
    Card,
    PageHeader,
    Input,
    Select,
    Textarea,
    Button,
    Alert,
    EmptyState
} from '../components/ui';

export function EditarProducao() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { 
        state, 
        getActiveClients, 
        getProjectsByClient, 
        updateProduction,
        canEditProduction,
        getClientById,
        getPeriodById
    } = useStore();

    const [formData, setFormData] = useState<ProductionFormData>({
        data: '',
        cliente_id: '',
        projeto_id: '',
        tipo: '',
        nome_producao: '',
        quantidade: 1,
        valor_unitario: '',
        observacoes: ''
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [blocked, setBlocked] = useState(false);

    const production = state.productions.find(p => p.id === id);
    const clients = getActiveClients();
    const projects = formData.cliente_id ? getProjectsByClient(formData.cliente_id) : [];
    const periodInfo = formData.data ? calculatePeriod(formData.data) : null;

    const quantidade = Number(formData.quantidade) || 0;
    const valorUnitario = Number(formData.valor_unitario) || 0;
    const total = quantidade * valorUnitario;

    useEffect(() => {
        if (!id) {
            setNotFound(true);
            return;
        }

        const prod = state.productions.find(p => p.id === id);
        
        if (!prod) {
            setNotFound(true);
            return;
        }

        if (!canEditProduction(prod)) {
            setBlocked(true);
            return;
        }

        setFormData({
            data: prod.data,
            cliente_id: prod.cliente_id,
            projeto_id: prod.projeto_id || '',
            tipo: prod.tipo,
            nome_producao: prod.nome_producao,
            quantidade: prod.quantidade,
            valor_unitario: prod.valor_unitario,
            observacoes: prod.observacoes || ''
        });
    }, [id, state.productions, canEditProduction]);

    const updateField = (field: keyof ProductionFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setLoading(true);
        setErrors([]);
        setSuccess(null);

        await new Promise(r => setTimeout(r, 300));

        const result = updateProduction(id, formData);

        if (result.success) {
            setSuccess('Produção atualizada com sucesso!');
            setTimeout(() => navigate('/producoes'), 1000);
        } else {
            setErrors(result.errors);
        }

        setLoading(false);
    };

    if (notFound) {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <PageHeader
                    title="Editar Produção"
                    actions={
                        <Button
                            variant="secondary"
                            icon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => navigate('/producoes')}
                        >
                            Voltar
                        </Button>
                    }
                />
                <Card>
                    <EmptyState
                        icon={<AlertTriangle className="w-16 h-16 text-yellow-400" />}
                        title="Produção não encontrada"
                        description="A produção que você está tentando editar não existe ou foi removida."
                        action={
                            <Button onClick={() => navigate('/producoes')}>
                                Ir para Produções
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    if (blocked) {
        const period = production ? getPeriodById(production.periodo_id) : null;
        
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <PageHeader
                    title="Editar Produção"
                    actions={
                        <Button
                            variant="secondary"
                            icon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => navigate('/producoes')}
                        >
                            Voltar
                        </Button>
                    }
                />
                <Card>
                    <EmptyState
                        icon={<AlertTriangle className="w-16 h-16 text-red-400" />}
                        title="Edição bloqueada"
                        description={
                            production?.status === 'Fechado'
                                ? "Esta produção pertence a um período fechado e não pode ser editada."
                                : "Produções só podem ser editadas no mesmo dia da criação."
                        }
                        action={
                            <Button onClick={() => navigate('/producoes')}>
                                Ir para Produções
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <PageHeader
                title="Editar Produção"
                subtitle="Atualize os dados da produção"
                actions={
                    <Button
                        variant="secondary"
                        icon={<ArrowLeft className="w-4 h-4" />}
                        onClick={() => navigate(-1)}
                    >
                        Voltar
                    </Button>
                }
            />

            {errors.length > 0 && (
                <div className="mb-6">
                    <Alert
                        type="error"
                        title="Erro ao atualizar"
                        message={errors.join('. ')}
                        onClose={() => setErrors([])}
                    />
                </div>
            )}

            {success && (
                <div className="mb-6">
                    <Alert
                        type="success"
                        message={success}
                        onClose={() => setSuccess(null)}
                    />
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Data"
                            type="date"
                            value={formData.data}
                            onChange={(e) => updateField('data', e.target.value)}
                            required
                        />

                        <Select
                            label="Cliente"
                            value={formData.cliente_id}
                            onChange={(e) => updateField('cliente_id', e.target.value)}
                            options={clients.map(c => ({ value: c.id, label: c.nome }))}
                            placeholder="Selecione um cliente"
                            required
                        />

                        <Select
                            label="Projeto"
                            value={formData.projeto_id}
                            onChange={(e) => updateField('projeto_id', e.target.value)}
                            options={projects.map(p => ({ value: p.id, label: p.nome }))}
                            placeholder="Selecione um projeto (opcional)"
                            disabled={!formData.cliente_id}
                        />

                        <Select
                            label="Tipo de Produção"
                            value={formData.tipo}
                            onChange={(e) => updateField('tipo', e.target.value as ProductionType)}
                            options={PRODUCTION_TYPES.map(t => ({ value: t, label: t }))}
                            placeholder="Selecione o tipo"
                            required
                        />

                        <div className="md:col-span-2">
                            <Input
                                label="Nome da Produção"
                                value={formData.nome_producao}
                                onChange={(e) => updateField('nome_producao', e.target.value)}
                                placeholder="Ex: Post lançamento produto X"
                                required
                            />
                        </div>

                        <Input
                            label="Quantidade"
                            type="number"
                            min={1}
                            value={formData.quantidade}
                            onChange={(e) => updateField('quantidade', e.target.value)}
                            required
                        />

                        <Input
                            label="Valor Unitário (R$)"
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={formData.valor_unitario}
                            onChange={(e) => updateField('valor_unitario', e.target.value)}
                            placeholder="0,00"
                            required
                        />

                        <div className="md:col-span-2">
                            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Total Calculado:</span>
                                    <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        {periodInfo && (
                            <div className="md:col-span-2">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-sm text-slate-400">
                                        📅 Período: <span className="text-white font-medium">{periodInfo.nome_periodo}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <Textarea
                                label="Observações"
                                value={formData.observacoes}
                                onChange={(e) => updateField('observacoes', e.target.value)}
                                placeholder="Observações opcionais..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-white/10">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/producoes')}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            icon={<Save className="w-4 h-4" />}
                            className="flex-1"
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
