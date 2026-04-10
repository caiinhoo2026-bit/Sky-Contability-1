import { createClient } from '@supabase/supabase-js'

/**
 * Utilitário de atualização de perfis corporais / ML de Usuário.
 * Usado idealmente por rotas CRON.
 */
export async function updateUserBaselines() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Invoca a function remota em background criada no migration postgres
  const { error } = await supabase.rpc('calculate_daily_baselines')
  
  if (error) {
     console.error('Falha Crítica ao recalibrar Modelos de Baseline:', error.message)
     return false;
  }
  
  console.log('✅ Machine Learning Baselines Atualizadas no Banco.')
  return true;
}
