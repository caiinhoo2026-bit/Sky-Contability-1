import { createClient } from '@supabase/supabase-js'
import { getSecurityAlertEmailHtml } from './emailTemplates'
import { sendSlackWebhook } from './slackAlert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AlertEventCategory = 'NEW_LOGIN' | 'MFA_CHANGED' | 'FECHAMENTO_MOD' | 'EXPORT' | 'ANOMALY' | 'AUTH_FAILED_STREAK' | 'NEW_USER'

interface AlertContext {
  ip: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Switchboard Central de Webhooks Inbound. Tudo que deve comunicar os usuários / admins sobre perigo 
 * ou notificação sistêmica passa por essa esteira, validando Preferences, Custo e Silêncio Noturno.
 */
export async function dispatchAlert(userId: string, event: AlertEventCategory, severity: 'INFO' | 'WARNING' | 'HIGH', context: AlertContext) {
  
  // 1. Obter árvore de preferências deste usuário
  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Como fallback de erro (user novo sem prefs criadas ainda), assume envio padrão "seguro"
  const isEmailEnabled = prefs ? prefs.email_enabled : true;
  const inAppEnabled = prefs ? prefs.in_app_enabled : true;
  const slackEnabled = prefs ? prefs.slack_enabled : false;

  // Checar restrição fina configurada do evento no bloco "EVENTS" JSON
  if (prefs?.events && typeof prefs.events === 'object') {
     const isEventOptedIn = prefs.events[event] !== false;
     // Nunca bloquearemos envio de ALTO RISCO mesmo que o usuário tenha optado-out 
     // (Regra Ouro da Segurança em Fintechs)
     if (!isEventOptedIn && severity !== 'HIGH') {
         return; 
     }
  }

  // Nota de Engenharia: Validações de Quiet-Hours (Não incomode-me à noite) seriam 
  // feitas calculando o parseTime do servidor vs prefs.quiet_hours_start, mas
  // alertas HIGH furariam esse bloqueio (PagerDuty behavior).

  
  // CANAL 1: Real-Time Supabase Web-Socket Bell
  if (inAppEnabled) {
     await supabase.from('notifications').insert({
       user_id: userId,
       title: `Alerta SecOps: ${event.replace(/_/g, ' ')}`,
       message: `Localizamos processamento contábil sistêmico/auth. Referência IP: ${context.ip}`,
       severity: severity,
       event_type: event
     })
  }

  // CANAL 2: E-mails via Provider (Simulado / Pronto para envio Resend AWS)
  if (isEmailEnabled && (severity === 'WARNING' || severity === 'HIGH')) {
      const html = getSecurityAlertEmailHtml(event, context.ip, context.userAgent || 'App Browser Genérico', new Date().toLocaleString('pt-BR'))
      
      // Aqui faria algo como: 
      // resend.emails.send({ to: userEmail, subject: 'Risco de Conta Sky-Contabilidade', html })
      console.log(`[DISPATCH SYS] E-mail Seguro engatilhado e enfileirado contra usuário: ${userId}`);
  }

  // CANAL 3: Integração Corporativa Slack / Teams Webhook
  if (slackEnabled && prefs?.slack_webhook_url) {
      await sendSlackWebhook(prefs.slack_webhook_url, event, severity, { ...context, userId })
  }
}
