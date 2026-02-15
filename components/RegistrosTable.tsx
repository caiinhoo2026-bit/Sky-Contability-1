'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { entregasService } from '@/lib/services/entregas.service'
import { abastecimentosService } from '@/lib/services/abastecimentos.service'
import { manutencoesService } from '@/lib/services/manutencoes.service'
import { Trash2, Edit2, Package, Fuel, Wrench, X } from 'lucide-react'
import { EntregaForm } from '@/components/forms/EntregaForm'
import { AbastecimentoForm } from '@/components/forms/AbastecimentoForm'
import { ManutencaoForm } from '@/components/forms/ManutencaoForm'

interface RegistrosTableProps {
    userId: string
    initialTab?: 'entregas' | 'abastecimentos' | 'manutencoes'
}

export function RegistrosTable({ userId, initialTab = 'entregas' }: RegistrosTableProps) {
    const [activeTab, setActiveTab] = useState<'entregas' | 'abastecimentos' | 'manutencoes'>(initialTab)
    const [data, setData] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [editingItem, setEditingItem] = useState<any | null>(null)

    const loadData = async () => {
        setLoadingData(true)
        try {
            let result: any[] = []
            if (activeTab === 'entregas') {
                result = await entregasService.getAll(userId)
            } else if (activeTab === 'abastecimentos') {
                result = await abastecimentosService.getAll(userId)
            } else if (activeTab === 'manutencoes') {
                result = await manutencoesService.getAll(userId)
            }
            setData(result)
        } catch (err) {
            console.error('Erro ao carregar registros:', err)
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [activeTab, userId])

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return

        try {
            if (activeTab === 'entregas') await entregasService.delete(id)
            else if (activeTab === 'abastecimentos') await abastecimentosService.delete(id)
            else if (activeTab === 'manutencoes') await manutencoesService.delete(id)

            loadData()
        } catch (err) {
            alert('Erro ao excluir registro')
        }
    }

    const handleEditSubmit = async (formData: any) => {
        try {
            if (activeTab === 'entregas') {
                await entregasService.update(editingItem.id, { ...formData, user_id: userId })
            } else if (activeTab === 'abastecimentos') {
                await abastecimentosService.update(editingItem.id, { ...formData, user_id: userId })
            } else if (activeTab === 'manutencoes') {
                await manutencoesService.update(editingItem.id, { ...formData, user_id: userId })
            }

            setEditingItem(null)
            loadData()
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar registro')
        }
    }

    return (
        <div className="w-full">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('entregas')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'entregas'
                        ? 'bg-primary-light text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                >
                    <Package size={16} /> Entregas
                </button>
                <button
                    onClick={() => setActiveTab('abastecimentos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'abastecimentos'
                        ? 'bg-warning-light text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                >
                    <Fuel size={16} /> Combustível
                </button>
                <button
                    onClick={() => setActiveTab('manutencoes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'manutencoes'
                        ? 'bg-success-light text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                >
                    <Wrench size={16} /> Manutos
                </button>
            </div>

            <Card className="border-none shadow-none bg-gray-50/50 dark:bg-black/20">
                <CardContent className="p-0">
                    {loadingData ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
                    ) : data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-sm">Nenhum registro.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400">Data</th>
                                        {activeTab === 'entregas' && (
                                            <>
                                                <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400">Pacotes</th>
                                                <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400">Receita</th>
                                            </>
                                        )}
                                        {activeTab === 'abastecimentos' && <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400">Valor</th>}
                                        {activeTab === 'manutencoes' && <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400">Valor</th>}
                                        <th className="px-4 py-3 font-bold text-[10px] uppercase text-gray-400 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-50 dark:border-gray-900/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-xs font-medium">
                                                {new Date(item.data).toLocaleDateString('pt-BR')}
                                            </td>
                                            {activeTab === 'entregas' && (
                                                <>
                                                    <td className="px-4 py-3 text-xs">{item.quantidade_pacotes}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-success-light">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.receita)}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'abastecimentos' && (
                                                <td className="px-4 py-3 text-xs font-bold text-danger-light">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_pago)}
                                                </td>
                                            )}
                                            {activeTab === 'manutencoes' && (
                                                <td className="px-4 py-3 text-xs font-bold text-danger-light">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingItem(item)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-primary-light/10 text-primary-light hover:bg-primary-light hover:text-white rounded-md transition-all text-[10px] font-bold"
                                                >
                                                    <Edit2 size={12} />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-gray-300 hover:text-danger-light rounded-md"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sub-modal de Edição */}
            {editingItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
                    <div className="w-full max-w-lg relative bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black">Editar Registro</h3>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {activeTab === 'entregas' && (
                            <EntregaForm
                                initialData={editingItem}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setEditingItem(null)}
                            />
                        )}

                        {activeTab === 'abastecimentos' && (
                            <AbastecimentoForm
                                initialData={editingItem}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setEditingItem(null)}
                            />
                        )}

                        {activeTab === 'manutencoes' && (
                            <ManutencaoForm
                                initialData={editingItem}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setEditingItem(null)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
