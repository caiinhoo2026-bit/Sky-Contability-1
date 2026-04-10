import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/favicon.ico']

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // liberar arquivos estáticos e rotas públicas
    if (
        PUBLIC_ROUTES.includes(pathname) ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') // libera arquivos com extensão (estáticos)
    ) {
        return NextResponse.next()
    }

    // cria response para a lib setar cookies
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // se não estiver logado, manda pro login
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
          Protege TUDO exceto assets padrão.
          Se quiser proteger só algumas rotas, troque o matcher.
        */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
