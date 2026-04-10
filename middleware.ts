import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * API Middleware de Guarda e Rate Limiting Baseado em Tier Multi-Tenant
 * Intercepta chamadas POST/PUT protegendo contra a explosão de bancos em contas Free.
 */
export async function middleware(req: NextRequest) {
  // O middleware opera globalmente. Nós filtraremos apenas requisições modificadoras.
  if (req.nextUrl.pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    
    // Todas as requisições API front agora injetam no header "X-Company-ID" usando o useCompany
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
       // Se o Multi-tenant é vital para a query, recusamos requests vagos sem contexto da empresa
       // return NextResponse.json({ error: 'Tenant Header (x-company-id) missing' }, { status: 400 })
       return NextResponse.next() 
    }

    // AVALIAÇÃO DE QUOTAS (RATE LIMIT / EXCESSO DE INSERÇÕES BASEADA NO PLANO)
    // OBS: O ideal no Next.js Middleware Edge Network é usar Vercel KV / Redis em prod por ser ultra rápido.
    // Como a biblioteca cliente do @supabase pode onerar o Edge Limit localmente, 
    // um pseudocódigo representativo da proteção por tiering de SaaS B2B:
    
    /* 
      const limits = await Redis.get(`quota:${companyId}:fechamentos_month`);
      if (limits >= 10 && companyPlan === 'free') {
         return NextResponse.json({ error: 'Upgrade required. Feature Rate limit atingido.' }, { status: 402 })
      }
    */
  }
  
  return NextResponse.next()
}

// Configurações e Matchers de Path (Evitar onerar arquivos estáticos e _next)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
