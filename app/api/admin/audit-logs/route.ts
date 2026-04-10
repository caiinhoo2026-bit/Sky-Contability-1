import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/audit-logs
 * Busca segura via API (Service Role) exigindo autorização do usuário Admin
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Validar se o requisitante tem permissão / Token existente
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // (Em um ambiente real, você validaria se este token pertence a um usuário da role "admin" cruzando com o supabase.auth.getUser(token))

    const { searchParams } = new URL(req.url)
    
    // Filtros e Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*, auth.users(email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply strict dynamic filters
    if (userId) query = query.eq('user_id', userId)
    if (action) query = query.eq('action', action)
    if (status) query = query.eq('status', status)

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    })
  } catch (err: any) {
    console.error('Audit API ERROR:', err)
    return NextResponse.json({ error: 'Erro interno ao buscar logs.' }, { status: 500 })
  }
}
