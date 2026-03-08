import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { tipo_periodo, data_inicio, data_fim } = body

        if (!tipo_periodo || !data_inicio || !data_fim) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
        }

        // 1. Chamar a RPC para calcular os totais
        const { data, error: rpcError } = await supabase.rpc('resumo_periodo', {
            data_inicio: data_inicio,
            data_fim: data_fim
        })

        console.log('resumo_periodo data:', data)
        console.log('resumo_periodo error:', rpcError)

        const resumo = data as any[]

        if (rpcError) {
            console.error('Erro detalhado RPC:', {
                message: rpcError.message,
                details: rpcError.details,
                hint: rpcError.hint,
                code: rpcError.code
            });
            return NextResponse.json({ error: 'Erro ao calcular resumo - ' + (rpcError.message || 'Erro desconhecido') }, { status: 500 })
        }

        if (!resumo || resumo.length === 0) {
            return NextResponse.json({ error: 'Nenhum dado encontrado para este período' }, { status: 404 })
        }

        const r = resumo[0]

        // 2. Calcular ticket médio
        const ticketMedio = r.total_entregas > 0 ? Number(r.total_ganhos) / r.total_entregas : 0

        // 3. Inserir na tabela de fechamentos
        const { data: fechamento, error: insertError } = await supabase
            .from('fechamentos')
            .insert({
                user_id: user.id,
                tipo_periodo,
                data_inicio,
                data_fim,
                total_entregas: r.total_entregas,
                total_ganhos: r.total_ganhos,
                total_abastecimentos: r.total_abastecimentos,
                total_manutencoes: r.total_manutencoes,
                lucro_liquido: r.lucro_liquido,
                ticket_medio: ticketMedio
            })
            .select()
            .single()

        if (insertError) {
            console.error('Erro Insert:', insertError)
            return NextResponse.json({ error: 'Erro ao salvar fechamento' }, { status: 500 })
        }

        return NextResponse.json(fechamento)
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
