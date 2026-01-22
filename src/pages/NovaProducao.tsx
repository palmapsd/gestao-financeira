/* 
 * Página Lançar Produção (Tela 1) - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:30
 * @version 1.3.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, ArrowLeft, Shield } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../context/AuthContext';
import type { ProductionFormData, ProductionType } from '../types';
import { PRODUCTION_TYPES, formatCurrency, getTodayISO, calculatePeriod } from '../utils';
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

// Estado inicial do formulário
const getInitialFormData = (): ProductionFormData => ({
    data: getTodayISO(),
    cliente_id: '',
    projeto_id: '',
    tipo: '',
    nome_producao: '',
    quantidade: 1,
    valor_unitario: '',
    observacoes: ''
});

export function NovaProducao() {
    const navigate = useNavigate();
    const { getActiveClients, getProjectsByClient, addProduction } = useStore();
    const { isAdmin } = useAuth();

    const [formData, setFormData] = useState<ProductionFormData>(getInitialFormData());
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Clientes ativos
    const clients = getActiveClients();

    // Projetos do cliente selecionado
    const projects = formData.cliente_id ? getProjectsByClient(formData.cliente_id) : [];

    // Calcula período baseado na data selecionada
    const periodInfo = formData.data ? calculatePeriod(formData.data) : null;

    // Calcula total
    const quantidade = Number(formData.quantidade) || 0;
    const valorUnitario = Number(formData.valor_unitario) || 0;
    const total = quantidade * valorUnitario;

    // Limpa projeto quando cliente muda
    useEffect(() => {
        setFormData(prev => ({ ...prev, projeto_id: '' }));
    }, [formData.cliente_id]);

    // Atualiza campo do formulário
    const updateField = (field: keyof ProductionFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]);
        setSuccess(null);
    };

    // Submete o formulário
    const handleSubmit = async (addAnother: boolean = false) => {
        setLoading(true);
        setErrors([]);
        setSuccess(null);

        // Pequeno delay para feedback visual
        await new Promise(r => setTimeout(r, 300));

        const result = await addProduction(formData);

        if (result.success) {
            if (addAnother) {
                // Limpa formulário mas mantém cliente e data
                setFormData(prev => ({
                    ...getInitialFormData(),
                    data: prev.data,
                    cliente_id: prev.cliente_id
                }));
                setSuccess('Produção lançada com sucesso! Você pode lançar outra.');
            } else {
                navigate('/producoes');
            }
        } else {
            setErrors(result.errors);
        }

        setLoading(false);
    };

    if (!isAdmin) {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <Card>
                    <EmptyState
                        icon={<Shield className="w-16 h-16 text-red-500" />}
                        title="Acesso Negado"
                        description="Você não tem permissão para lançar produções."
                        action={
                            <Button variant="secondary" onClick={() => navigate('/producoes')}>
                                Voltar para Produções
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
                title="Lançar Produção"
                subtitle="Registre uma nova produção criativa"
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

            {/* Alertas */}
            {errors.length > 0 && (
                <div className="mb-6">
                    <Alert
                        type="error"
                        title="Preencha todos os campos obrigatórios"
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
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Data */}
                        <Input
                            label="Data"
                            type="date"
                            value={formData.data}
                            onChange={(e) => updateField('data', e.target.value)}
                            required
                        />

                        {/* Cliente */}
                        <Select
                            label="Cliente"
                            value={formData.cliente_id}
                            onChange={(e) => updateField('cliente_id', e.target.value)}
                            options={clients.map(c => ({ value: c.id, label: c.nome }))}
                            placeholder="Selecione um cliente"
                            required
                        />

                        {/* Projeto */}
                        <Select
                            label="Projeto"
                            value={formData.projeto_id}
                            onChange={(e) => updateField('projeto_id', e.target.value)}
                            options={projects.map(p => ({ value: p.id, label: p.nome }))}
                            placeholder="Selecione um projeto (opcional)"
                            disabled={!formData.cliente_id}
                        />

                        {/* Tipo */}
                        <Select
                            label="Tipo de Produção"
                            value={formData.tipo}
                            onChange={(e) => updateField('tipo', e.target.value as ProductionType)}
                            options={PRODUCTION_TYPES.map(t => ({ value: t, label: t }))}
                            placeholder="Selecione o tipo"
                            required
                        />

                        {/* Nome da Produção */}
                        <div className="md:col-span-2">
                            <Input
                                label="Nome da Produção"
                                value={formData.nome_producao}
                                onChange={(e) => updateField('nome_producao', e.target.value)}
                                placeholder="Ex: Post lançamento produto X"
                                required
                            />
                        </div>

                        {/* Quantidade */}
                        <Input
                            label="Quantidade"
                            type="number"
                            min={1}
                            value={formData.quantidade}
                            onChange={(e) => updateField('quantidade', e.target.value)}
                            required
                        />

                        {/* Valor Unitário */}
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

                        {/* Total */}
                        <div className="md:col-span-2">
                            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Total Calculado:</span>
                                    <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Período Info */}
                        {periodInfo && (
                            <div className="md:col-span-2">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-sm text-slate-400">
                                        📅 Período automático: <span className="text-white font-medium">{periodInfo.nome_periodo}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Observações */}
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

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-white/10">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            icon={<Save className="w-4 h-4" />}
                            className="flex-1"
                        >
                            Salvar
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            loading={loading}
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => handleSubmit(true)}
                            className="flex-1"
                        >
                            Salvar e Lançar Outra
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
