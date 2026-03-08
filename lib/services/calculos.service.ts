import { entregasService } from './entregas.service'
import { abastecimentosService } from './abastecimentos.service'
import { manutencoesService } from './manutencoes.service'
import { createClient } from '../supabase/client'

export interface CalculoFinanceiro {
    // Dados do período
    periodo: {
        inicio: string
        fim: string
    }

    // Métricas de entregas
    entregas: {
        total_entregas: number
        total_pacotes: number
        total_km: number
        receita_total: number
    }

    // Métricas de custos
    custos: {
        combustivel: number
        manutencao: number
        total: number
        por_km: number
        por_entrega: number
    }

    // Métricas de lucro
    lucro: {
        bruto: number
        liquido: number
        margem_percentual: number
    }

    // Ponto de equilíbrio
    ponto_equilibrio: {
        entregas_minimas: number
        pacotes_minimos: number
    }
}

export class CalculosService {
    private supabase = createClient()
    /**
     * Calcular todas as métricas financeiras para um período
     */
    async calcularPeriodo(
        userId: string,
        dataInicio: string,
        dataFim: string
    ): Promise<CalculoFinanceiro> {
        // 1. Buscar dados de entregas
        const resumoEntregas = await entregasService.getResumoSemanal(
            userId,
            dataInicio,
            dataFim
        )

        // 2. Buscar custo de combustível
        const custoCombustivel = await abastecimentosService.getCustoTotalPeriodo(
            userId,
            dataInicio,
            dataFim
        )

        // 3. Buscar entregas para pegar KM inicial e final do período
        const entregas = await entregasService.getByPeriod(
            userId,
            dataInicio,
            dataFim
        )

        let kmInicial = 0
        let kmFinal = 0

        if (entregas.length > 0) {
            // Ordenar por data
            const entregasOrdenadas = [...entregas].sort(
                (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
            )

            kmInicial = entregasOrdenadas[0].km_inicial
            kmFinal = entregasOrdenadas[entregasOrdenadas.length - 1].km_final
        }

        // 4. Calcular custo de manutenção diluído
        const custoManutencao = await manutencoesService.getCustoDiluidoPeriodo(
            userId,
            kmInicial,
            kmFinal
        )

        // 5. Calcular métricas derivadas
        const custoTotal = custoCombustivel + custoManutencao

        const custoPorKm =
            resumoEntregas.total_km > 0 ? custoTotal / resumoEntregas.total_km : 0

        const custoPorEntrega =
            resumoEntregas.total_pacotes > 0
                ? custoTotal / resumoEntregas.total_pacotes
                : 0

        const lucroBruto = resumoEntregas.receita_total - custoCombustivel
        const lucroLiquido = resumoEntregas.receita_total - custoTotal

        const margemPercentual =
            resumoEntregas.receita_total > 0
                ? (lucroLiquido / resumoEntregas.receita_total) * 100
                : 0

        // 6. Ponto de equilíbrio (considerando R$ 4,00 por pacote)
        const entregasMinimas = custoTotal / 4.0

        return {
            periodo: {
                inicio: dataInicio,
                fim: dataFim,
            },
            entregas: resumoEntregas,
            custos: {
                combustivel: custoCombustivel,
                manutencao: custoManutencao,
                total: custoTotal,
                por_km: custoPorKm,
                por_entrega: custoPorEntrega,
            },
            lucro: {
                bruto: lucroBruto,
                liquido: lucroLiquido,
                margem_percentual: margemPercentual,
            },
            ponto_equilibrio: {
                entregas_minimas: entregasMinimas,
                pacotes_minimos: entregasMinimas, // Assumindo 1 pacote = 1 entrega
            },
        }
    }

    /**
     * Calcular métricas da semana atual
     */
    async calcularSemanaAtual(userId: string): Promise<CalculoFinanceiro> {
        const hoje = new Date()
        const diaSemana = hoje.getDay() // 0 = domingo, 1 = segunda, etc.

        // Calcular início da semana (segunda-feira)
        const inicioSemana = new Date(hoje)
        const diff = diaSemana === 0 ? -6 : 1 - diaSemana // Se domingo, volta 6 dias
        inicioSemana.setDate(hoje.getDate() + diff)
        inicioSemana.setHours(0, 0, 0, 0)

        // Calcular fim da semana (domingo)
        const fimSemana = new Date(inicioSemana)
        fimSemana.setDate(inicioSemana.getDate() + 6)
        fimSemana.setHours(23, 59, 59, 999)

        return this.calcularPeriodo(
            userId,
            inicioSemana.toISOString().split('T')[0],
            fimSemana.toISOString().split('T')[0]
        )
    }

    /**
     * Calcular projeção mensal baseada na média semanal
     */
    async calcularProjecaoMensal(
        userId: string
    ): Promise<CalculoFinanceiro & { semanas_consideradas: number }> {
        const hoje = new Date()
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

        const calculoMensal = await this.calcularPeriodo(
            userId,
            primeiroDiaMes.toISOString().split('T')[0],
            ultimoDiaMes.toISOString().split('T')[0]
        )

        // Calcular quantas semanas já passaram no mês
        const diasDecorridos = Math.floor(
            (hoje.getTime() - primeiroDiaMes.getTime()) / (1000 * 60 * 60 * 24)
        )
        const semanasDecorridas = Math.max(1, Math.ceil(diasDecorridos / 7))

        return {
            ...calculoMensal,
            semanas_consideradas: semanasDecorridas,
        }
    }

    /**
     * Comparar dois períodos
     */
    async compararPeriodos(
        userId: string,
        periodo1: { inicio: string; fim: string },
        periodo2: { inicio: string; fim: string }
    ): Promise<{
        periodo1: CalculoFinanceiro
        periodo2: CalculoFinanceiro
        variacao: {
            receita_percentual: number
            lucro_percentual: number
            margem_diferenca: number
        }
    }> {
        const calc1 = await this.calcularPeriodo(
            userId,
            periodo1.inicio,
            periodo1.fim
        )
        const calc2 = await this.calcularPeriodo(
            userId,
            periodo2.inicio,
            periodo2.fim
        )

        const variacaoReceita =
            calc1.entregas.receita_total > 0
                ? ((calc2.entregas.receita_total - calc1.entregas.receita_total) /
                    calc1.entregas.receita_total) *
                100
                : 0

        const variacaoLucro =
            calc1.lucro.liquido > 0
                ? ((calc2.lucro.liquido - calc1.lucro.liquido) / calc1.lucro.liquido) *
                100
                : 0

        const diferencaMargem =
            calc2.lucro.margem_percentual - calc1.lucro.margem_percentual

        return {
            periodo1: calc1,
            periodo2: calc2,
            variacao: {
                receita_percentual: variacaoReceita,
                lucro_percentual: variacaoLucro,
                margem_diferenca: diferencaMargem,
            },
        }
    }
    async calcularGeral(userId: string): Promise<CalculoFinanceiro['entregas'] & { total_combustivel: number; total_manutencao: number; total_manutencao_paga: number; total_km_rodado: number; receita_total: number; lucro_liquido: number; margem_percentual: number; custo_medio_km: number; ponto_equilibrio: number }> {
        // 1. Buscar todas as entregas
        const entregas = await entregasService.getAll(userId)

        // 2. Buscar todos os abastecimentos
        const abastecimentos = await abastecimentosService.getAll(userId)
        const totalCombustivel = abastecimentos.reduce((acc, a) => acc + (Number(a.valor_pago) || 0), 0)

        // 2.1 Buscar todas as manutenções para o custo total pago
        const manutencoes = await manutencoesService.getAll(userId)
        const totalManutencaoPaga = manutencoes.reduce((acc, m) => acc + (Number(m.valor) || 0), 0)

        // 3. Calcular resumo de entregas
        const totalKmRodado = entregas.reduce((acc, e) => acc + (Number(e.km_total) || 0), 0)
        const receitaTotal = entregas.reduce((acc, e) => acc + (Number(e.receita) || 0), 0)
        const totalPacotes = entregas.reduce((acc, e) => acc + (Number(e.quantidade_pacotes) || 0), 0)

        // 3.1 Buscar configurações do usuário para o valor por entrega
        const { data: config } = await (this as any).supabase
            .from('configuracoes')
            .select('valor_por_entrega')
            .eq('user_id', userId)
            .single()

        const valorPorEntrega = Number(config?.valor_por_entrega || 4.0)

        // 4. Calcular manutenção diluída (total ao longo da vida do veículo/km rodado)
        // Para o "Geral", pegamos o KM total rodado nas entregas
        let kmInicial = 0
        let kmFinal = 0
        if (entregas.length > 0) {
            const ord = [...entregas].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            kmInicial = ord[0].km_inicial
            kmFinal = ord[ord.length - 1].km_final
        }

        const totalManutencao = await manutencoesService.getCustoDiluidoPeriodo(userId, kmInicial, kmFinal)

        const lucroLiquido = receitaTotal - (totalCombustivel + totalManutencaoPaga)
        const margemPercentual = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0
        const custoMedioKm = totalKmRodado > 0 ? (totalCombustivel + totalManutencao) / totalKmRodado : 0
        const pontoEquilibrio = (totalCombustivel + totalManutencao) / valorPorEntrega

        return {
            total_entregas: entregas.length,
            total_pacotes: totalPacotes,
            total_km: totalKmRodado,
            receita_total: receitaTotal,
            total_combustivel: totalCombustivel,
            total_manutencao: totalManutencao,
            total_manutencao_paga: totalManutencaoPaga,
            total_km_rodado: totalKmRodado,
            lucro_liquido: lucroLiquido,
            margem_percentual: margemPercentual,
            custo_medio_km: custoMedioKm,
            ponto_equilibrio: pontoEquilibrio
        }
    }
}

export const calculosService = new CalculosService()
