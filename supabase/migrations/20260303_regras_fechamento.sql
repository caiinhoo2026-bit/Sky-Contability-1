-- ================================================
-- TABELA: regras_fechamento
-- Guarda o tipo de faturamento/fechamento por usuário
-- ================================================

CREATE TABLE IF NOT EXISTS public.regras_fechamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ciclo VARCHAR(20) NOT NULL CHECK (ciclo IN ('weekly', 'biweekly', 'monthly')),
  dia_fechamento INTEGER, -- 0-6 para semanal, 1-28 para mensal
  data_ancora DATE,       -- Para ciclo quinzenal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_regras_fechamento_user ON public.regras_fechamento(user_id);

-- Trigger de updated_at
CREATE TRIGGER update_regras_fechamento_updated_at 
  BEFORE UPDATE ON public.regras_fechamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.regras_fechamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias regras de fechamento"
  ON public.regras_fechamento FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias regras de fechamento"
  ON public.regras_fechamento FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
