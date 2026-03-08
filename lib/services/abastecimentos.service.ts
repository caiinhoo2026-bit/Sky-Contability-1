import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Abastecimento = Database['public']['Tables']['abastecimentos']['Row']
type AbastecimentoInsert = Database['public']['Tables']['abastecimentos']['Insert']
type AbastecimentoUpdate = Database['public']['Tables']['abastecimentos']['Update']

export class AbastecimentosService {
    private supabase = createClient()

    /**
     * Buscar todos os abastecimentos do usuário
     */
    async getAll(userId: string): Promise<Abastecimento[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('abastecimentos')
            .select('*')
            .eq('user_id', userId)
            .is('fechamento_id', null)
            .order('data', { ascending: false })

        if (error) throw error
        return data || []
    }

    /**
     * Buscar abastecimentos por período
     */
    async getByPeriod(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<Abastecimento[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData()
                .filter(a => a.data >= dataInicio && a.data <= dataFim)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('abastecimentos')
            .select('*')
            .eq('user_id', userId)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .order('data', { ascending: false })

        if (error) throw error
        return data || []
    }

    /**
     * Buscar abastecimento por ID
     */
    async getById(id: string): Promise<Abastecimento | null> {
        const { data, error } = await this.supabase
            .from('abastecimentos')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    /**
     * Criar novo abastecimento
     */
    async create(abastecimento: AbastecimentoInsert): Promise<Abastecimento> {
        // Validação
        if (abastecimento.valor_pago <= 0) {
            throw new Error('Valor pago deve ser maior que zero')
        }

        if (this.isTestUser(abastecimento.user_id)) {
            const localData = this.getLocalData()
            const novoAbastecimento: Abastecimento = {
                ...abastecimento,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any

            localData.push(novoAbastecimento)
            this.saveLocalData(localData)
            return novoAbastecimento
        }

        const { data, error } = await this.supabase
            .from('abastecimentos')
            .insert(abastecimento as never)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Atualizar abastecimento
     */
    async update(
        id: string,
        abastecimento: AbastecimentoUpdate
    ): Promise<Abastecimento> {
        if (this.isTestUser(abastecimento.user_id as string)) {
            const localData = this.getLocalData()
            const index = localData.findIndex(a => a.id === id)
            if (index === -1) throw new Error('Abastecimento não encontrado')

            const abastecimentoAtualizado: Abastecimento = {
                ...localData[index],
                ...abastecimento,
                valor_pago: abastecimento.valor_pago !== undefined ? Number(abastecimento.valor_pago) : localData[index].valor_pago,
                updated_at: new Date().toISOString()
            } as any

            localData[index] = abastecimentoAtualizado
            this.saveLocalData(localData)
            return abastecimentoAtualizado
        }

        const { data, error } = await this.supabase
            .from('abastecimentos')
            .update(abastecimento as never)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Abastecimento
    }

    /**
     * Deletar abastecimento
     */
    async delete(id: string): Promise<void> {
        // Tentar deletar localmente primeiro se for ID de teste
        const localData = this.getLocalData()
        const novaLocalData = localData.filter(a => a.id !== id)
        if (localData.length !== novaLocalData.length) {
            this.saveLocalData(novaLocalData)
            return
        }

        const { error } = await this.supabase
            .from('abastecimentos')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    /**
     * Obter custo total de combustível no período
     */
    async getCustoTotalPeriodo(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<number> {
        const abastecimentos = await this.getByPeriod(userId, dataInicio, dataFim)

        return abastecimentos.reduce(
            (total, abastecimento) => total + Number(abastecimento.valor_pago || 0),
            0
        )
    }

    // --- MÉTODOS PRIVADOS PARA MODO TESTE (LOCAL STORAGE) ---
    private isTestUser(userId: string): boolean {
        return userId === '00000000-0000-0000-0000-000000000000'
    }

    private getLocalData(): Abastecimento[] {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('shopee_abastecimentos')
        return data ? (JSON.parse(data) as Abastecimento[]) : []
    }

    private saveLocalData(data: Abastecimento[]): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('shopee_abastecimentos', JSON.stringify(data))
    }
}

export const abastecimentosService = new AbastecimentosService()
