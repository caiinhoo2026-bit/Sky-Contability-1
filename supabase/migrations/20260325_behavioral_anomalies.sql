-- ================================================
-- MIGRAÇÃO DE SEGURANÇA: ANOMALY DETECTION B2B
-- ================================================

-- 1. Tabela de Perfil de Base Comportamental (Machine Learning Simplificado)
CREATE TABLE IF NOT EXISTS user_behavior_baseline (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    avg_daily_operations FLOAT DEFAULT 0,
    common_hours INT[] DEFAULT '{}',
    common_ips TEXT[] DEFAULT '{}',
    common_countries TEXT[] DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Alertas de Risco Detectado (Scrutiny Queue)
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    risk_score FLOAT NOT NULL,
    level VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    reasons TEXT[] DEFAULT '{}', -- Motivos do risco ex: HORARIO_INCOMUM
    metadata JSONB DEFAULT '{}', -- Contexto extra (IP, req)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_anomaly_alerts_user ON anomaly_alerts(user_id);
CREATE INDEX idx_anomaly_alerts_level ON anomaly_alerts(level);

-- Habilitar RLS (Apenas Leitura Admin via Service_Key no backend)
ALTER TABLE user_behavior_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Função Agredadora de Background (Chamada Diariamente pelo Vercel Cron)
-- Analisa os últimos 30 dias da tabela 'audit_logs' que criamos anteriormente
CREATE OR REPLACE FUNCTION calculate_daily_baselines()
RETURNS void AS $$
BEGIN
  -- UPSERT da tabela de baseline agregando os dados dos audit_logs
  INSERT INTO user_behavior_baseline (user_id, avg_daily_operations, common_ips, last_updated)
  SELECT 
      user_id,
      COUNT(id)::float / 30 as avg_ops,
      -- Pegando os IPs mais comuns agressivamente via array_agg. Numa base de TBs usaríamos MATERIALIZED VIEW.
      array_agg(DISTINCT ip_address::text) as frequent_ips,
      NOW()
  FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET 
      avg_daily_operations = EXCLUDED.avg_daily_operations,
      common_ips = EXCLUDED.common_ips,
      last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
