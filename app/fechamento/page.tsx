'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'



function getNextClosingDate(cycle: BillingCycle, closingDay: number | null, anchorDate: string | null) {
    const now = new Date()

    // Weekly: closingDay = 0..6 (0=domingo)
    if (cycle === 'weekly') {
        if (closingDay === null) return null
        const d = new Date(now)
        const diff = (closingDay - d.getDay() + 7) % 7
        d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
        d.setHours(0, 0, 0, 0)
        return d
    }

    // Biweekly: anchorDate = YYYY-MM-DD
    if (cycle === 'biweekly') {
        if (!anchorDate) return null
        const anchor = new Date(anchorDate + 'T00:00:00')
        const ms14 = 14 * 24 * 60 * 60 * 1000
        let t = anchor.getTime()
        while (t <= now.getTime()) t += ms14
        return new Date(t)
    }

    // Monthly: closingDay = 1..28 (recomendado)
    if (cycle === 'monthly') {
        if (closingDay === null) return null
        const year = now.getFullYear()
        const month = now.getMonth()
        const candidate = new Date(year, month, closingDay, 0, 0, 0, 0)
        if (candidate.getTime() <= now.getTime()) {
            return new Date(year, month + 1, closingDay, 0, 0, 0, 0)
        }
        return candidate
    }

    return null
}

import { fechamentoService, BillingCycle, FechamentoRealizado } from '@/lib/services/fechamento.service'
import { useAuth } from '@/lib/supabase/auth-context'
import { Button } from '@/components/ui/Button'
import { calculosService } from '@/lib/services/calculos.service'
import { ModalFecharPeriodo } from '@/components/ModalFecharPeriodo'
import { pdfService } from '@/lib/services/pdf.service'
import { FileDown } from 'lucide-react'

export default function FechamentoPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [cycle, setCycle] = useState<BillingCycle>('monthly')
    const [closingDay, setClosingDay] = useState<number | null>(10)
    const [anchorDate, setAnchorDate] = useState<string | null>(null)

    const [isSaving, setIsSaving] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [historico, setHistorico] = useState<FechamentoRealizado[]>([])

    // O effectiveUserId usado no dashboard
    const effectiveUserId: string = user?.id || '00000000-0000-0000-0000-000000000000'

    // Carregar dados salvos no banco de dados
    useEffect(() => {
        let mounted = true

        async function load() {
            if (authLoading) return
            setIsLoadingData(true)

            try {
                const [regraJaSalva, hist] = await Promise.all([
                    fechamentoService.getRegra(effectiveUserId),
                    fechamentoService.getHistorico(effectiveUserId)
                ])

                if (!mounted) return

                setHistorico(hist)

                if (regraJaSalva) {
                    setCycle(regraJaSalva.ciclo)
                    setClosingDay(regraJaSalva.dia_fechamento)
                    if (regraJaSalva.data_ancora) {
                        setAnchorDate(regraJaSalva.data_ancora)
                    }
                } else {
                    const today = new Date()
                    const yyyy = today.getFullYear()
                    const mm = String(today.getMonth() + 1).padStart(2, '0')
                    const dd = String(today.getDate()).padStart(2, '0')
                    setAnchorDate(`${yyyy}-${mm}-${dd}`)
                }
            } catch (err: any) {
                console.error('Erro ao carregar dados:', err.message || err)
            } finally {
                if (mounted) setIsLoadingData(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [effectiveUserId, authLoading])

    // Ajustes automáticos quando troca o tipo NA INTERFACE
    useEffect(() => {
        if (isLoadingData) return

        if (cycle === 'weekly' && closingDay === null) {
            setClosingDay(5)
            setAnchorDate(null)
        }
        if (cycle === 'biweekly' && !anchorDate) {
            setClosingDay(null)
            const today = new Date()
            const yyyy = today.getFullYear()
            const mm = String(today.getMonth() + 1).padStart(2, '0')
            const dd = String(today.getDate()).padStart(2, '0')
            setAnchorDate(`${yyyy}-${mm}-${dd}`)
        }
        if (cycle === 'monthly' && closingDay === null) {
            setClosingDay(10)
            setAnchorDate(null)
        }
    }, [cycle, isLoadingData, closingDay, anchorDate])

    const nextClosing = useMemo(() => getNextClosingDate(cycle, closingDay, anchorDate), [cycle, closingDay, anchorDate])

    const nextClosingLabel = useMemo(() => {
        if (!nextClosing) return '—'
        return nextClosing.toLocaleDateString('pt-BR')
    }, [nextClosing])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await fechamentoService.saveRegra(effectiveUserId, cycle, closingDay, anchorDate)
            alert('Regra salva com sucesso!')
        } catch (error: any) {
            console.error(error)
            alert('Erro ao salvar regra: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFecharPeriodo = async () => {
        setIsModalOpen(true)
    }

    const handleExportPDF = async (fechamentoId: string, periodo: string) => {
        try {
            await pdfService.exportElementToPDF(`fechamento-${fechamentoId}`, `fechamento-${periodo.replace(/ /g, '_')}.pdf`)
        } catch (error) {
            alert('Erro ao exportar PDF. Tente novamente.')
        }
    }

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>Carregando configurações...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-6 py-10 text-white pb-20">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Fechamento do Cliente</h1>
                        <p className="text-white/60 mt-1">Escolha como o cliente fecha: semanal, quinzenal ou mensal.</p>
                    </div>

                    <button
                        onClick={() => router.push('/historico')}
                        className="rounded-2xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 text-sm font-bold transition flex items-center gap-2"
                    >
                        Ver Histórico
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm transition"
                    >
                        Voltar
                    </button>
                </div>

                {/* Card Regras */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] mb-8">
                    <div className="grid gap-5">
                        {/* Tipo */}
                        <div>
                            <label className="text-sm text-white/70">Tipo de fechamento</label>
                            <select
                                value={cycle}
                                onChange={(e) => setCycle(e.target.value as BillingCycle)}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                            >
                                <option value="weekly">Semanal</option>
                                <option value="biweekly">Quinzenal</option>
                                <option value="monthly">Mensal</option>
                            </select>
                        </div>

                        {/* Condicional: Semanal */}
                        {cycle === 'weekly' && (
                            <div>
                                <label className="text-sm text-white/70">Dia da semana do fechamento</label>
                                <select
                                    value={closingDay ?? 5}
                                    onChange={(e) => setClosingDay(Number(e.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                >
                                    <option value={0}>Domingo</option>
                                    <option value={1}>Segunda</option>
                                    <option value={2}>Terça</option>
                                    <option value={3}>Quarta</option>
                                    <option value={4}>Quinta</option>
                                    <option value={5}>Sexta</option>
                                    <option value={6}>Sábado</option>
                                </select>
                            </div>
                        )}

                        {/* Condicional: Quinzenal */}
                        {cycle === 'biweekly' && (
                            <div>
                                <label className="text-sm text-white/70">Data base (âncora) do fechamento quinzenal</label>
                                <input
                                    type="date"
                                    value={anchorDate ?? ''}
                                    onChange={(e) => setAnchorDate(e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                />
                                <p className="text-xs text-white/50 mt-2">
                                    O sistema fecha a cada 14 dias a partir dessa data.
                                </p>
                            </div>
                        )}

                        {/* Condicional: Mensal */}
                        {cycle === 'monthly' && (
                            <div>
                                <label className="text-sm text-white/70">Dia do mês do fechamento</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={28}
                                    value={closingDay ?? 10}
                                    onChange={(e) => setClosingDay(Number(e.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                                />
                                <p className="text-xs text-white/50 mt-2">
                                    Recomendado usar 1–28 para evitar problemas em meses curtos.
                                </p>
                            </div>
                        )}

                        {/* Preview */}
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-white/70">Próximo fechamento previsto:</p>
                            <p className="text-lg font-semibold mt-1">{nextClosingLabel}</p>
                        </div>

                        {/* Botões */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 rounded-2xl bg-white text-black font-semibold py-3 px-4 hover:bg-white/90 transition"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar regra do cliente'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="flex-1 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-blue-400 font-semibold py-3 px-4 transition"
                            >
                                Fechar período agora
                            </button>
                        </div>
                    </div>
                </div>

                {/* Histórico */}
                <div className="mt-12">
                    <h2 className="text-xl font-semibold mb-4">Histórico de Fechamentos</h2>
                    {historico.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                            <p className="text-white/50">Nenhum fechamento realizado ainda.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {historico.map((h) => (
                                <div
                                    key={h.id}
                                    id={`fechamento-${h.id}`}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div>
                                        <p className="font-medium">Período: {new Date(h.data_inicio).toLocaleDateString('pt-BR')} a {new Date(h.data_fim).toLocaleDateString('pt-BR')}</p>
                                        <div className="flex gap-4 mt-1 text-xs text-white/50">
                                            <span>{h.total_entregas} entregas</span>
                                            <span>Ticket Médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.ticket_medio || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-success-light dark:text-success-dark font-bold text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.lucro_liquido)}
                                            </p>
                                            <p className="text-[10px] text-white/30">{new Date(h.created_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleExportPDF(h.id, `${new Date(h.data_inicio).toLocaleDateString('pt-BR')}-a-${new Date(h.data_fim).toLocaleDateString('pt-BR')}`)}
                                            title="Exportar PDF"
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                        >
                                            <FileDown size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <ModalFecharPeriodo onClose={() => setIsModalOpen(false)} />}
        </div>
    )
}

