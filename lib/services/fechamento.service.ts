import { createClient } from '../supabase/client'

export type BillingCycle = 'weekly' | 'biweekly' | 'monthly'

export interface RegraFechamento {
    id: string
    user_id: string
    ciclo: BillingCycle
    dia_fechamento: number | null
    data_ancora: string | null
    created_at: string
    updated_at: string
}

export interface FechamentoRealizado {
    id: string
    user_id: string
    tipo_periodo: BillingCycle | 'personalizado' | null
    data_inicio: string
    data_fim: string
    total_entregas: number
    total_ganhos: number
    total_abastecimentos: number
    total_manutencoes: number
    lucro_liquido: number
    ticket_medio: number
    created_at: string
}

export const fechamentoService = {
    async getRegra(userId: string): Promise<RegraFechamento | null> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('regras_fechamento')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) {
            // PGRST116 means zero rows returned (no rule exists yet)
            if (error.code === 'PGRST116') return null
            throw error
        }

        return data as RegraFechamento
    },

    async saveRegra(
        userId: string,
        ciclo: BillingCycle,
        dia_fechamento: number | null,
        data_ancora: string | null
    ): Promise<RegraFechamento> {
        const supabase = createClient()

        // Usamos upsert para inserir se não existir, ou atualizar se já existir
        const { data, error } = await supabase
            .from('regras_fechamento')
            .upsert({
                user_id: userId,
                ciclo,
                dia_fechamento: ciclo === 'biweekly' ? null : dia_fechamento,
                data_ancora: ciclo === 'biweekly' ? data_ancora : null,
                // Ao fazer upsert na mesma linha, atualizamos a constraint única
            } as never, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) throw error
        return data as RegraFechamento
    },

    async getUltimoFechamento(userId: string): Promise<FechamentoRealizado | null> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('fechamentos')
            .select('*')
            .eq('user_id', userId)
            .order('data_fim', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error
        return data
    },

    async getHistorico(userId: string): Promise<FechamentoRealizado[]> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('fechamentos')
            .select('*')
            .eq('user_id', userId)
            .order('data_fim', { ascending: false })

        if (error) throw error
        return data || []
    },

    async realizarFechamento(
        userId: string,
        dataInicio: string,
        dataFim: string,
        totais: {
            tipo_periodo?: string
            entregas: number
            ganhos: number
            abastecimentos: number
            manutencoes: number
            lucro: number
            ticket: number
        }
    ): Promise<FechamentoRealizado> {
        const supabase = createClient()

        // 1. Criar o registro de fechamento (Relatório)
        const { data: dataF, error: errorF } = await supabase
            .from('fechamentos')
            .insert({
                user_id: userId,
                tipo_periodo: totais.tipo_periodo || 'personalizado',
                data_inicio: dataInicio,
                data_fim: dataFim,
                total_entregas: totais.entregas,
                total_ganhos: totais.ganhos,
                total_abastecimentos: totais.abastecimentos,
                total_manutencoes: totais.manutencoes,
                lucro_liquido: totais.lucro,
                ticket_medio: totais.ticket
            } as any)
            .select()
            .single()

        if (errorF) throw errorF
        return dataF as FechamentoRealizado
    }
}
