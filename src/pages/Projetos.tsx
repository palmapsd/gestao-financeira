/* 
 * Página Gerenciar Projetos - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 11:30
 * @version 1.3.0
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Check, X, FolderOpen, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import type { Project } from '../types';
import {
    PageHeader,
    Card,
    Button,
    Input,
    Select,
    Modal,
    Alert,
    EmptyState
} from '../components/ui';

export function Projetos() {
    const { state, getActiveClients, addProject, updateProject, deleteProject, getClientById } = useStore();

    const [selectedClientId, setSelectedClientId] = useState('');
    const [newName, setNewName] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteModal, setDeleteModal] = useState<Project | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const clients = getActiveClients();

    // Adicionar projeto
    const handleAdd = async () => {
        if (!selectedClientId) {
            setAlert({ type: 'error', message: 'Selecione um cliente' });
            return;
        }

        if (!newName.trim()) {
            setAlert({ type: 'error', message: 'Digite o nome do projeto' });
            return;
        }

        const result = await addProject(newName.trim(), selectedClientId);
        if (result.success) {
            setNewName('');
            setAlert({ type: 'success', message: 'Projeto adicionado com sucesso!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Erro ao adicionar' });
        }
    };

    // Iniciar edição
    const startEdit = (project: Project) => {
        setEditingProject(project);
        setEditName(project.nome);
    };

    // Salvar edição
    const saveEdit = async () => {
        if (!editingProject || !editName.trim()) return;

        await updateProject(editingProject.id, editName.trim(), editingProject.ativo);
        setEditingProject(null);
        setEditName('');
        setAlert({ type: 'success', message: 'Projeto atualizado!' });
    };

    // Toggle ativo
    const toggleActive = async (project: Project) => {
        await updateProject(project.id, project.nome, !project.ativo);
    };

    // Deletar
    const handleDelete = async (project: Project) => {
        const result = await deleteProject(project.id);
        if (result.success) {
            setAlert({ type: 'success', message: 'Projeto excluído!' });
        } else {
            setAlert({ type: 'error', message: result.error || 'Não é possível excluir' });
        }
        setDeleteModal(null);
    };

    // Filtra e ordena projetos
    const filteredProjects = state.projects
        .filter(p => !selectedClientId || p.cliente_id === selectedClientId)
        .sort((a, b) => {
            if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
            return a.nome.localeCompare(b.nome);
        });

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <PageHeader
                title="Projetos"
                subtitle={`${state.projects.length} projeto(s) cadastrado(s)`}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                        placeholder="Selecione um cliente"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        options={clients.map(c => ({ value: c.id, label: c.nome }))}
                    />

                    <Input
                        placeholder="Nome do projeto"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />

                    <Button
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleAdd}
                        disabled={!selectedClientId}
                    >
                        Adicionar
                    </Button>
                </div>
            </Card>

            {/* Filtro por cliente */}
            <Card className="mb-6">
                <Select
                    label="Filtrar por Cliente"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os clientes' },
                        ...clients.map(c => ({ value: c.id, label: c.nome }))
                    ]}
                />
            </Card>

            {/* Lista */}
            {filteredProjects.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<FolderOpen className="w-16 h-16" />}
                        title="Nenhum projeto encontrado"
                        description={selectedClientId
                            ? "Este cliente não possui projetos cadastrados."
                            : "Adicione seu primeiro projeto no formulário acima."}
                    />
                </Card>
            ) : (
                <Card className="divide-y divide-white/10">
                    {filteredProjects.map(project => {
                        const client = getClientById(project.cliente_id);

                        return (
                            <div
                                key={project.id}
                                className={`flex items-center justify-between p-4 -mx-6 first:-mt-6 last:-mb-6 px-6
                  ${!project.ativo ? 'opacity-50' : ''}`}
                            >
                                {editingProject?.id === project.id ? (
                                    // Modo edição
                                    <div className="flex items-center gap-3 flex-1">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit();
                                                if (e.key === 'Escape') setEditingProject(null);
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
                                            onClick={() => setEditingProject(null)}
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
                                                className={`w-3 h-3 rounded-full ${project.ativo ? 'bg-green-500' : 'bg-slate-500'}`}
                                                title={project.ativo ? 'Ativo' : 'Inativo'}
                                            />
                                            <div>
                                                <span className="font-medium">{project.nome}</span>
                                                <p className="text-xs text-slate-500">{client?.nome || 'Cliente'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleActive(project)}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                          ${project.ativo
                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                        : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'}`}
                                            >
                                                {project.ativo ? 'Ativo' : 'Inativo'}
                                            </button>

                                            <button
                                                onClick={() => startEdit(project)}
                                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400 hover:text-primary-400" />
                                            </button>

                                            <button
                                                onClick={() => setDeleteModal(project)}
                                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
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
                            Tem certeza que deseja excluir o projeto:
                        </p>
                        <p className="font-semibold text-white mt-2">
                            "{deleteModal?.nome}"?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Projetos com produções vinculadas não podem ser excluídos.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
