export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            entregas: {
                Row: {
                    id: string
                    user_id: string
                    data: string
                    quantidade_pacotes: number
                    km_inicial: number
                    km_final: number
                    km_total: number
                    receita: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    data: string
                    quantidade_pacotes: number
                    km_inicial: number
                    km_final: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    data?: string
                    quantidade_pacotes?: number
                    km_inicial?: number
                    km_final?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            abastecimentos: {
                Row: {
                    id: string
                    user_id: string
                    data: string
                    valor_pago: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    data: string
                    valor_pago: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    data?: string
                    valor_pago?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            manutencoes: {
                Row: {
                    id: string
                    user_id: string
                    tipo: 'oleo' | 'pneus' | 'corrente' | 'pastilhas' | 'outro'
                    descricao: string | null
                    valor: number
                    data: string
                    km_troca: number
                    vida_util_km: number
                    custo_diluido_km: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tipo: 'oleo' | 'pneus' | 'corrente' | 'pastilhas' | 'outro'
                    descricao?: string | null
                    valor: number
                    data: string
                    km_troca: number
                    vida_util_km: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tipo?: 'oleo' | 'pneus' | 'corrente' | 'pastilhas' | 'outro'
                    descricao?: string | null
                    valor?: number
                    data?: string
                    km_troca?: number
                    vida_util_km?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            configuracoes: {
                Row: {
                    id: string
                    user_id: string
                    veiculo: string
                    ano: number
                    consumo_medio: number
                    valor_por_entrega: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    veiculo?: string
                    ano?: number
                    consumo_medio?: number
                    valor_por_entrega?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    veiculo?: string
                    ano?: number
                    consumo_medio?: number
                    valor_por_entrega?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
