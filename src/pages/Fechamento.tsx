/* 
 * Página Fechamento (Tela 3) - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 15:45
 * @version 1.2.1
 */

import { useState, useMemo, useEffect } from 'react';
import { Download, Lock, AlertTriangle, FileSpreadsheet, FileText, Unlock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useStore } from '../store';
import type { Period } from '../types';
import { formatCurrency, formatDate, groupByType, PRODUCTION_TYPES } from '../utils';
import { exportPeriodToPDF } from '../utils/pdfExport';
import {
    PageHeader,
    Button,
    Select,
    Card,
    StatusBadge,
    Modal,
    Alert
} from '../components/ui';

export function Fechamento() {
    const {
        state,
        getActiveClients,
        getAllPeriodsByClient,
        getProductionsByPeriod,
        closePeriod,
        reopenPeriod,
        getPeriodById,
        getClientById
    } = useStore();

    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [confirmModal, setConfirmModal] = useState<{ type: 'close' | 'reopen'; periodId: string } | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const clients = getActiveClients();
    const allPeriods = selectedClientId ? getAllPeriodsByClient(selectedClientId) : [];

    // Auto-seleção inicial
    useEffect(() => {
        // Se só tem 1 cliente ou nenhum selecionado, seleciona o primeiro
        if (!selectedClientId && clients.length > 0) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients.length, selectedClientId]);

    useEffect(() => {
        // Se tem cliente mas sem período, tenta selecionar o atual ou o mais recente
        if (selectedClientId && !selectedPeriodId && allPeriods.length > 0) {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();

            // Tenta achar período correspondente ao mês atual
            const currentPeriod = allPeriods.find(p => {
                if (!p.data_inicio) return false;
                const [year, month] = p.data_inicio.split('-').map(Number);
                return month === currentMonth && year === currentYear;
            });

            if (currentPeriod) {
                setSelectedPeriodId(currentPeriod.id);
            } else {
                // Se não achar o atual, pega o primeiro da lista (assumindo que getAllPeriods retorna ordenado por data desc)
                setSelectedPeriodId(allPeriods[0].id);
            }
        }
    }, [selectedClientId, selectedPeriodId, allPeriods]);

    // Período selecionado
    const selectedPeriod: Period | undefined = useMemo(() => {
        return selectedPeriodId ? getPeriodById(selectedPeriodId) : undefined;
    }, [selectedPeriodId, state.periods]);

    // Produções do período
    const periodProductions = useMemo(() => {
        return selectedPeriodId ? getProductionsByPeriod(selectedPeriodId) : [];
    }, [selectedPeriodId, state.productions]);

    // Totais e Agrupamento
    const totalPeriodo = periodProductions.reduce((sum, p) => sum + p.total, 0);
    const groupedByType = groupByType(periodProductions);

    const handleClosePeriod = async () => {
        if (!confirmModal || confirmModal.type !== 'close') return;

        setLoading(true);
        const result = await closePeriod(confirmModal.periodId);

        if (result.success) {
            setAlert({ type: 'success', message: 'Período fechado com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao fechar período' });
        }
        setLoading(false);
        setConfirmModal(null);
    };

    const handleReopenPeriod = async () => {
        if (!confirmModal || confirmModal.type !== 'reopen') return;

        setLoading(true);
        const result = await reopenPeriod(confirmModal.periodId);

        if (result.success) {
            setAlert({ type: 'success', message: 'Período reaberto com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao reabrir período' });
        }
        setLoading(false);
        setConfirmModal(null);
    };

    const handleExportExcel = () => {
        if (!selectedPeriod) return;

        const client = getClientById(selectedPeriod.cliente_id);
        const wsData = periodProductions.map(p => ({
            Data: formatDate(p.data),
            Tipo: p.tipo,
            Produção: p.nome_producao,
            Quantidade: p.quantidade,
            'Valor Unit.': p.valor_unitario,
            Total: p.total,
            Status: p.status
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Produções");

        const filename = `Fechamento_${client?.nome}_${selectedPeriod.nome_periodo}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    };

    const handleExportPDF = async () => {
        if (!selectedPeriod) return;

        const client = getClientById(selectedPeriod.cliente_id);
        if (!client) return;

        // Argumentos corrigidos
        await exportPeriodToPDF({
            period: selectedPeriod,
            productions: periodProductions,
            clientName: client.nome
        });
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <PageHeader
                title="Fechamento de Período"
                subtitle="Gerencie fechamentos e exporte relatórios"
                actions={selectedPeriod && (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={<FileSpreadsheet className="w-4 h-4" />}
                            onClick={handleExportExcel}
                        >
                            Exportar Excel
                        </Button>
                        <Button
                            variant="secondary"
                            icon={<Download className="w-4 h-4" />}
                            onClick={handleExportPDF}
                        >
                            Exportar PDF
                        </Button>
                    </div>
                )}
            />

            {alert && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar de Seleção */}
                <Card className="lg:col-span-1 h-fit space-y-4">
                    <Select
                        label="Cliente"
                        value={selectedClientId}
                        onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSelectedPeriodId('');
                        }}
                        options={clients.map(c => ({ value: c.id, label: c.nome }))}
                        placeholder="Selecione..."
                    />

                    <Select
                        label="Período"
                        value={selectedPeriodId}
                        onChange={(e) => setSelectedPeriodId(e.target.value)}
                        options={allPeriods.map(p => ({
                            value: p.id,
                            label: `${p.nome_periodo} (${p.status})`
                        }))}
                        placeholder="Selecione..."
                        disabled={!selectedClientId}
                    />

                    {selectedPeriod && (
                        <div className="pt-4 border-t border-white/10">
                            <div className="mb-4">
                                <p className="text-sm text-slate-400 mb-1">Status do Período</p>
                                <StatusBadge status={selectedPeriod.status} />
                            </div>

                            {selectedPeriod.status === 'Aberto' ? (
                                <Button
                                    className="w-full"
                                    variant="success"
                                    icon={<Lock className="w-4 h-4" />}
                                    onClick={() => setConfirmModal({ type: 'close', periodId: selectedPeriod.id })}
                                >
                                    Fechar Período
                                </Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    icon={<Unlock className="w-4 h-4" />}
                                    onClick={() => setConfirmModal({ type: 'reopen', periodId: selectedPeriod.id })}
                                >
                                    Reabrir Período
                                </Button>
                            )}
                        </div>
                    )}
                </Card>

                {/* Área Principal */}
                <div className="lg:col-span-3 space-y-6">
                    {!selectedPeriod ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                            <FileText className="w-12 h-12 mb-3 opacity-50" />
                            <p>Selecione um cliente e período para visualizar</p>
                        </div>
                    ) : (
                        <>
                            {/* Cards de Resumo */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                    <p className="text-sm text-slate-400">Total de Produções</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {periodProductions.length}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                    <p className="text-sm text-slate-400">Total Financeiro</p>
                                    <p className="text-2xl font-bold text-green-400 mt-1">
                                        {formatCurrency(totalPeriodo)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                    <p className="text-sm text-slate-400">Ticket Médio</p>
                                    <p className="text-2xl font-bold text-blue-400 mt-1">
                                        {periodProductions.length > 0
                                            ? formatCurrency(totalPeriodo / periodProductions.length)
                                            : formatCurrency(0)
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Detalhamento por Tipo */}
                            <Card title="Detalhamento por Tipo">
                                <div className="space-y-4">
                                    {PRODUCTION_TYPES.map(type => {
                                        const typeData = groupedByType[type];
                                        if (!typeData) return null;

                                        return (
                                            <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span className="font-medium text-slate-200">{type}</span>
                                                    <span className="text-xs text-slate-500">({typeData.quantidade} itens)</span>
                                                </div>
                                                <span className="font-semibold text-slate-200">
                                                    {formatCurrency(typeData.total)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Lista Detalhada */}
                            <Card title="Produções do Período">
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Produção</th>
                                                <th>Tipo</th>
                                                <th className="text-right">Qtd</th>
                                                <th className="text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periodProductions.map(prod => (
                                                <tr key={prod.id}>
                                                    <td>{formatDate(prod.data)}</td>
                                                    <td>{prod.nome_producao}</td>
                                                    <td>
                                                        <span className="px-2 py-1 rounded text-xs bg-slate-700">
                                                            {prod.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">{prod.quantidade}</td>
                                                    <td className="text-right font-medium text-green-400">
                                                        {formatCurrency(prod.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-700/50 font-bold">
                                                <td colSpan={3}>TOTAL</td>
                                                <td className="text-right">{periodProductions.reduce((a, b) => a + b.quantidade, 0)}</td>
                                                <td className="text-right text-green-400">{formatCurrency(totalPeriodo)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Confirmação */}
            <Modal
                isOpen={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                title={confirmModal?.type === 'close' ? 'Fechar Período' : 'Reabrir Período'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmModal(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmModal?.type === 'close' ? 'primary' : 'secondary'}
                            onClick={confirmModal?.type === 'close' ? handleClosePeriod : handleReopenPeriod}
                            loading={loading}
                        >
                            Confirmar
                        </Button>
                    </>
                }
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        {confirmModal?.type === 'close' ? (
                            <>
                                <p className="text-slate-300">
                                    Ao fechar o período <strong>{selectedPeriod?.nome_periodo}</strong>:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm text-slate-400 space-y-1">
                                    <li>Nenhuma produção poderá ser adicionada, editada ou excluída neste período.</li>
                                    <li>Relatórios finais serão gerados.</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-300">
                                    Ao reabrir o período <strong>{selectedPeriod?.nome_periodo}</strong>:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm text-slate-400 space-y-1">
                                    <li>Produções poderão ser editadas novamente.</li>
                                    <li>O status voltará para "Aberto".</li>
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
