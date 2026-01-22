/* 
 * Página de Gerenciamento de Usuários - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

import { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User as UserIcon, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole } from '../types/auth';
import {
    PageHeader,
    Card,
    Input,
    Select,
    Button,
    Modal,
    Alert,
    EmptyState
} from '../components/ui';

export function Usuarios() {
    const { users, addUser, updateUser, deleteUser, authState } = useAuth();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteModal, setDeleteModal] = useState<User | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form states
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formNome, setFormNome] = useState('');
    const [formRole, setFormRole] = useState<UserRole>('user');
    const [formAtivo, setFormAtivo] = useState(true);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setFormUsername('');
        setFormPassword('');
        setFormNome('');
        setFormRole('user');
        setFormAtivo(true);
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormNome(user.nome);
        setFormRole(user.role);
        setFormAtivo(user.ativo);
        setFormPassword(''); // Não preenchemos a senha
    };

    const handleAdd = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));

        const result = addUser(formUsername, formPassword, formNome, formRole);

        if (result.success) {
            setAlert({ type: 'success', message: 'Usuário criado com sucesso!' });
            setShowAddModal(false);
            resetForm();
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao criar usuário' });
        }

        setLoading(false);
    };

    const handleUpdate = async () => {
        if (!editingUser) return;

        setLoading(true);
        await new Promise(r => setTimeout(r, 300));

        const result = updateUser(
            editingUser.id,
            formNome,
            formRole,
            formAtivo,
            formPassword || undefined
        );

        if (result.success) {
            setAlert({ type: 'success', message: 'Usuário atualizado com sucesso!' });
            setEditingUser(null);
            resetForm();
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao atualizar usuário' });
        }

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteModal) return;

        setLoading(true);
        await new Promise(r => setTimeout(r, 300));

        const result = deleteUser(deleteModal.id);

        if (result.success) {
            setAlert({ type: 'success', message: 'Usuário excluído com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao excluir usuário' });
        }

        setDeleteModal(null);
        setLoading(false);
    };

    const getRoleBadge = (role: UserRole) => {
        if (role === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                <UserIcon className="w-3 h-3" />
                Usuário
            </span>
        );
    };

    const getStatusBadge = (ativo: boolean) => {
        if (ativo) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Ativo
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                <X className="w-3 h-3" />
                Inativo
            </span>
        );
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Gerenciamento de Usuários"
                subtitle="Adicione e gerencie usuários do sistema"
                actions={
                    <Button
                        icon={<UserPlus className="w-4 h-4" />}
                        onClick={openAddModal}
                    >
                        Novo Usuário
                    </Button>
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

            {/* Lista de usuários */}
            <Card>
                {users.length === 0 ? (
                    <EmptyState
                        icon={<UserIcon className="w-12 h-12" />}
                        title="Nenhum usuário cadastrado"
                        action={
                            <Button icon={<UserPlus className="w-4 h-4" />} onClick={openAddModal}>
                                Adicionar Usuário
                            </Button>
                        }
                    />
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Nome</th>
                                    <th>Nível</th>
                                    <th>Status</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <code className="px-2 py-1 rounded bg-slate-700 text-sm">
                                                {user.username}
                                            </code>
                                        </td>
                                        <td className="font-medium">{user.nome}</td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td>{getStatusBadge(user.ativo)}</td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {user.id !== authState.user?.id && user.username !== 'admin' && (
                                                    <button
                                                        onClick={() => setDeleteModal(user)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

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
                        <Button
                            icon={<UserPlus className="w-4 h-4" />}
                            onClick={handleAdd}
                            loading={loading}
                            disabled={!formUsername || !formPassword || !formNome}
                        >
                            Criar Usuário
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nome de Usuário"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        placeholder="Digite o nome de usuário"
                    />
                    <Input
                        label="Senha"
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                    />
                    <Input
                        label="Nome Completo"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        placeholder="Digite o nome completo"
                    />
                    <Select
                        label="Nível de Acesso"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        options={[
                            { value: 'user', label: 'Usuário' },
                            { value: 'admin', label: 'Administrador' }
                        ]}
                    />
                </div>
            </Modal>

            {/* Modal Editar */}
            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="Editar Usuário"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditingUser(null)}>
                            Cancelar
                        </Button>
                        <Button
                            icon={<Check className="w-4 h-4" />}
                            onClick={handleUpdate}
                            loading={loading}
                            disabled={!formNome}
                        >
                            Salvar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-sm text-slate-400">Usuário:</p>
                        <code className="text-white">{editingUser?.username}</code>
                    </div>
                    <Input
                        label="Nova Senha (deixe em branco para manter)"
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Digite nova senha ou deixe em branco"
                    />
                    <Input
                        label="Nome Completo"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        placeholder="Digite o nome completo"
                    />
                    <Select
                        label="Nível de Acesso"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        options={[
                            { value: 'user', label: 'Usuário' },
                            { value: 'admin', label: 'Administrador' }
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formAtivo}
                                onChange={(e) => setFormAtivo(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                        <span className="text-sm text-slate-300">Usuário Ativo</span>
                    </div>
                </div>
            </Modal>

            {/* Modal Excluir */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title="Confirmar Exclusão"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={handleDelete}
                            loading={loading}
                        >
                            Excluir
                        </Button>
                    </>
                }
            >
                <p className="text-slate-300">
                    Tem certeza que deseja excluir o usuário{' '}
                    <strong className="text-white">{deleteModal?.nome}</strong>?
                </p>
                <p className="text-sm text-slate-400 mt-2">
                    Esta ação não pode ser desfeita.
                </p>
            </Modal>
        </div>
    );
}
