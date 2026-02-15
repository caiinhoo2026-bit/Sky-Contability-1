import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Manutencao = Database['public']['Tables']['manutencoes']['Row']
type ManutencaoInsert = Database['public']['Tables']['manutencoes']['Insert']
type ManutencaoUpdate = Database['public']['Tables']['manutencoes']['Update']

// Vida útil padrão por tipo de manutenção (em KM)
export const VIDA_UTIL_PADRAO = {
    oleo: 1000,
    pneus: 15000,
    corrente: 10000,
    pastilhas: 8000,
    outro: 5000, // Valor padrão para outros tipos
} as const

export class ManutencoesService {
    private supabase = createClient()

    /**
     * Buscar todas as manutenções do usuário
     */
    async getAll(userId: string): Promise<Manutencao[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('manutencoes')
            .select('*')
            .eq('user_id', userId)
            .order('data', { ascending: false })

        if (error) throw error
        return (data as Manutencao[]) || []
    }

    /**
     * Buscar manutenções por período
     */
    async getByPeriod(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<Manutencao[]> {
        if (this.isTestUser(userId)) {
            return this.getLocalData()
                .filter(m => m.data >= dataInicio && m.data <= dataFim)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }

        const { data, error } = await this.supabase
            .from('manutencoes')
            .select('*')
            .eq('user_id', userId)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .order('data', { ascending: false })

        if (error) throw error
        return (data as Manutencao[]) || []
    }

    /**
     * Buscar manutenção por ID
     */
    async getById(id: string): Promise<Manutencao | null> {
        const { data, error } = await this.supabase
            .from('manutencoes')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Manutencao
    }

    /**
     * Criar nova manutenção
     */
    async create(manutencao: ManutencaoInsert): Promise<Manutencao> {
        // Validações
        if (Number(manutencao.valor) <= 0) {
            throw new Error('Valor deve ser maior que zero')
        }

        if (this.isTestUser(manutencao.user_id)) {
            const localData = this.getLocalData()
            const novaManutencao: Manutencao = {
                ...manutencao,
                id: Math.random().toString(36).substr(2, 9),
                custo_diluido_km: Number(manutencao.valor || 0) / Number(manutencao.vida_util_km || 1),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any

            localData.push(novaManutencao)
            this.saveLocalData(localData)
            return novaManutencao
        }

        const { data, error } = await this.supabase
            .from('manutencoes')
            .insert(manutencao as any)
            .select()
            .single()

        if (error) throw error
        return data as Manutencao
    }

    /**
     * Atualizar manutenção
     */
    async update(id: string, manutencao: ManutencaoUpdate): Promise<Manutencao> {
        if (this.isTestUser(manutencao.user_id as string)) {
            const localData = this.getLocalData()
            const index = localData.findIndex(m => m.id === id)
            if (index === -1) throw new Error('Manutenção não encontrada')

            const manutencaoAtualizada: Manutencao = {
                ...localData[index],
                ...manutencao,
                valor: manutencao.valor !== undefined ? Number(manutencao.valor) : localData[index].valor,
                vida_util_km: manutencao.vida_util_km !== undefined ? Number(manutencao.vida_util_km) : localData[index].vida_util_km,
                km_troca: manutencao.km_troca !== undefined ? Number(manutencao.km_troca) : localData[index].km_troca,
                updated_at: new Date().toISOString()
            } as any

            // Recalcular custo diluído
            manutencaoAtualizada.custo_diluido_km = Number(manutencaoAtualizada.valor || 0) / Number(manutencaoAtualizada.vida_util_km || 1)

            localData[index] = manutencaoAtualizada
            this.saveLocalData(localData)
            return manutencaoAtualizada
        }

        const { data, error } = await this.supabase
            .from('manutencoes')
            .update(manutencao)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Manutencao
    }

    /**
     * Deletar manutenção
     */
    async delete(id: string): Promise<void> {
        // Tentar deletar localmente primeiro se for ID de teste
        const localData = this.getLocalData()
        const novaLocalData = localData.filter(m => m.id !== id)
        if (localData.length !== novaLocalData.length) {
            this.saveLocalData(novaLocalData)
            return
        }

        const { error } = await this.supabase
            .from('manutencoes')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    /**
     * Calcular custo de manutenção diluído para um período
     */
    async getCustoDiluidoPeriodo(
        userId: string,
        kmInicial: number,
        kmFinal: number
    ): Promise<number> {
        let manutencoes: Manutencao[] = []

        if (this.isTestUser(userId)) {
            manutencoes = this.getLocalData()
        } else {
            const { data, error } = await this.supabase
                .from('manutencoes')
                .select('*')
                .eq('user_id', userId)

            if (error) throw error
            manutencoes = (data as Manutencao[]) || []
        }

        if (!manutencoes || manutencoes.length === 0) return 0

        const kmRodado = Number(kmFinal) - Number(kmInicial)
        if (kmRodado <= 0) return 0

        // Filtrar manutenções ativas no período
        const manutencoesAtivas = manutencoes.filter((m) => {
            const kmTroca = Number(m.km_troca) || 0
            const vidaUtil = Number(m.vida_util_km) || 0
            // Manutenção ativa se o KM final está dentro do range de vida útil
            return Number(kmFinal) >= kmTroca && Number(kmFinal) <= kmTroca + vidaUtil
        })

        return manutencoesAtivas.reduce((acc, m) => {
            const custoPorKm = Number(m.valor || 0) / Number(m.vida_util_km || 1)
            return acc + (custoPorKm * kmRodado)
        }, 0)
    }

    /**
     * Verificar manutenções próximas do vencimento
     */
    async getProximasVencimento(
        userId: string,
        kmAtual: number,
        margemKm: number = 500
    ): Promise<Manutencao[]> {
        let manutencoes: Manutencao[] = []
        if (this.isTestUser(userId)) {
            manutencoes = this.getLocalData()
        } else {
            const { data, error } = await this.supabase
                .from('manutencoes')
                .select('*')
                .eq('user_id', userId)
            if (error) throw error
            manutencoes = (data as Manutencao[]) || []
        }

        return manutencoes.filter((m) => {
            const kmProximaTroca = Number(m.km_troca) + Number(m.vida_util_km)
            const kmRestante = kmProximaTroca - Number(kmAtual)
            return kmRestante > 0 && kmRestante <= margemKm
        })
    }

    /**
     * Obter vida útil padrão por tipo
     */
    getVidaUtilPadrao(
        tipo: 'oleo' | 'pneus' | 'corrente' | 'pastilhas' | 'outro'
    ): number {
        return VIDA_UTIL_PADRAO[tipo]
    }

    // --- MÉTODOS PRIVADOS PARA MODO TESTE (LOCAL STORAGE) ---
    private isTestUser(userId: string): boolean {
        return userId === '00000000-0000-0000-0000-000000000000'
    }

    private getLocalData(): Manutencao[] {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('shopee_manutencoes')
        return data ? (JSON.parse(data) as Manutencao[]) : []
    }

    private saveLocalData(data: Manutencao[]): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('shopee_manutencoes', JSON.stringify(data))
    }
}

export const manutencoesService = new ManutencoesService()
