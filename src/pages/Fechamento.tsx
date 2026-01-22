/* 
 * Página Fechamento (Tela 3) - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 21:00
 * @version 1.1.0
 */

import { useState, useMemo } from 'react';
import { Download, Lock, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useStore } from '../store';
import type { Period } from '../types';
import { formatCurrency, formatDate, groupByType, PRODUCTION_TYPES } from '../utils';
import { exportPeriodToPDF } from '../utils/pdfExport';
import {
    PageHeader,
    Card,
    Select,
    Button,
    Modal,
    StatusBadge,
    Alert,
    EmptyState
} from '../components/ui';

export function Fechamento() {
    const {
        state,
        getActiveClients,
        getAllPeriodsByClient,
        getProductionsByPeriod,
        closePeriod,
        getClientById
    } = useStore();

    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [closeModal, setCloseModal] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const clients = getActiveClients();
    const allPeriods = selectedClientId ? getAllPeriodsByClient(selectedClientId) : [];

    // Período selecionado
    const selectedPeriod: Period | undefined = useMemo(() => {
        return state.periods.find(p => p.id === selectedPeriodId);
    }, [state.periods, selectedPeriodId]);

    // Produções do período
    const periodProductions = useMemo(() => {
        if (!selectedPeriodId) return [];
        return getProductionsByPeriod(selectedPeriodId);
    }, [selectedPeriodId, getProductionsByPeriod]);

    // Totais por tipo
    const totaisPorTipo = useMemo(() => {
        return groupByType(periodProductions);
    }, [periodProductions]);

    // Exportar para Excel
    const handleExport = () => {
        if (!selectedPeriod || periodProductions.length === 0) return;

        const clientName = getClientById(selectedClientId)?.nome || 'Cliente';

        // Dados das produções
        const data = periodProductions.map(prod => ({
            'Data': formatDate(prod.data),
            'Tipo': prod.tipo,
            'Produção': prod.nome_producao,
            'Quantidade': prod.quantidade,
            'Valor Unitário': prod.valor_unitario,
            'Total': prod.total,
            'Observações': prod.observacoes || ''
        }));

        // Resumo
        const resumo: { Tipo: string; Total: number }[] = PRODUCTION_TYPES
            .map(tipo => ({
                'Tipo': tipo as string,
                'Total': totaisPorTipo[tipo]
            }))
            .filter(r => r.Total > 0);

        resumo.push({ 'Tipo': 'TOTAL GERAL', 'Total': selectedPeriod.total_periodo });

        // Cria workbook
        const wb = XLSX.utils.book_new();

        // Sheet de produções
        const wsProducoes = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, wsProducoes, 'Produções');

        // Sheet de resumo
        const wsResumo = XLSX.utils.json_to_sheet(resumo);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

        // Gera arquivo
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });

        const fileName = `${clientName.replace(/\s+/g, '_')}_${selectedPeriod.nome_periodo.replace(/\//g, '-').replace(/\s+/g, '')}.xlsx`;
        saveAs(blob, fileName);

        setAlert({ type: 'success', message: 'Relatório Excel exportado com sucesso!' });
    };

    // Fechar período
    const handleClosePeriod = async () => {
        if (!selectedPeriodId) return;

        setLoading(true);
        await new Promise(r => setTimeout(r, 500));

        const result = await closePeriod(selectedPeriodId);

        if (result.success) {
            setAlert({ type: 'success', message: 'Período fechado com sucesso! Não será mais possível editar as produções.' });
            setSelectedPeriodId('');
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao fechar período' });
        }

        setCloseModal(false);
        setLoading(false);
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Fechamento de Período"
                subtitle="Feche o período mensal e exporte relatórios"
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

            {/* Seleção */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Cliente"
                        value={selectedClientId}
                        onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSelectedPeriodId('');
                        }}
                        options={clients.map(c => ({ value: c.id, label: c.nome }))}
                        placeholder="Selecione um cliente"
                    />

                    <Select
                        label="Período"
                        value={selectedPeriodId}
                        onChange={(e) => setSelectedPeriodId(e.target.value)}
                        options={allPeriods.map(p => ({
                            value: p.id,
                            label: `${p.nome_periodo} - ${formatCurrency(p.total_periodo)} [${p.status}]`
                        }))}
                        placeholder={selectedClientId ? (allPeriods.length > 0 ? "Selecione um período" : "Nenhum período encontrado") : "Selecione um cliente primeiro"}
                        disabled={!selectedClientId || allPeriods.length === 0}
                    />
                </div>
            </Card>

            {/* Conteúdo do período */}
            {selectedPeriod ? (
                <>
                    {/* Resumo */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Card Principal */}
                        <div className="lg:col-span-2">
                            <Card title="Resumo por Tipo">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {PRODUCTION_TYPES.map(tipo => {
                                        const total = totaisPorTipo[tipo];
                                        if (total === 0) return null;

                                        return (
                                            <div key={tipo} className="p-4 rounded-xl bg-slate-800/50">
                                                <p className="text-sm text-slate-400 mb-1">{tipo}</p>
                                                <p className="text-lg font-bold text-white">{formatCurrency(total)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Total */}
                        <Card>
                            <div className="text-center py-4">
                                <p className="text-slate-400 mb-2">Total do Período</p>
                                <p className="text-4xl font-bold text-green-400">
                                    {formatCurrency(selectedPeriod.total_periodo)}
                                </p>
                                <div className="mt-3">
                                    <StatusBadge status={selectedPeriod.status} />
                                </div>
                                <p className="text-xs text-slate-500 mt-3">
                                    {periodProductions.length} produção(ões)
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Lista de produções */}
                    <Card title="Produções do Período" className="mb-6">
                        {periodProductions.length === 0 ? (
                            <EmptyState
                                icon={<FileSpreadsheet className="w-12 h-12" />}
                                title="Nenhuma produção neste período"
                            />
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Tipo</th>
                                            <th>Produção</th>
                                            <th className="text-right">Qtd</th>
                                            <th className="text-right">Valor Unit.</th>
                                            <th className="text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {periodProductions.map(prod => (
                                            <tr key={prod.id}>
                                                <td className="whitespace-nowrap">{formatDate(prod.data)}</td>
                                                <td>
                                                    <span className="px-2 py-1 rounded-lg bg-slate-700 text-xs font-medium">
                                                        {prod.tipo}
                                                    </span>
                                                </td>
                                                <td>{prod.nome_producao}</td>
                                                <td className="text-right">{prod.quantidade}</td>
                                                <td className="text-right">{formatCurrency(prod.valor_unitario)}</td>
                                                <td className="text-right font-semibold text-green-400">
                                                    {formatCurrency(prod.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Ações */}
                    <Card>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                variant="secondary"
                                icon={<Download className="w-4 h-4" />}
                                onClick={handleExport}
                                disabled={periodProductions.length === 0}
                            >
                                Exportar Excel
                            </Button>

                            <Button
                                variant="secondary"
                                icon={<FileText className="w-4 h-4" />}
                                onClick={() => {
                                    if (selectedPeriod && periodProductions.length > 0) {
                                        const clientName = getClientById(selectedClientId)?.nome || 'Cliente';
                                        exportPeriodToPDF({
                                            period: selectedPeriod,
                                            productions: periodProductions,
                                            clientName
                                        });
                                        setAlert({ type: 'success', message: 'Relatório PDF exportado com sucesso!' });
                                    }
                                }}
                                disabled={periodProductions.length === 0}
                            >
                                Exportar PDF
                            </Button>

                            {selectedPeriod?.status === 'Aberto' && (
                                <Button
                                    variant="danger"
                                    icon={<Lock className="w-4 h-4" />}
                                    onClick={() => setCloseModal(true)}
                                    disabled={periodProductions.length === 0}
                                >
                                    Fechar Período
                                </Button>
                            )}
                        </div>
                    </Card>
                </>
            ) : (
                <Card>
                    <EmptyState
                        icon={<Lock className="w-16 h-16" />}
                        title="Selecione um cliente e período"
                        description="Escolha um cliente e um período aberto para visualizar o resumo e realizar o fechamento."
                    />
                </Card>
            )}

            {/* Modal de confirmação */}
            <Modal
                isOpen={closeModal}
                onClose={() => setCloseModal(false)}
                title="Confirmar Fechamento"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCloseModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            icon={<Lock className="w-4 h-4" />}
                            onClick={handleClosePeriod}
                            loading={loading}
                        >
                            Fechar Período
                        </Button>
                    </>
                }
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium mb-2">
                            ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                        </p>
                        <p className="text-slate-400 text-sm mb-3">
                            Após fechar este período:
                        </p>
                        <ul className="text-sm text-slate-400 space-y-1 mb-4">
                            <li>• Não será possível editar produções</li>
                            <li>• Não será possível excluir produções</li>
                            <li>• Não será possível duplicar produções</li>
                            <li>• Somente visualização e exportação permitidas</li>
                        </ul>
                        <p className="text-white font-semibold">
                            Deseja continuar?
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
