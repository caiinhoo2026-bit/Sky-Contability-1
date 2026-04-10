import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * OWASP Top 10 - CSRF Mitigation (Cross-Site Request Forgery)
 * Utilizando o padrão HMAC Double Submit Cookie atrelado à sessão principal JWT.
 */

// Gera um token assinado (Stateless)
export function generateCsrfToken(sessionId: string, secret: string): string {
  if (!secret) throw new Error('CSRF Secret is required')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionId)
  return hmac.digest('hex')
}

// Validador a ser usado no topo de POST/PUT/DELETE /api/* rotas
export function validateCsrfToken(req: NextRequest, secret: string): boolean {
  // Omitir verificação para métodos Safe (Restrição OWASP)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true

  // Recebe o Token enviado proativamente via header (Fetch/Axios interceptor)
  const csrfHeader = req.headers.get('x-csrf-token')
  
  // Precisamos do ID de sessão do user (Ex: JWT local do Supabase ou Refresh token)
  const sessionId = req.cookies.get('sb-access-token')?.value 
  
  // Validação estrita da Origin de acordo com a premissa de CSRF (Mitigação paralela)
  const origin = req.headers.get('origin')
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (origin !== allowedOrigin) return false

  if (!csrfHeader || !sessionId) return false

  const expectedToken = generateCsrfToken(sessionId, secret)
  
  // Utilizar timingSafeEqual para prevenção contra Timing Attacks (Brute-forcer via latency diff)
  try {
    return crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(expectedToken))
  } catch {
    return false
  }
}
