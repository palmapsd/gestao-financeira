/* 
 * Página Gerenciar Clientes - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 21:01
 * @version 1.1.0
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Users, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import type { Client } from '../types';
import {
    PageHeader,
    Card,
    Button,
    Input,
    Modal,
    Alert,
    EmptyState
} from '../components/ui';

export function Clientes() {
    const { state, addClient, updateClient, deleteClient } = useStore();

    const [newName, setNewName] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteModal, setDeleteModal] = useState<Client | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Adicionar cliente
    const handleAdd = () => {
        if (!newName.trim()) {
            setAlert({ type: 'error', message: 'Digite o nome do cliente' });
            return;
        }

        addClient(newName.trim());
        setNewName('');
        setAlert({ type: 'success', message: 'Cliente adicionado com sucesso!' });
    };

    // Iniciar edição
    const startEdit = (client: Client) => {
        setEditingClient(client);
        setEditName(client.nome);
    };

    // Salvar edição
    const saveEdit = () => {
        if (!editingClient || !editName.trim()) return;

        updateClient(editingClient.id, editName.trim(), editingClient.ativo);
        setEditingClient(null);
        setEditName('');
        setAlert({ type: 'success', message: 'Cliente atualizado!' });
    };

    // Toggle ativo
    const toggleActive = (client: Client) => {
        updateClient(client.id, client.nome, !client.ativo);
    };

    // Deletar
    const handleDelete = (client: Client) => {
        const success = deleteClient(client.id);
        if (success) {
            setAlert({ type: 'success', message: 'Cliente excluído!' });
        } else {
            setAlert({ type: 'error', message: 'Não é possível excluir: cliente possui produções vinculadas' });
        }
        setDeleteModal(null);
    };

    // Ordena clientes: ativos primeiro, depois por nome
    const sortedClients = [...state.clients].sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return a.nome.localeCompare(b.nome);
    });

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <PageHeader
                title="Clientes"
                subtitle={`${state.clients.length} cliente(s) cadastrado(s)`}
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

            {/* Adicionar */}
            <Card className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Nome do novo cliente"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <Button
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleAdd}
                    >
                        Adicionar
                    </Button>
                </div>
            </Card>

            {/* Lista */}
            {sortedClients.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Users className="w-16 h-16" />}
                        title="Nenhum cliente cadastrado"
                        description="Adicione seu primeiro cliente no campo acima."
                    />
                </Card>
            ) : (
                <Card className="divide-y divide-white/10">
                    {sortedClients.map(client => (
                        <div
                            key={client.id}
                            className={`flex items-center justify-between p-4 -mx-6 first:-mt-6 last:-mb-6 px-6
                ${!client.ativo ? 'opacity-50' : ''}`}
                        >
                            {editingClient?.id === client.id ? (
                                // Modo edição
                                <div className="flex items-center gap-3 flex-1">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') setEditingClient(null);
                                        }}
                                        className="flex-1"
                                        autoFocus
                                    />
                                    <button
                                        onClick={saveEdit}
                                        className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                                        title="Salvar"
                                    >
                                        <Check className="w-5 h-5 text-green-400" />
                                    </button>
                                    <button
                                        onClick={() => setEditingClient(null)}
                                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                        title="Cancelar"
                                    >
                                        <X className="w-5 h-5 text-red-400" />
                                    </button>
                                </div>
                            ) : (
                                // Modo visualização
                                <>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-3 h-3 rounded-full ${client.ativo ? 'bg-green-500' : 'bg-slate-500'}`}
                                            title={client.ativo ? 'Ativo' : 'Inativo'}
                                        />
                                        <span className="font-medium">{client.nome}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(client)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                        ${client.ativo
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'}`}
                                        >
                                            {client.ativo ? 'Ativo' : 'Inativo'}
                                        </button>

                                        <button
                                            onClick={() => startEdit(client)}
                                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4 text-slate-400 hover:text-primary-400" />
                                        </button>

                                        <button
                                            onClick={() => setDeleteModal(client)}
                                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {/* Modal de exclusão */}
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
                            Tem certeza que deseja excluir o cliente:
                        </p>
                        <p className="font-semibold text-white mt-2">
                            "{deleteModal?.nome}"?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Clientes com produções vinculadas não podem ser excluídos.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
