import { NextRequest, NextResponse } from 'next/server'
import { detectAnomaly } from '@/lib/anomalyDetector'

/**
 * POST /api/security/check-anomaly
 * Um Micro-serviço (API Route) restrito e privado consumido pelos seus modulos internos 
 * quando transações muito grandes acontecem.
 */
export async function POST(req: NextRequest) {
  try {
     const payload = await req.json();
     
     // Segurança de Autenticidade Servidor-a-Servidor / CSRF deve estar presente
     // Mas vamos extrair o Request Base para IP 
     const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
     const currentHour = new Date().getHours();

     const analysis = await detectAnomaly({
         userId: payload.userId,
         action: payload.action,
         ip: ip,
         volumeDelta: payload.volumeDelta || 1,
         currentHour: currentHour
     });

     // Se o nível for HIGH, pode retornar algo ao Frontend para forçar 
     // Re-Login ou Captcha In-Loco MFA.
     if (analysis.level === 'HIGH') {
         // Lógica para banir sessão server side poderia ficar aqui
         // supabase.auth.admin.signOut(...)
     }

     return NextResponse.json({ success: true, analysis });

  } catch (error: any) {
     console.error('[SecOps] Falha no validador de anomalias', error);
     return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
