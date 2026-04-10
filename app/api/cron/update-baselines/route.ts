import { NextRequest, NextResponse } from 'next/server'
import { updateUserBaselines } from '@/lib/behaviorBaseline'

/**
 * Rota GET exclusiva para Agendamentos (CRON JOBS da Vercel).
 * Você deve criar o arquido vercel.json na raiz para engatilhar esta rota:
 * { "crons": [{ "path": "/api/cron/update-baselines", "schedule": "0 3 * * *" }] }
 */
export async function GET(req: NextRequest) {
    // 1. Verificação Estrita do Header Nativo da Vercel (Previne DoS contra sua API de Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: 'Acesso Negado à Máquina de Crons' }, { status: 401 });
    }

    try {
       const result = await updateUserBaselines();
       
       if (result) {
         return NextResponse.json({ message: 'Scoring profiles updated successfully!' })
       } else {
         return NextResponse.json({ error: 'Supabase failed to aggregate' }, { status: 500 })
       }

    } catch (error) {
       console.error(error);
       return NextResponse.json({ error: 'Cron Server Error' }, { status: 500 })
    }
}
