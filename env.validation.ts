import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Validação de Ambiente DevSecOps
 * Se uma variável declarada aqui estiver ausente ou com tipo inválido, a aplicação
 * NEXT.js irá falhar propositalmente no momento da construção (build fail-safe),
 * evitando subir versões para produção com secrets faltantes ou incorretas.
 */
export const env = createEnv({
  /*
   * Variáveis Privadas (Apenas no Backend / API Routes / Server Actions)
   * Se você tentar acessar estas propriedades de um componente React "use client",
   * o pacote env-nextjs vai travar propositalmente.
   */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Usada em scripts admin ou jobs agendados internos no servidor backend.
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'A Service Role Key é obrigatória no server e deve ser válida').optional(),
    
    // Conexão do banco via URL format (para migrações ou prisma, por ex.)
    DATABASE_URL: z.string().url('A String do Banco deve ser uma URL válida de conexão').optional(),
    
    // Chave de sistema de e-mail (Resend)
    RESEND_API_KEY: z.string().startsWith('re_', 'A chave resend costuma iniciar com "re_"').optional(),
  },

  /*
   * Variáveis Públicas (Trafegadas ao Frontend)
   * Precisam necessariamente de `NEXT_PUBLIC_` para serem interpretadas.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('A URL do Supabase deve ser uma URL válida (ex: https://xxx.supabase.co)'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'A Anon Key deve ser inserida e válida'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  },

  /*
   * Roteamento de RunTime (Mapeamento explícito para o Vercel Edge/Node)
   * Precisamos destruturar `process.env` manualmente para que o Next.js
   * possa substituir durante o tempo de Build estático.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /*
   * Trata de erros vazios como undefined para melhor usabilidade em opcionais
   */
  emptyStringAsUndefined: true,
})
