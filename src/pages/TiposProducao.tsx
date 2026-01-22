/* 
 * Página Gerenciamento de Tipos de Produção - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 12:10
 * @version 1.4.0
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Tag, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    PageHeader,
    Card,
    Button,
    Input,
    Modal,
    Alert,
    EmptyState,
    LoadingSpinner
} from '../components/ui';

interface ProductionType {
    id: string;
    nome: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export function TiposProducao() {
    const { isAdmin } = useAuth();

    const [types, setTypes] = useState<ProductionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [newName, setNewName] = useState('');
    const [editingType, setEditingType] = useState<ProductionType | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteModal, setDeleteModal] = useState<ProductionType | null>(null);

    // Carrega tipos
    const loadTypes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_types')
            .select('*')
            .order('nome');

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao carregar tipos' });
        } else {
            setTypes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTypes();
    }, []);

    // Adicionar tipo
    const handleAdd = async () => {
        if (!newName.trim()) {
            setAlert({ type: 'error', message: 'Digite o nome do tipo' });
            return;
        }

        const { error } = await supabase
            .from('production_types')
            .insert({ nome: newName.trim() });

        if (error) {
            if (error.code === '23505') {
                setAlert({ type: 'error', message: 'Já existe um tipo com esse nome' });
            } else {
                setAlert({ type: 'error', message: 'Erro ao adicionar tipo' });
            }
        } else {
            setNewName('');
            setAlert({ type: 'success', message: 'Tipo adicionado com sucesso!' });
            loadTypes();
        }
    };

    // Iniciar edição
    const startEdit = (type: ProductionType) => {
        setEditingType(type);
        setEditName(type.nome);
    };

    // Salvar edição
    const saveEdit = async () => {
        if (!editingType || !editName.trim()) return;

        const { error } = await supabase
            .from('production_types')
            .update({ nome: editName.trim() })
            .eq('id', editingType.id);

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao atualizar tipo' });
        } else {
            setEditingType(null);
            setEditName('');
            setAlert({ type: 'success', message: 'Tipo atualizado!' });
            loadTypes();
        }
    };

    // Toggle ativo
    const toggleActive = async (type: ProductionType) => {
        const { error } = await supabase
            .from('production_types')
            .update({ ativo: !type.ativo })
            .eq('id', type.id);

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao alterar status' });
        } else {
            setTypes(types.map(t => t.id === type.id ? { ...t, ativo: !t.ativo } : t));
        }
    };

    // Deletar
    const handleDelete = async (type: ProductionType) => {
        const { error } = await supabase
            .from('production_types')
            .delete()
            .eq('id', type.id);

        if (error) {
            setAlert({ type: 'error', message: 'Erro ao excluir. Pode haver produções usando este tipo.' });
        } else {
            setAlert({ type: 'success', message: 'Tipo excluído!' });
            loadTypes();
        }
        setDeleteModal(null);
    };

    // Ordena: ativos primeiro, depois por nome
    const sortedTypes = [...types].sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return a.nome.localeCompare(b.nome);
    });

    if (!isAdmin) {
        return (
            <div className="animate-fade-in">
                <Card>
                    <EmptyState
                        icon={<Tag className="w-16 h-16" />}
                        title="Acesso Negado"
                        description="Você não tem permissão para acessar esta página."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <PageHeader
                title="Tipos de Produção"
                subtitle={`${types.length} tipo(s) cadastrado(s)`}
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
                            placeholder="Nome do novo tipo (ex: Banner, Carrossel...)"
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
            {loading ? (
                <Card className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </Card>
            ) : sortedTypes.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Tag className="w-16 h-16" />}
                        title="Nenhum tipo cadastrado"
                        description="Adicione tipos de produção no campo acima."
                    />
                </Card>
            ) : (
                <Card className="divide-y divide-white/10">
                    {sortedTypes.map(type => (
                        <div
                            key={type.id}
                            className={`flex items-center justify-between p-4 -mx-6 first:-mt-6 last:-mb-6 px-6
                                ${!type.ativo ? 'opacity-50' : ''}`}
                        >
                            {editingType?.id === type.id ? (
                                // Modo edição
                                <div className="flex items-center gap-3 flex-1">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') setEditingType(null);
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
                                        onClick={() => setEditingType(null)}
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
                                            className={`w-3 h-3 rounded-full ${type.ativo ? 'bg-green-500' : 'bg-slate-500'}`}
                                            title={type.ativo ? 'Ativo' : 'Inativo'}
                                        />
                                        <span className="font-medium">{type.nome}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(type)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                                                ${type.ativo
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'}`}
                                        >
                                            {type.ativo ? 'Ativo' : 'Inativo'}
                                        </button>

                                        <button
                                            onClick={() => startEdit(type)}
                                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4 text-slate-400 hover:text-primary-400" />
                                        </button>

                                        <button
                                            onClick={() => setDeleteModal(type)}
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
                            Tem certeza que deseja excluir o tipo:
                        </p>
                        <p className="font-semibold text-white mt-2">
                            "{deleteModal?.nome}"?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Tipos com produções vinculadas não podem ser excluídos.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
