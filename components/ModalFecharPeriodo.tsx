'use client'

import { useState } from 'react'
import { subDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, Calendar, CheckCircle, TrendingUp, Filter } from 'lucide-react'
import { useAuth } from '@/lib/supabase/auth-context'
import { createClient } from '@/lib/supabase/client'
import { fechamentoService } from '@/lib/services/fechamento.service'

type TipoPeriodo = 'semanal' | 'quinzenal' | 'mensal' | 'personalizado'

interface FechamentoResult {
    total_entregas: number
    total_ganhos: number
    total_abastecimentos: number
    total_manutencoes: number
    lucro_liquido: number
    ticket_medio: number
    data_inicio: string
    data_fim: string
}

export function ModalFecharPeriodo({ onClose }: { onClose: () => void }) {
    const [etapa, setEtapa] = useState<'selecionar' | 'resultado'>('selecionar')
    const [tipo, setTipo] = useState<TipoPeriodo>('mensal')
    const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [resultado, setResultado] = useState<FechamentoResult | null>(null)
    const [loading, setLoading] = useState(false)

    const getPeriodoDatas = (t: TipoPeriodo) => {
        const hoje = new Date()
        const fim = format(hoje, 'yyyy-MM-dd')
        const diasMap = { semanal: 7, quinzenal: 15, mensal: 30 }

        if (t === 'personalizado') return { inicio: dataInicio, fim: dataFim }

        const inicio = format(subDays(hoje, diasMap[t as keyof typeof diasMap]), 'yyyy-MM-dd')
        return { inicio, fim }
    }

    const { user } = useAuth()
    const supabase = createClient()

    const handleGerarResumo = async () => {
        setLoading(true)
        try {
            const { inicio, fim } = getPeriodoDatas(tipo)

            // 1. Verificar usuário
            const {
                data: { user: currentUser },
                error: userError,
            } = await supabase.auth.getUser()

            if (userError || !currentUser) {
                alert('Usuário não autenticado')
                return
            }

            // 2. Verificar se já existe um fechamento para este período
            const { data: existente, error: erroConsulta } = await (supabase
                .from('fechamentos')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('data_inicio', inicio)
                .eq('data_fim', fim) as any)
                .maybeSingle()

            if (erroConsulta) {
                alert(`Erro ao verificar fechamento - ${erroConsulta.message}`)
                return
            }

            if (existente) {
                alert('Já existe um fechamento salvo para esse período.')
                return
            }

            // 3. Chamar a RPC para calcular os totais
            const { data: resumo, error: resumoError } = await (supabase.rpc as any)('resumo_periodo', {
                data_inicio: inicio,
                data_fim: fim,
            })

            if (resumoError) {
                console.error('ERRO RESUMO:', resumoError)
                alert(`Erro ao calcular resumo - ${resumoError.message}`)
                return
            }

            const item = Array.isArray(resumo) ? resumo[0] : resumo

            if (!item) {
                alert('Nenhum dado encontrado para este período.')
                return
            }

            // 4. Inserir na tabela de fechamentos via serviço centralizado
            const fechamentoSalvo = await fechamentoService.realizarFechamento(currentUser.id, inicio, fim, {
                tipo_periodo: tipo,
                entregas: item.total_entregas,
                ganhos: item.total_ganhos,
                abastecimentos: item.total_abastecimentos,
                manutencoes: item.total_manutencoes,
                lucro: item.lucro_liquido,
                ticket: item.total_entregas > 0 ? Number(item.total_ganhos) / item.total_entregas : 0
            })

            alert('Fechamento salvo com sucesso!')

            // 5. Atualizar o estado para mostrar o resultado na UI
            setResultado({
                ...fechamentoSalvo,
                total_ganhos: Number(fechamentoSalvo.total_ganhos),
                total_abastecimentos: Number(fechamentoSalvo.total_abastecimentos),
                total_manutencoes: Number(fechamentoSalvo.total_manutencoes),
                lucro_liquido: Number(fechamentoSalvo.lucro_liquido),
                total_entregas: Number(fechamentoSalvo.total_entregas),
                ticket_medio: Number(fechamentoSalvo.ticket_medio)
            })
            setEtapa('resultado')

        } catch (error: any) {
            console.error('Erro geral:', error)
            alert(error.message || 'Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    const formatMoeda = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })
    }

    if (etapa === 'resultado' && resultado) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" />
                                Resumo do Período
                            </h2>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-8 rounded-2xl bg-white/5 p-4 text-center border border-white/5">
                            <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">Intervalo selecionado</p>
                            <p className="text-sm font-semibold text-white">
                                {formatDate(resultado.data_inicio)} — {formatDate(resultado.data_fim)}
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                                <span className="text-sm font-medium text-emerald-100/70">🟢 Ganhos Totais</span>
                                <strong className="text-lg text-emerald-400">{formatMoeda(resultado.total_ganhos)}</strong>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20">
                                <span className="text-sm font-medium text-rose-100/70">🔴 Combustível</span>
                                <strong className="text-lg text-rose-400">-{formatMoeda(resultado.total_abastecimentos)}</strong>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20">
                                <span className="text-sm font-medium text-rose-100/70">🔴 Manutenção</span>
                                <strong className="text-lg text-rose-400">-{formatMoeda(resultado.total_manutencoes)}</strong>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-white">💰 Lucro Líquido</span>
                                    <strong className={`text-2xl font-black ${resultado.lucro_liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatMoeda(resultado.lucro_liquido)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center">
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-1">📦 Entregas</p>
                                <p className="text-lg font-bold text-white">{resultado.total_entregas}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center">
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-1">🎯 Ticket Médio</p>
                                <p className="text-lg font-bold text-white">{formatMoeda(resultado.ticket_medio)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onClose}
                                className="w-full rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Concluído & Salvo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-blue-400" />
                            Gerar Fechamento
                        </h2>
                        <button onClick={onClose} className="text-white/40 hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-3 mb-8">
                        {(['semanal', 'quinzenal', 'mensal', 'personalizado'] as TipoPeriodo[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTipo(t)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${tipo === t
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${tipo === t ? 'bg-blue-400 animate-pulse' : 'bg-white/20'}`} />
                                    <span className="font-semibold capitalize">{t}</span>
                                </div>
                                <span className="text-[10px] font-bold opacity-60">
                                    {t === 'semanal' && '7 DIAS'}
                                    {t === 'quinzenal' && '15 DIAS'}
                                    {t === 'mensal' && '30 DIAS'}
                                    {t === 'personalizado' && <Filter size={14} />}
                                </span>
                            </button>
                        ))}
                    </div>

                    {tipo === 'personalizado' && (
                        <div className="grid grid-cols-2 gap-3 mb-8 animate-in slide-in-from-top-4 duration-300">
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2 mb-1 block">Início</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={e => setDataInicio(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2 mb-1 block">Fim</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={e => setDataFim(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-blue-500 transition"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGerarResumo}
                            disabled={loading}
                            className="flex-[2] rounded-2xl bg-blue-500 py-4 text-sm font-black text-white hover:bg-blue-600 disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
                        >
                            {loading ? 'Calculando...' : 'GERAR RESUMO'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
