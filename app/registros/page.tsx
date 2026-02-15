'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { entregasService } from '@/lib/services/entregas.service'
import { abastecimentosService } from '@/lib/services/abastecimentos.service'
import { manutencoesService } from '@/lib/services/manutencoes.service'
import { Trash2, Edit2, ArrowLeft, Package, Fuel, Wrench, X } from 'lucide-react'
import { EntregaForm } from '@/components/forms/EntregaForm'
import { AbastecimentoForm } from '@/components/forms/AbastecimentoForm'
import { ManutencaoForm } from '@/components/forms/ManutencaoForm'
import Link from 'next/link'

export default function RegistrosPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const initialTab = searchParams?.get('tab') as 'entregas' | 'abastecimentos' | 'manutencoes' | null
    const [activeTab, setActiveTab] = useState<'entregas' | 'abastecimentos' | 'manutencoes'>(initialTab || 'entregas')
    const [data, setData] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [editingItem, setEditingItem] = useState<any | null>(null)

    const effectiveUserId = user?.id || '00000000-0000-0000-0000-000000000000'

    const loadData = async () => {
        setLoadingData(true)
        try {
            let result: any[] = []
            if (activeTab === 'entregas') {
                result = await entregasService.getAll(effectiveUserId)
            } else if (activeTab === 'abastecimentos') {
                result = await abastecimentosService.getAll(effectiveUserId)
            } else if (activeTab === 'manutencoes') {
                result = await manutencoesService.getAll(effectiveUserId)
            }
            setData(result)
        } catch (err) {
            console.error('Erro ao carregar registros:', err)
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        const isTestMode = typeof window !== 'undefined' && localStorage.getItem('shopee_modo_teste') === 'true'

        if (!loading && !user && !isTestMode) {
            router.push('/login')
        } else if (user || isTestMode) {
            loadData()
        }
    }, [user, loading, activeTab, router])

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
                await entregasService.update(editingItem.id, { ...formData, user_id: effectiveUserId })
            } else if (activeTab === 'abastecimentos') {
                await abastecimentosService.update(editingItem.id, { ...formData, user_id: effectiveUserId })
            } else if (activeTab === 'manutencoes') {
                await manutencoesService.update(editingItem.id, { ...formData, user_id: effectiveUserId })
            }

            setEditingItem(null)
            loadData()
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar registro')
        }
    }

    if (loading) return <div className="flex justify-center p-20">Carregando...</div>

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft size={24} />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Histórico de Registros
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('entregas')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-ios font-medium transition-all ${activeTab === 'entregas'
                            ? 'bg-primary-light dark:bg-primary-dark text-white'
                            : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark shadow-ios'
                            }`}
                    >
                        <Package size={18} /> Entregas
                    </button>
                    <button
                        onClick={() => setActiveTab('abastecimentos')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-ios font-medium transition-all ${activeTab === 'abastecimentos'
                            ? 'bg-warning-light dark:bg-warning-dark text-white'
                            : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark shadow-ios'
                            }`}
                    >
                        <Fuel size={18} /> Abastecimentos
                    </button>
                    <button
                        onClick={() => setActiveTab('manutencoes')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-ios font-medium transition-all ${activeTab === 'manutencoes'
                            ? 'bg-success-light dark:bg-success-dark text-white'
                            : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark shadow-ios'
                            }`}
                    >
                        <Wrench size={18} /> Manutenções
                    </button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loadingData ? (
                            <div className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                Carregando...
                            </div>
                        ) : data.length === 0 ? (
                            <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                Nenhum registro encontrado nesta categoria.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-6 py-4 font-semibold text-sm">Data</th>
                                            {activeTab === 'entregas' && (
                                                <>
                                                    <th className="px-6 py-4 font-semibold text-sm">Pacotes</th>
                                                    <th className="px-6 py-4 font-semibold text-sm">KM Total</th>
                                                    <th className="px-6 py-4 font-semibold text-sm">Receita</th>
                                                </>
                                            )}
                                            {activeTab === 'abastecimentos' && (
                                                <>
                                                    <th className="px-6 py-4 font-semibold text-sm">Valor Pago</th>
                                                </>
                                            )}
                                            {activeTab === 'manutencoes' && (
                                                <>
                                                    <th className="px-6 py-4 font-semibold text-sm">Tipo</th>
                                                    <th className="px-6 py-4 font-semibold text-sm">Valor</th>
                                                    <th className="px-6 py-4 font-semibold text-sm">KM Troca</th>
                                                </>
                                            )}
                                            <th className="px-6 py-4 font-semibold text-sm text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="px-6 py-4 text-sm">
                                                    {new Date(item.data).toLocaleDateString('pt-BR')}
                                                </td>
                                                {activeTab === 'entregas' && (
                                                    <>
                                                        <td className="px-6 py-4 text-sm font-medium">{item.quantidade_pacotes}</td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">{item.km_total} km</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-success-light dark:text-success-dark">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.receita)}
                                                        </td>
                                                    </>
                                                )}
                                                {activeTab === 'abastecimentos' && (
                                                    <>
                                                        <td className="px-6 py-4 text-sm font-bold text-danger-light dark:text-danger-dark">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_pago)}
                                                        </td>
                                                    </>
                                                )}
                                                {activeTab === 'manutencoes' && (
                                                    <>
                                                        <td className="px-6 py-4 text-sm">
                                                            <span className="capitalize bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                                                {item.tipo}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-danger-light dark:text-danger-dark">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">{item.km_troca} km</td>
                                                    </>
                                                )}
                                                <td className="px-6 py-4 text-right flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-light/10 text-primary-light hover:bg-primary-light hover:text-white rounded-lg transition-all text-xs font-bold border border-primary-light/20"
                                                    >
                                                        <Edit2 size={14} />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-danger-light hover:bg-danger-light/10 rounded-lg transition-all text-xs font-bold"
                                                    >
                                                        <Trash2 size={14} />
                                                        Excluir
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
            </div>

            {/* Modal de Edição */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg relative">
                        <button
                            onClick={() => setEditingItem(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>

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
