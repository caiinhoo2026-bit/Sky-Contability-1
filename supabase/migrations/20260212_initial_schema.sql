-- ================================================
-- SISTEMA DE CONTROLE FINANCEIRO - ENTREGAS SHOPEE
-- Migration: Criação de Tabelas
-- ================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABELA: entregas
-- ================================================
CREATE TABLE IF NOT EXISTS entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  quantidade_pacotes INTEGER NOT NULL CHECK (quantidade_pacotes > 0),
  km_inicial DECIMAL(10,2) NOT NULL CHECK (km_inicial >= 0),
  km_final DECIMAL(10,2) NOT NULL CHECK (km_final >= km_inicial),
  km_total DECIMAL(10,2) GENERATED ALWAYS AS (km_final - km_inicial) STORED,
  receita DECIMAL(10,2) GENERATED ALWAYS AS (quantidade_pacotes * 4.00) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entregas_data ON entregas(data DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_user ON entregas(user_id);
CREATE INDEX IF NOT EXISTS idx_entregas_user_data ON entregas(user_id, data DESC);

-- ================================================
-- TABELA: abastecimentos (SIMPLIFICADA)
-- Registra apenas data e valor gasto
-- ================================================
CREATE TABLE IF NOT EXISTS abastecimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL CHECK (valor_pago > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_abastecimentos_data ON abastecimentos(data DESC);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_user ON abastecimentos(user_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_user_data ON abastecimentos(user_id, data DESC);

-- ================================================
-- TABELA: manutencoes
-- ================================================
CREATE TABLE IF NOT EXISTS manutencoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('oleo', 'pneus', 'corrente', 'pastilhas', 'outro')),
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL,
  km_troca DECIMAL(10,2) NOT NULL CHECK (km_troca >= 0),
  vida_util_km INTEGER NOT NULL CHECK (vida_util_km > 0),
  custo_diluido_km DECIMAL(10,4) GENERATED ALWAYS AS (valor / vida_util_km) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_manutencoes_data ON manutencoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_manutencoes_user ON manutencoes(user_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_tipo ON manutencoes(tipo);
CREATE INDEX IF NOT EXISTS idx_manutencoes_user_data ON manutencoes(user_id, data DESC);

-- ================================================
-- TABELA: configuracoes
-- ================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  veiculo VARCHAR(100) DEFAULT 'Yamaha XTZ 125',
  ano INTEGER DEFAULT 2006 CHECK (ano >= 1900 AND ano <= 2100),
  consumo_medio DECIMAL(5,2) DEFAULT 30.00 CHECK (consumo_medio > 0),
  valor_por_entrega DECIMAL(10,2) DEFAULT 4.00 CHECK (valor_por_entrega > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracoes_user ON configuracoes(user_id);

-- ================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON entregas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abastecimentos_updated_at BEFORE UPDATE ON abastecimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manutencoes_updated_at BEFORE UPDATE ON manutencoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas para ENTREGAS
CREATE POLICY "Usuários podem ver suas próprias entregas"
  ON entregas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias entregas"
  ON entregas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias entregas"
  ON entregas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias entregas"
  ON entregas FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para ABASTECIMENTOS
CREATE POLICY "Usuários podem ver seus próprios abastecimentos"
  ON abastecimentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios abastecimentos"
  ON abastecimentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios abastecimentos"
  ON abastecimentos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios abastecimentos"
  ON abastecimentos FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para MANUTENÇÕES
CREATE POLICY "Usuários podem ver suas próprias manutenções"
  ON manutencoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias manutenções"
  ON manutencoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias manutenções"
  ON manutencoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias manutenções"
  ON manutencoes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para CONFIGURAÇÕES
CREATE POLICY "Usuários podem ver suas próprias configurações"
  ON configuracoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
  ON configuracoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
  ON configuracoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações"
  ON configuracoes FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- FUNÇÃO: Criar configuração padrão para novo usuário
-- ================================================
CREATE OR REPLACE FUNCTION create_default_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO configuracoes (user_id, veiculo, ano, consumo_medio, valor_por_entrega)
  VALUES (NEW.id, 'Yamaha XTZ 125', 2006, 30.00, 4.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar configuração ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_config();
