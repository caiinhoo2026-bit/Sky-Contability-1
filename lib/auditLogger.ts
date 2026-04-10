import { createClient } from '@supabase/supabase-js'

// Utiliza a chave Service Role (Privada) do servidor para conseguir inserir
// logs independentemente das regras estritas de RLS da tabela de auditoria.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type AuditLogPayload = {
  userId?: string
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ROUTE_ACCESS' | 'AUTH_ERROR' | 'REPORT_EXPORT' | string
  resource: string
  resourceId?: string
  oldValue?: Record<string, any>
  newValue?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failed' | 'blocked' | 'warning'
}

/**
 * Registra um log de auditoria via Server/Middleware para ações em nível de aplicação 
 * (Não de banco de dados, pois o CUD do DB deve ser preferencialmente deixado para o PostgreSQL Trigger que criamos na migration).
 * Use isso no Middleware ou Next API Routes para logins, acessos indevidos e extração de relatórios.
 */
export async function auditLogger(payload: AuditLogPayload) {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      user_id: payload.userId || null,
      action: payload.action,
      resource: payload.resource,
      resource_id: payload.resourceId || null,
      old_value: payload.oldValue || null,
      new_value: payload.newValue || null,
      ip_address: payload.ipAddress || null,
      user_agent: payload.userAgent || null,
      status: payload.status || 'success',
      // O DB cuidará do created_at na inserção inicial padrão
    })

    if (error) {
      console.error('[Sky-Contability AUDIT CRITICAL ERROR]: Failed to insert log', error.message)
    }
  } catch (err) {
    console.error('[Sky-Contability Server Exception in auditLogger]', err)
  }
}
