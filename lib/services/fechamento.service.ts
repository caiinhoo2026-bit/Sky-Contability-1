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
            }, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) throw error
        return data as RegraFechamento
    }
}
