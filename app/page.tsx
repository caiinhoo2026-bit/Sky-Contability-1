'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, TrendingDown, Package, DollarSign, Fuel, Wrench, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/supabase/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import Image from 'next/image'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  action?: React.ReactNode
}

function MetricCard({ title, value, subtitle, trend, icon, action }: MetricCardProps) {
  const trendColors = {
    up: 'text-success-light dark:text-success-dark',
    down: 'text-danger-light dark:text-danger-dark',
    neutral: 'text-text-secondary-light dark:text-text-secondary-dark',
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-primary-light dark:text-primary-dark">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${trend ? trendColors[trend] : ''}`}>
                {trend === 'up' && <TrendingUp size={16} />}
                {trend === 'down' && <TrendingDown size={16} />}
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EntregaForm } from '@/components/forms/EntregaForm'
import { AbastecimentoForm } from '@/components/forms/AbastecimentoForm'
import { ManutencaoForm } from '@/components/forms/ManutencaoForm'
import { RegistrosTable } from '@/components/RegistrosTable'
import { entregasService } from '@/lib/services/entregas.service'
import { abastecimentosService } from '@/lib/services/abastecimentos.service'
import { manutencoesService } from '@/lib/services/manutencoes.service'
import { calculosService } from '@/lib/services/calculos.service'
import { EntregaFormData, AbastecimentoFormData, ManutencaoFormData } from '@/lib/validations/schemas'
import { ExportData } from '@/components/ExportData'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [modalOpen, setModalOpen] = useState<'entrega' | 'abastecimento' | 'manutencao' | 'registros' | null>(null)
  const [selectedTab, setSelectedTab] = useState<'entregas' | 'abastecimentos' | 'manutencoes'>('entregas')

  // Lista inicial de IDs dos cards para reordenação
  const [cardOrder, setCardOrder] = useState<string[]>(['receita', 'entregas', 'lucro'])
  const [dataLoading, setDataLoading] = useState(true)

  // ID de usuário para modo teste/convidado (Sempre uma string)
  const effectiveUserId: string = user?.id || '00000000-0000-0000-0000-000000000000'

  const [metricas, setMetricas] = useState({
    receita: 'R$ 0,00',
    entregas: 0,
    lucroLiquido: 'R$ 0,00',
    margem: '0%',
    custoCombustivel: 'R$ 0,00',
    custoManutencao: 'R$ 0,00',
    custoManutencaoDiluido: 'R$ 0,00',
    kmRodados: '0.0 km',
    custoPorKm: 'R$ 0,00',
    pontoEquilibrio: '0 entregas',
    resumoMes: {
      total_ganhos: 0,
      lucro_liquido: 0,
      total_entregas: 0
    }
  })
  const [chartData, setChartData] = useState<any[]>([])

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const loadData = async () => {
    try {
      const g = await calculosService.calcularGeral(effectiveUserId)
      if (!mounted.current) return

      setMetricas({
        receita: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.receita_total),
        entregas: g.total_pacotes,
        lucroLiquido: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.lucro_liquido),
        margem: `${g.margem_percentual.toFixed(1)}%`,
        custoCombustivel: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.total_combustivel),
        custoManutencao: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.total_manutencao_paga),
        custoManutencaoDiluido: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.total_manutencao)}`,
        kmRodados: `${g.total_km_rodado.toFixed(1)} km`,
        custoPorKm: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.custo_medio_km),
        pontoEquilibrio: `${Math.ceil(g.ponto_equilibrio)} entregas`,
        resumoMes: metricas.resumoMes // Mantém o valor anterior ou o default
      })

      // Gerar dados para o gráfico (simulado por enquanto com dados gerais, 
      // idealmente viria de uma série histórica)
      setChartData([
        { name: 'Total', receita: g.receita_total, lucro: g.lucro_liquido }
      ])

      // Buscar resumo do mês atual via RPC
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      const fimHoje = hoje.toISOString().split('T')[0]

      const { data: resumoMesData, error: rpcError } = await (supabase.rpc as any)('resumo_periodo', {
        data_inicio: inicioMes,
        data_fim: fimHoje
      })

      console.log('Dashboard resumo_periodo data:', resumoMesData)
      console.log('Dashboard resumo_periodo error:', rpcError)

      if (resumoMesData && resumoMesData[0]) {
        setMetricas(prev => ({
          ...prev,
          resumoMes: resumoMesData[0]
        }))
      }
    } catch (err: any) {
      if (!mounted.current) return
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
      console.error('Erro ao carregar dados:', err?.message || err)
    }
  }

  // Efeitos para persistência do layout
  useEffect(() => {
    const savedOrder = localStorage.getItem('shopee_dashboard_order')
    if (savedOrder) {
      try {
        setCardOrder(JSON.parse(savedOrder))
      } catch (e) {
        console.error('Erro ao carregar ordem dos cards')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('shopee_dashboard_order', JSON.stringify(cardOrder))
  }, [cardOrder])

  const renderMetricCard = (id: string, index: number) => {
    const cardContent = (() => {
      switch (id) {
        case 'receita':
          return (
            <MetricCard
              title="Receita Total"
              value={metricas.receita}
              subtitle="Baseado em pacotes"
              icon={<DollarSign size={24} />}
            />
          )
        case 'entregas':
          return (
            <MetricCard
              title="Total de Entregas"
              value={metricas.entregas}
              subtitle="Total de pacotes"
              icon={<Package size={24} />}
              action={
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => setModalOpen('entrega')} className="bg-primary-light hover:bg-primary-light/90 text-white">
                    Adicionar
                  </Button>
                  <button
                    onClick={() => {
                      setSelectedTab('entregas')
                      setModalOpen('registros')
                    }}
                    className="text-[10px] text-center font-bold text-gray-400 hover:text-primary-light underline"
                  >
                    Ver/Editar
                  </button>
                </div>
              }
            />
          )
        case 'lucro':
          return (
            <MetricCard
              title="Lucro Líquido"
              value={metricas.lucroLiquido}
              subtitle={`Margem: ${metricas.margem}`}
              trend="neutral"
              icon={<TrendingUp size={24} />}
            />
          )
        default:
          return null
      }
    })()

    const moveCard = (dragIndex: number, hoverIndex: number) => {
      const newOrder = [...cardOrder]
      const draggedCard = newOrder[dragIndex]
      newOrder.splice(dragIndex, 1)
      newOrder.splice(hoverIndex, 0, draggedCard)
      setCardOrder(newOrder)
    }

    return (
      <motion.div
        key={id}
        layout
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          const threshold = 50
          let nextIndex = index
          if (info.offset.x > threshold) nextIndex = index + 1
          else if (info.offset.x < -threshold) nextIndex = index - 1

          if (nextIndex !== index && nextIndex >= 0 && nextIndex < cardOrder.length) {
            moveCard(index, nextIndex)
          }
        }}
        whileDrag={{
          scale: 1.05,
          zIndex: 50,
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
          cursor: "grabbing"
        }}
        className="relative cursor-grab"
      >
        {cardContent}
      </motion.div>
    )
  }

  useEffect(() => {
    const isTestMode = typeof window !== 'undefined' && localStorage.getItem('shopee_modo_teste') === 'true'

    if (!loading && !user && !isTestMode) {
      router.push('/login')
    } else if (user || isTestMode) {
      loadData().then(() => {
        if (mounted.current) setDataLoading(false)
      })
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopee_modo_teste')
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleEntregaSubmit = async (data: EntregaFormData) => {
    await entregasService.create({ ...data, user_id: effectiveUserId })
    setModalOpen(null)
    loadData()
  }

  const handleAbastecimentoSubmit = async (data: AbastecimentoFormData) => {
    await abastecimentosService.create({ ...data, user_id: effectiveUserId })
    setModalOpen(null)
    loadData()
  }

  const handleManutencaoSubmit = async (data: ManutencaoFormData) => {
    await manutencoesService.create({ ...data, user_id: effectiveUserId })
    setModalOpen(null)
    loadData()
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark relative overflow-hidden">


      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/" className="inline-flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.03 }}
                className="relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/skylogo3,0.png"
                  alt="Sky Contability"
                  style={{ height: '220px', width: 'auto', maxWidth: '280px', objectFit: 'contain' }}
                  className="drop-shadow-[0_0_18px_rgba(37,99,235,0.18)]"
                />
              </motion.div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Bem-vindo, {user?.email?.split('@')[0] || 'Convidado'}
            </p>
            <button
              onClick={handleLogout}
              className="p-2 rounded-ios bg-surface-light dark:bg-surface-dark shadow-ios hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-danger-light"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cardOrder.map((id, index) => renderMetricCard(id, index))}

          {/* Nova Coluna / Card de Resumo do Mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 rounded-[32px] border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-sm flex flex-col justify-between"
          >
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Preview do Mês</p>
              <h3 className="text-sm font-bold text-white/60 mb-4">Relatório em Tempo Real</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Ganhos</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.resumoMes.total_ganhos)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Entregas</span>
                  <span className="text-sm font-bold text-white">{metricas.resumoMes.total_entregas}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-white/40 uppercase">Lucro Previsto</span>
                <span className={`text-xl font-black ${metricas.resumoMes.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.resumoMes.lucro_liquido)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gráfico e Ponto de Equilíbrio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Desempenho Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${value}`} />
                    <Tooltip
                      formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" name="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    KM Rodados
                  </p>
                  <p className="text-2xl font-bold">{metricas.kmRodados}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Custo por KM
                  </p>
                  <p className="text-2xl font-bold">{metricas.custoPorKm}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Ponto de Equilíbrio
                  </p>
                  <p className="text-2xl font-bold text-success-light dark:text-success-dark">
                    {metricas.pontoEquilibrio}
                  </p>
                  <p className="text-xs text-text-secondary-light mt-1">
                    Entregas mínimas para cobrir custos
                  </p>
                </div>

                {/* BOTÃO: Fechamento do Cliente (abaixo de Ponto de Equilíbrio) */}
                <button
                  type="button"
                  onClick={() => router.push('/fechamento')}
                  className="w-full mt-3 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 text-white py-3 px-4 transition"
                >
                  Fechamento do Cliente
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <MetricCard
            title="Custo Combustível"
            value={metricas.custoCombustivel}
            subtitle="Soma dos abastecimentos"
            icon={<Fuel size={24} />}
            action={
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen('abastecimento')} className="border-warning-light text-warning-light hover:bg-warning-light/10">
                  Adicionar
                </Button>
                <button
                  onClick={() => {
                    setSelectedTab('abastecimentos')
                    setModalOpen('registros')
                  }}
                  className="text-[10px] text-center font-bold text-gray-400 hover:text-primary-light underline"
                >
                  Ver/Editar
                </button>
              </div>
            } />
          <MetricCard
            title="Custo Manutenção"
            value={metricas.custoManutencao}
            subtitle={`Projeção por KM: ${metricas.custoManutencaoDiluido}`}
            icon={<Wrench size={24} className="text-primary-light" />}
            action={
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen('manutencao')} className="border-success-light text-success-light hover:bg-success-light/10">
                  Adicionar
                </Button>
                <button
                  onClick={() => {
                    setSelectedTab('manutencoes')
                    setModalOpen('registros')
                  }}
                  className="text-[10px] text-center font-bold text-gray-400 hover:text-primary-light underline"
                >
                  Ver/Editar
                </button>
              </div>
            } />
        </div>

        {/* Modais */}
        <Modal
          isOpen={modalOpen === 'entrega'}
          onClose={() => setModalOpen(null)}
          title="Cadastrar Entrega"
        >
          <EntregaForm onSubmit={handleEntregaSubmit} onCancel={() => setModalOpen(null)} />
        </Modal>

        <Modal
          isOpen={modalOpen === 'abastecimento'}
          onClose={() => setModalOpen(null)}
          title="Cadastrar Abastecimento"
        >
          <AbastecimentoForm onSubmit={handleAbastecimentoSubmit} onCancel={() => setModalOpen(null)} />
        </Modal>

        <Modal
          isOpen={modalOpen === 'manutencao'}
          onClose={() => setModalOpen(null)}
          title="Cadastrar Manutenção"
        >
          <ManutencaoForm onSubmit={handleManutencaoSubmit} onCancel={() => setModalOpen(null)} />
        </Modal>

        <Modal
          isOpen={modalOpen === 'registros'}
          onClose={() => {
            setModalOpen(null)
            loadData() // Refresh dashboard stats after edits
          }}
          title="Histórico e Edição"
        >
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <RegistrosTable userId={effectiveUserId} initialTab={selectedTab} />
          </div>
        </Modal>
      </div>
    </div>
  )
}
