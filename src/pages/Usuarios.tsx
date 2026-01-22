/* 
 * Página Gerenciamento de Usuários - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:30
 * @version 1.3.0
 * 
 * Nota: Esta página usa Supabase Auth para gerenciamento de usuários.
 * Usuários são criados via signUp e seus roles são gerenciados na tabela profiles.
 */

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import {
    PageHeader,
    Card,
    Button,
    Input,
    Select,
    Modal,
    Alert,
    EmptyState,
    LoadingSpinner
} from '../components/ui';
import { useStore } from '../store';

export function Usuarios() {
    const { signUp, isAdmin } = useAuth();
    const { state: { clients }, refreshData } = useStore();

    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form de novo usuário
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmail, setNewEmail] = useState(''); // Agora usado para Username
    const [newPassword, setNewPassword] = useState('');
    const [newNome, setNewNome] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer');
    const [newClienteId, setNewClienteId] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Carrega usuários
    const loadUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('nome');

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao carregar usuários' });
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
        refreshData(); // Garante que clientes estão carregados
    }, []);

    // Adicionar usuário
    const handleAdd = async () => {
        if (!newEmail || !newPassword || !newNome) {
            setAlert({ type: 'error', message: 'Preencha todos os campos obrigatórios' });
            return;
        }

        if (newRole === 'viewer' && !newClienteId) {
            setAlert({ type: 'error', message: 'Selecione um cliente para o visualizador' });
            return;
        }

        if (newPassword.length < 6) {
            setAlert({ type: 'error', message: 'Senha deve ter pelo menos 6 caracteres' });
            return;
        }

        setAddLoading(true);
        // Converte username para email fake
        const email = `${newEmail.toLowerCase().trim().replace(/\s+/g, '')}@palmapsd.local`;

        const result = await signUp(email, newPassword, newNome, newRole, newClienteId);

        if (result.success) {
            // Se tiver cliente_id e user id, força update no profile
            if (result.user && newClienteId) {
                // Aguarda um pouco para o trigger criar o profile
                await new Promise(r => setTimeout(r, 1000));
                await supabase.from('profiles').update({ cliente_id: newClienteId }).eq('id', result.user.id);
            }

            setAlert({ type: 'success', message: 'Usuário criado com sucesso!' });
            setShowAddModal(false);
            setNewEmail('');
            setNewPassword('');
            setNewNome('');
            setNewRole('viewer');
            setNewClienteId('');

            setTimeout(() => loadUsers(), 1000);
        } else {
            if (result.error?.includes('rate limit')) {
                setAlert({
                    type: 'error',
                    message: 'Limite de criação excedido. Por favor, desabilite "Confirm Email" no Supabase Auth -> Providers -> Email.'
                });
            } else {
                setAlert({ type: 'error', message: result.error || 'Erro ao criar usuário' });
            }
        }
        setAddLoading(false);
    };

    // Alterar role
    const toggleRole = async (profile: Profile) => {
        const newRole = profile.role === 'admin' ? 'viewer' : 'admin';
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', profile.id);

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao alterar permissão' });
        } else {
            setUsers(users.map(u => u.id === profile.id ? { ...u, role: newRole } : u));
            setAlert({ type: 'success', message: `Usuário agora é ${newRole === 'admin' ? 'Administrador' : 'Visualizador'}` });
        }
    };

    // Toggle ativo
    const toggleActive = async (profile: Profile) => {
        const { error } = await supabase
            .from('profiles')
            .update({ ativo: !profile.ativo })
            .eq('id', profile.id);

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao alterar status' });
        } else {
            setUsers(users.map(u => u.id === profile.id ? { ...u, ativo: !u.ativo } : u));
        }
    };

    if (!isAdmin) {
        return (
            <div className="animate-fade-in">
                <Card>
                    <EmptyState
                        icon={<Shield className="w-16 h-16" />}
                        title="Acesso Negado"
                        description="Você não tem permissão para acessar esta página."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <PageHeader
                title="Gerenciamento de Usuários"
                subtitle={`${users.length} usuário(s) cadastrado(s)`}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={<RefreshCw className="w-4 h-4" />}
                            onClick={loadUsers}
                        >
                            Atualizar
                        </Button>
                        <Button
                            icon={<UserPlus className="w-4 h-4" />}
                            onClick={() => setShowAddModal(true)}
                        >
                            Novo Usuário
                        </Button>
                    </div>
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

            {/* Lista */}
            {loading ? (
                <Card className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </Card>
            ) : users.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Shield className="w-16 h-16" />}
                        title="Nenhum usuário cadastrado"
                        description="Adicione o primeiro usuário clicando no botão acima."
                    />
                </Card>
            ) : (
                <Card className="divide-y divide-white/10">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className={`flex items-center justify-between p-4 -mx-6 first:-mt-6 last:-mb-6 px-6
                                ${!user.ativo ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                        {user.nome.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{user.nome}</p>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            {user.role === 'admin' ? (
                                                <>
                                                    <Shield className="w-3 h-3 text-purple-400" />
                                                    Administrador
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="w-3 h-3 text-blue-400" />
                                                    Visualizador
                                                    {user.cliente_id && (
                                                        <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                                            {clients.find(c => c.id === user.cliente_id)?.nome || 'Cliente Desconhecido'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleActive(user)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                                        ${user.ativo
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'}`}
                                >
                                    {user.ativo ? 'Ativo' : 'Inativo'}
                                </button>

                                <button
                                    onClick={() => toggleRole(user)}
                                    className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                                    title="Alterar permissão"
                                >
                                    {user.role === 'admin' ? 'Tornar Viewer' : 'Tornar Admin'}
                                </button>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* Modal Adicionar */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Novo Usuário"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAdd} loading={addLoading}>
                            Criar Usuário
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nome"
                        placeholder="Nome do usuário"
                        value={newNome}
                        onChange={(e) => setNewNome(e.target.value)}
                    />
                    <Input
                        label="Usuário (Username)"
                        placeholder="ex: clienteabc"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <Input
                        label="Senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Select
                        label="Permissão"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as 'admin' | 'viewer')}
                        options={[
                            { value: 'viewer', label: 'Visualizador (apenas leitura)' },
                            { value: 'admin', label: 'Administrador (acesso total)' }
                        ]}
                    />
                    {newRole === 'viewer' && (
                        <Select
                            label="Cliente Vinculado"
                            value={newClienteId}
                            onChange={(e) => setNewClienteId(e.target.value)}
                            options={clients.map(c => ({ value: c.id, label: c.nome }))}
                            placeholder="Selecione o cliente"
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
