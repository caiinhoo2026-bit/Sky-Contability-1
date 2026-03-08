import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Entrega = Database['public']['Tables']['entregas']['Row']
type EntregaInsert = Database['public']['Tables']['entregas']['Insert']
type EntregaUpdate = Database['public']['Tables']['entregas']['Update']

export class EntregasService {
    private supabase = createClient()

    /**
     * Buscar todas as entregas do usuário
     */
    async getAll(userId: string): Promise<Entrega[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('entregas')
            .select('*')
            .eq('user_id', userId)
            .is('fechamento_id', null)
            .order('data', { ascending: false })

        if (error) throw error
        return data || []
    }

    /**
     * Buscar entregas por período
     */
    async getByPeriod(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<Entrega[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData()
                .filter(e => e.data >= dataInicio && e.data <= dataFim)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('entregas')
            .select('*')
            .eq('user_id', userId)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .order('data', { ascending: false })

        if (error) throw error
        return data || []
    }

    /**
     * Buscar entrega por ID
     */
    async getById(id: string): Promise<Entrega | null> {
        const { data, error } = await this.supabase
            .from('entregas')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    /**
     * Criar nova entrega
     */
    async create(entrega: EntregaInsert): Promise<Entrega> {
        // Validações simplificadas
        if (entrega.quantidade_pacotes <= 0) {
            throw new Error('Quantidade de pacotes deve ser maior que zero')
        }

        if (this.isTestUser(entrega.user_id)) {
            const localData = this.getLocalData()
            const config = this.getLocalConfig()
            const valorPorEntrega = config?.valor_por_entrega || 4.0

            const novaEntrega: Entrega = {
                ...entrega,
                id: Math.random().toString(36).substr(2, 9),
                km_inicial: entrega.km_inicial || 0,
                km_final: entrega.km_final || 0,
                km_total: (entrega.km_final || 0) - (entrega.km_inicial || 0),
                receita: (entrega.quantidade_pacotes || 0) * valorPorEntrega,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any

            localData.push(novaEntrega)
            this.saveLocalData(localData)
            return novaEntrega
        }

        const { data, error } = await this.supabase
            .from('entregas')
            .insert(entrega as never)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Atualizar entrega
     */
    async update(id: string, entrega: EntregaUpdate): Promise<Entrega> {
        // Validações se estiver atualizando km
        if (entrega.km_final && entrega.km_inicial) {
            if (Number(entrega.km_final) < Number(entrega.km_inicial)) {
                throw new Error('KM final deve ser maior que KM inicial')
            }
        }

        if (this.isTestUser(entrega.user_id as string)) {
            const localData = this.getLocalData()
            const index = localData.findIndex(e => e.id === id)
            if (index === -1) throw new Error('Entrega não encontrada')

            const entregaAtualizada: Entrega = {
                ...localData[index],
                ...entrega,
                km_inicial: entrega.km_inicial !== undefined ? Number(entrega.km_inicial) : localData[index].km_inicial,
                km_final: entrega.km_final !== undefined ? Number(entrega.km_final) : localData[index].km_final,
                quantidade_pacotes: entrega.quantidade_pacotes !== undefined ? Number(entrega.quantidade_pacotes) : localData[index].quantidade_pacotes,
                updated_at: new Date().toISOString()
            } as any

            // Recalcular campos gerados
            const config = this.getLocalConfig()
            const valorPorEntrega = config?.valor_por_entrega || 4.0

            entregaAtualizada.km_total = (entregaAtualizada.km_final || 0) - (entregaAtualizada.km_inicial || 0)
            entregaAtualizada.receita = (entregaAtualizada.quantidade_pacotes || 0) * valorPorEntrega

            localData[index] = entregaAtualizada
            this.saveLocalData(localData)
            return entregaAtualizada
        }

        const { data, error } = await this.supabase
            .from('entregas')
            .update(entrega as never)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Entrega
    }

    /**
     * Deletar entrega
     */
    async delete(id: string): Promise<void> {
        // Tentar deletar localmente primeiro se for ID de teste
        const localData = this.getLocalData()
        const novaLocalData = localData.filter(e => e.id !== id)
        if (localData.length !== novaLocalData.length) {
            this.saveLocalData(novaLocalData)
            return
        }

        const { error } = await this.supabase
            .from('entregas')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    /**
     * Obter resumo semanal
     */
    async getResumoSemanal(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<{
        total_entregas: number
        total_pacotes: number
        total_km: number
        receita_total: number
    }> {
        const entregas = await this.getByPeriod(userId, dataInicio, dataFim)

        const resumo = entregas.reduce(
            (acc, entrega) => ({
                total_entregas: acc.total_entregas + 1,
                total_pacotes: acc.total_pacotes + (entrega.quantidade_pacotes || 0),
                total_km: acc.total_km + (entrega.km_total || 0),
                receita_total: acc.receita_total + (entrega.receita || 0),
            }),
            {
                total_entregas: 0,
                total_pacotes: 0,
                total_km: 0,
                receita_total: 0,
            }
        )

        return resumo
    }

    // --- MÉTODOS PRIVADOS PARA MODO TESTE (LOCAL STORAGE) ---
    private isTestUser(userId: string): boolean {
        return userId === '00000000-0000-0000-0000-000000000000'
    }

    private getLocalData(): Entrega[] {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('shopee_entregas')
        return data ? (JSON.parse(data) as Entrega[]) : []
    }

    private getLocalConfig(): any {
        if (typeof window === 'undefined') return null
        const data = localStorage.getItem('shopee_configuracoes')
        return data ? JSON.parse(data) : null
    }

    private saveLocalData(data: Entrega[]): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('shopee_entregas', JSON.stringify(data))
    }
}

export const entregasService = new EntregasService()
