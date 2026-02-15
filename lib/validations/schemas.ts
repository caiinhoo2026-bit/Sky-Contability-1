import { z } from 'zod'

// ================================================
// SCHEMA: Entregas
// ================================================
export const entregaSchema = z.object({
    data: z.string().min(1, 'Data é obrigatória'),
    quantidade_pacotes: z
        .number()
        .min(1, 'Quantidade deve ser maior que zero')
        .int('Quantidade deve ser um número inteiro'),
    km_inicial: z.number(),
    km_final: z.number(),
})

export type EntregaFormData = z.infer<typeof entregaSchema>

// ================================================
// SCHEMA: Abastecimentos (SIMPLIFICADO)
// ================================================
export const abastecimentoSchema = z.object({
    data: z.string().min(1, 'Data é obrigatória'),
    valor_pago: z.number().min(0.01, 'Valor deve ser maior que zero'),
})

export type AbastecimentoFormData = z.infer<typeof abastecimentoSchema>

// ================================================
// SCHEMA: Manutenções
// ================================================
export const manutencaoSchema = z.object({
    tipo: z.enum(['oleo', 'pneus', 'corrente', 'pastilhas', 'outro']),
    descricao: z.string().optional(),
    valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
    data: z.string().min(1, 'Data é obrigatória'),
    km_troca: z.number(),
    vida_util_km: z.number().min(1, 'Vida útil deve ser maior que zero'),
})

export type ManutencaoFormData = z.infer<typeof manutencaoSchema>
