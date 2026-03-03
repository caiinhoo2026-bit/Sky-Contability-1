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

import { createClient } from '@/lib/supabase/client'
import { fechamentoService, BillingCycle } from '@/lib/services/fechamento.service'
import { useAuth } from '@/lib/supabase/auth-context'
import { Button } from '@/components/ui/Button'

export default function FechamentoPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [cycle, setCycle] = useState<BillingCycle>('monthly')
    const [closingDay, setClosingDay] = useState<number | null>(10)
    const [anchorDate, setAnchorDate] = useState<string | null>(null)

    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)

    // O effectiveUserId usado no dashboard
    const effectiveUserId: string = user?.id || '00000000-0000-0000-0000-000000000000'

    // Carregar dados salvos no banco de dados (usando o padrão seguro sem signal)
    useEffect(() => {
        let mounted = true

        async function load() {
            if (authLoading) return // espera decidir quem é o user
            setIsLoadingData(true)

            try {
                const regraJaSalva = await fechamentoService.getRegra(effectiveUserId)
                if (!mounted) return

                if (regraJaSalva) {
                    setCycle(regraJaSalva.ciclo)
                    setClosingDay(regraJaSalva.dia_fechamento)
                    if (regraJaSalva.data_ancora) {
                        setAnchorDate(regraJaSalva.data_ancora)
                    }
                } else {
                    // Valores padrão já estão nos states iniciais
                    const today = new Date()
                    const yyyy = today.getFullYear()
                    const mm = String(today.getMonth() + 1).padStart(2, '0')
                    const dd = String(today.getDate()).padStart(2, '0')
                    setAnchorDate(`${yyyy}-${mm}-${dd}`)
                }
            } catch (err: any) {
                console.error('Erro ao carregar regra de fechamento:', err.message || err)
            } finally {
                if (mounted) {
                    setIsLoadingData(false)
                }
            }
        }

        load()
        return () => { mounted = false }
    }, [effectiveUserId, authLoading])

    // Ajustes automáticos quando troca o tipo NA INTERFACE (apenas se não estiver carregando a primeira vez)
    useEffect(() => {
        if (isLoadingData) return

        if (cycle === 'weekly' && closingDay === null) {
            setClosingDay(5) // sexta por padrão
            setAnchorDate(null)
        }
        if (cycle === 'biweekly' && !anchorDate) {
            setClosingDay(null)
            // data base padrão: hoje
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

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>Carregando configurações...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Fechamento do Cliente</h1>
                        <p className="text-white/60 mt-1">Escolha como o cliente fecha: semanal, quinzenal ou mensal.</p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm transition"
                    >
                        Voltar
                    </button>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
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
                            <p className="text-sm text-white/70">Próximo fechamento:</p>
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
                                onClick={() => alert('Em desenvolvimento: O fechamento irá consolidar os pacotes nesta data calculada.')}
                                className="flex-1 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 py-3 px-4 transition"
                            >
                                Fechar período
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

