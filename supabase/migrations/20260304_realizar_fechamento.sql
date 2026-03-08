-- ================================================
-- TABELA: fechamentos
-- Registra o histórico de fechamentos realizados
-- ================================================

CREATE TABLE IF NOT EXISTS public.fechamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  total_pacotes INTEGER NOT NULL DEFAULT 0,
  total_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_receita DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_combustivel DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_manutencao DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
  pago BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna de vínculo nas tabelas de movimentação
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS fechamento_id UUID REFERENCES public.fechamentos(id) ON DELETE SET NULL;
ALTER TABLE public.abastecimentos ADD COLUMN IF NOT EXISTS fechamento_id UUID REFERENCES public.fechamentos(id) ON DELETE SET NULL;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS fechamento_id UUID REFERENCES public.fechamentos(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fechamentos_user ON public.fechamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_entregas_fechamento ON public.entregas(fechamento_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_fechamento ON public.abastecimentos(fechamento_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_fechamento ON public.manutencoes(fechamento_id);

-- Trigger de updated_at
CREATE TRIGGER update_fechamentos_updated_at 
  BEFORE UPDATE ON public.fechamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios fechamentos"
  ON public.fechamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar seus próprios fechamentos"
  ON public.fechamentos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
