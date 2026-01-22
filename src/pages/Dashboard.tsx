/* 
 * Página Dashboard - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 21:01
 * @version 1.1.0
 */

import { Link } from 'react-router-dom';
import {
    PlusCircle,
    List,
    Lock,
    Users,
    Calendar,
    DollarSign,
    FileText
} from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getTodayISO, calculatePeriod } from '../utils';
import { Card, PageHeader } from '../components/ui';

export function Dashboard() {
    const { state, getActiveClients } = useStore();

    // Estatísticas
    const totalClients = getActiveClients().length;
    const totalProductions = state.productions.length;
    const openPeriods = state.periods.filter(p => p.status === 'Aberto').length;

    // Produções de hoje
    const today = getTodayISO();
    const todayProductions = state.productions.filter(p => p.data === today);
    const todayTotal = todayProductions.reduce((sum, p) => sum + p.total, 0);

    // Período atual
    const currentPeriodInfo = calculatePeriod(today);

    // Total do mês atual (todos os períodos abertos)
    const monthTotal = state.periods
        .filter(p => p.status === 'Aberto')
        .reduce((sum, p) => sum + p.total_periodo, 0);

    const stats = [
        {
            label: 'Clientes Ativos',
            value: totalClients,
            icon: Users,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Produções Hoje',
            value: todayProductions.length,
            icon: Calendar,
            color: 'from-green-500 to-emerald-500'
        },
        {
            label: 'Valor Hoje',
            value: formatCurrency(todayTotal),
            icon: DollarSign,
            color: 'from-purple-500 to-pink-500',
            isMonetary: true
        },
        {
            label: 'Períodos Abertos',
            value: openPeriods,
            icon: Lock,
            color: 'from-orange-500 to-amber-500'
        },
    ];

    const { isAdmin } = useAuth();

    const quickActions = [
        {
            label: 'Lançar Produção',
            description: 'Registrar nova produção',
            path: '/nova-producao',
            icon: PlusCircle,
            color: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
            adminOnly: true
        },
        {
            label: 'Ver Produções',
            description: 'Listar todas as produções',
            path: '/producoes',
            icon: List,
            color: 'bg-green-500/20 text-green-400 border-green-500/30'
        },
        {
            label: 'Fechamento',
            description: 'Fechar período mensal',
            path: '/fechamento',
            icon: Lock,
            color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        },
        {
            label: 'Gerenciar Clientes',
            description: 'Adicionar ou editar clientes',
            path: '/clientes',
            icon: Users,
            color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            adminOnly: true
        },
    ].filter(action => isAdmin || !action.adminOnly);

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Dashboard"
                subtitle={`Período atual: ${currentPeriodInfo.nome_periodo}`}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className="glass-card p-5 animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.isMonetary ? 'text-lg' : ''}`}>
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                <stat.icon className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <Card title="Ações Rápidas" className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={action.path}
                            to={action.path}
                            className={`p-4 rounded-xl border ${action.color} hover:scale-[1.02] transition-all animate-slide-up`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center gap-3">
                                <action.icon className="w-6 h-6" aria-hidden="true" />
                                <div>
                                    <p className="font-semibold">{action.label}</p>
                                    <p className="text-xs opacity-70">{action.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </Card>

            {/* Dashboard Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card title="Distribuição por Tipo de Produção (Mês Atual)">
                    <div className="space-y-6">
                        {/* Gráfico de Barras CSS */}
                        <div className="h-8 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            {state.productionTypes.map((type, index) => {
                                const typeTotal = state.productions
                                    .filter(p => p.tipo === type.nome)
                                    .reduce((sum, p) => sum + p.total, 0);

                                const totalValue = state.productions.reduce((sum, p) => sum + p.total, 0);
                                const percent = totalValue > 0 ? (typeTotal / totalValue) * 100 : 0;

                                if (percent <= 0) return null;

                                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500'];
                                const color = colors[index % colors.length];

                                return (
                                    <div
                                        key={type.id}
                                        style={{ width: `${percent}%` }}
                                        className={`${color} hover:opacity-80 transition-opacity relative group`}
                                        title={`${type.nome}: ${formatCurrency(typeTotal)} (${percent.toFixed(1)}%)`}
                                    ></div>
                                );
                            })}
                        </div>

                        {/* Legenda */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                            {state.productionTypes.map((type, index) => {
                                const typeTotal = state.productions
                                    .filter(p => p.tipo === type.nome)
                                    .reduce((sum, p) => sum + p.total, 0);

                                if (typeTotal === 0) return null;

                                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500'];
                                const color = colors[index % colors.length];

                                return (
                                    <div key={type.id} className="flex items-center gap-2 text-sm">
                                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                        <span className="text-slate-300">{type.nome}</span>
                                        <span className="text-slate-500 ml-auto">{formatCurrency(typeTotal)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                <Card title="Resumo Financeiro">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-white/10">
                            <span className="text-slate-400">Total em períodos abertos</span>
                            <span className="text-xl font-bold text-green-400">{formatCurrency(monthTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/10">
                            <span className="text-slate-400">Total de produções</span>
                            <span className="text-xl font-bold">{totalProductions}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-slate-400">Períodos fechados</span>
                            <span className="text-xl font-bold">{state.periods.filter(p => p.status === 'Fechado').length}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Últimas Produções */}
            <Card title="Últimas Produções">
                {state.productions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma produção registrada</p>
                        <Link
                            to="/nova-producao"
                            className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block"
                        >
                            Lançar primeira produção →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {state.productions
                            .slice()
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 5)
                            .map(prod => {
                                const client = state.clients.find(c => c.id === prod.cliente_id);
                                return (
                                    <div
                                        key={prod.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{prod.nome_producao}</p>
                                            <p className="text-xs text-slate-500">{client?.nome || 'Cliente'} • {prod.tipo}</p>
                                        </div>
                                        <span className="font-semibold text-green-400">{formatCurrency(prod.total)}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                )}
            </Card>
        </div>
    );
}
