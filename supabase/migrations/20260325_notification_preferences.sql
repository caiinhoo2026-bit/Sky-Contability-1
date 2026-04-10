-- ================================================
-- TABELAS PARA ALERTAS MULTICANAIS E PREFERÊNCIAS
-- ================================================

-- 1. Tabela de Configuração e Opt-in por Ação
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  slack_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '23:00',
  quiet_hours_end TIME DEFAULT '07:00',
  events JSONB DEFAULT '{"NEW_LOGIN": true, "MFA_CHANGED": true, "FECHAMENTO": true, "EXPORT": false, "ANOMALY": true}',
  slack_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inbox Pessoal do Usuário (Sino de Notificações)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'HIGH'
  event_type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prefs Select" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Prefs Update" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Prefs Insert" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Noti Select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Noti Update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 3. Habilitando a transmissão do Banco Supabase direto pro Frontend via Websockets (PWA / In-App)
-- Qualquer Insert na tabela Notifications irá gritar no client assíncronamente.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
