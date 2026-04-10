import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AnomalyInput = {
  userId: string;
  action: string;
  ip: string | null;
  country?: string | null;
  volumeDelta?: number; 
  currentHour: number;
}

export type AnomalyResult = {
  riskScore: number;
  level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

/**
 * Calculadora Algorítmica de Confiança de Operação
 * Classifica um movimento em tempo-real em uma escala de 0 a 100 de risco.
 */
export async function detectAnomaly(input: AnomalyInput): Promise<AnomalyResult> {
  let riskScore = 0;
  const reasons: string[] = [];

  const { data: baseline, error } = await supabase
    .from('user_behavior_baseline')
    .select('*')
    .eq('user_id', input.userId)
    .single();

  // Usuários novos sem histórico sofrem menos restrição inicial de histórico, mas ganham score base
  if (error || !baseline) {
    return { riskScore: 10, level: 'NORMAL', reasons: ['NO_BASELINE_EXISTS'] };
  }

  // REGRA 1: IP INCOMUM (+40 Risco)
  if (input.ip && baseline.common_ips && !baseline.common_ips.includes(input.ip)) {
    riskScore += 40;
    reasons.push('IP_OUT_OF_BASELINE');
  }

  // REGRA 2: HORÁRIO INCOMUM (+20 Risco)
  // Supondo operação às 3 da manhã, e ele só opera horário comercial.
  if (input.currentHour !== null) {
      // (Algoritmo de distância horário ignorado para simplificação. Abaixo apenas match exato/presença array)
      if (baseline.common_hours && baseline.common_hours.length > 0 && !baseline.common_hours.includes(input.currentHour)) {
         riskScore += 20;
         reasons.push('TIMEFRAME_UNUSUAL');
      }
  }

  // REGRA 3: VOLUME ANORMAL (+50 Risco)
  // Editou/criou 5x mais itens que o normal diário de uma só vez (ex: script rodando massivamente)
  if (input.volumeDelta && baseline.avg_daily_operations > 0) {
     if (input.volumeDelta > (baseline.avg_daily_operations * 5)) {
        riskScore += 50;
        reasons.push('SPIKE_VOLUME_DETECTED');
     }
  }

  // DEFINIÇÃO DO LEVEL E TRIGGER DE AÇÃO
  let level: AnomalyResult['level'] = 'NORMAL';
  if (riskScore >= 80) level = 'HIGH';
  else if (riskScore >= 60) level = 'MEDIUM';
  else if (riskScore >= 40) level = 'LOW';

  // Registrar no Supabase Se for Risco Real
  if (level !== 'NORMAL') {
     await supabase.from('anomaly_alerts').insert({
       user_id: input.userId,
       risk_score: riskScore,
       level: level,
       reasons: reasons,
       metadata: input
     });
     
     // Em um sistema real, aqui você faria a chamada de envio de e-mail (Resend)
     // ou a chamada de banimento de Account (Admin.auth.deleteSession) para HIGH risks.
  }

  return { riskScore, level, reasons };
}
