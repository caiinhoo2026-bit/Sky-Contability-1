'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, History, Package, Fuel, Wrench, TrendingUp, Calendar } from 'lucide-react'

interface Fechamento {
    id: string
    tipo_periodo: string
    data_inicio: string
    data_fim: string
    total_entregas: number
    total_ganhos: number
    total_combustivel: number
    total_manutencao: number
    lucro_liquido: number
    ticket_medio: number
    criado_em: string
}

export default function HistoricoPage() {
    const router = useRouter()
    const supabase = createClient()
    const [historico, setHistorico] = useState<Fechamento[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('fechamentos')
                .select('*')
                .eq('user_id', user.id)
                .order('criado_em', { ascending: false })

            if (!error) setHistorico(data || [])
            setLoading(false)
        }
        load()
    }, [router, supabase])

    const formatMoeda = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr + 'T12:00:00'), "dd/MM", { locale: ptBR })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <History className="animate-spin text-blue-500" size={48} />
                    <p className="font-bold tracking-widest text-white/40">CARREGANDO HISTÓRICO...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <div className="mx-auto max-w-2xl px-6 pt-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                        <History className="text-blue-500" />
                        MEU HISTÓRICO
                    </h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {historico.length === 0 ? (
                    <div className="rounded-[32px] border border-white/5 bg-white/5 p-12 text-center">
                        <History className="mx-auto text-white/10 mb-4" size={64} />
                        <p className="text-white/40 font-medium">Você ainda não gerou nenhum relatório de fechamento.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {historico.map((h) => (
                            <div
                                key={h.id}
                                className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-white/5 p-6 hover:border-white/10 transition-all active:scale-95"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white/40 uppercase tracking-tighter">
                                                {h.tipo_periodo}
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {formatDate(h.data_inicio)} — {formatDate(h.data_fim)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Lucro Líquido</p>
                                        <p className={`text-xl font-black ${h.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatMoeda(h.lucro_liquido)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/5">
                                    <div className="text-center">
                                        <Package size={14} className="mx-auto text-white/20 mb-1" />
                                        <p className="text-[10px] text-white/40 font-bold">{h.total_entregas} entr.</p>
                                    </div>
                                    <div className="text-center border-x border-white/5">
                                        <Fuel size={14} className="mx-auto text-white/20 mb-1" />
                                        <p className="text-[10px] text-white/40 font-bold">{formatMoeda(h.total_combustivel)}</p>
                                    </div>
                                    <div className="text-center">
                                        <Wrench size={14} className="mx-auto text-white/20 mb-1" />
                                        <p className="text-[10px] text-white/40 font-bold">{formatMoeda(h.total_manutencao)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-bold text-white/40">
                                        <TrendingUp size={12} />
                                        Ticket Médio: {formatMoeda(h.ticket_medio || 0)}
                                    </div>
                                    <span className="text-[10px] text-white/20 font-medium">
                                        {format(new Date(h.criado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
