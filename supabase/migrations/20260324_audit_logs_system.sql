-- ================================================
-- MIGRAÇÃO: SISTEMA DE AUDITORIA E LOGS CONTÍNUOS
-- ================================================

-- 1. Criação da Tabela Central de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se o user for deletado, mantemos o log como 'NULL / orphaned'
    action VARCHAR(255) NOT NULL, -- ex: 'INSERT', 'UPDATE', 'DELETE', 'LOGIN_ATTEMPT'
    resource VARCHAR(255) NOT NULL, -- ex: 'entregas', 'fechamentos', 'auth'
    resource_id VARCHAR(255), -- ID do recurso afetado (se aplicável)
    old_value JSONB, -- Estado anterior (útil para rolbacks e análises)
    new_value JSONB, -- Novo estado
    ip_address INET, -- IP que gerou a ação
    user_agent TEXT, -- Browser / Client utilizado
    status VARCHAR(50) DEFAULT 'success', -- 'success' ou 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices robustos para filtragem no Dashboard Administrativo
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Habilitar RLS estrito (Apenas Admin pode ver os logs via Painel)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Proteção onde NINGUÉM via client pode inserir ou alterar os logs (Inserts serão feitos via Service Role Key Backend ou DB Trigger diretamente)
-- (Vamos criar uma policy apenas de leitura caso o admin tenha uma FLAG no metadata, porém em projetos típicos admins usam RLS bypass nativo)

-- 3. Função Genérica e Automática de Trigger de Captura PostgreSQL
CREATE OR REPLACE FUNCTION log_audit_event_trigger()
RETURNS trigger AS $$
DECLARE
    old_data jsonb := null;
    new_data jsonb := null;
    affected_id text := null;
BEGIN
    -- Captura estado baseado na operação
    IF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        affected_id := NEW.id::text;
    ELSIF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        affected_id := OLD.id::text;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        affected_id := NEW.id::text;
    END IF;

    -- A função auth.uid() puxa do JWT atual do Supabase quem enviou a requisição no front.
    -- Insere o rastreamento automaticamente de forma síncrona com o CUD.
    INSERT INTO audit_logs (
        user_id, 
        action, 
        resource, 
        resource_id, 
        old_value, 
        new_value, 
        ip_address, 
        user_agent
    )
    VALUES (
        auth.uid(),                   -- ID extraído seguro da transação API do Supabase
        TG_OP,                        -- INSERT / UPDATE / DELETE
        TG_TABLE_NAME,                -- 'entregas', 'fechamentos', etc
        affected_id, 
        old_data, 
        new_data,
        inet(current_setting('request.headers', true)::json->>'x-forwarded-for'), -- Pega IP real mapeado pelo proxy do Supabase (quando possível)
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    IF TG_OP = 'DELETE' THEN 
        RETURN OLD; 
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Instalar Gatilhos (Triggers) em tabelas-chave
-- * Monitoramento de Fechamentos Financeiros (Altamente Sensível)
DROP TRIGGER IF EXISTS audit_fechamentos_tgr ON fechamentos;
CREATE TRIGGER audit_fechamentos_tgr
    AFTER INSERT OR UPDATE OR DELETE ON fechamentos
    FOR EACH ROW EXECUTE FUNCTION log_audit_event_trigger();

-- * Monitoramento de Entregas (Controle de Produção)
DROP TRIGGER IF EXISTS audit_entregas_tgr ON entregas;
CREATE TRIGGER audit_entregas_tgr
    AFTER INSERT OR UPDATE OR DELETE ON entregas
    FOR EACH ROW EXECUTE FUNCTION log_audit_event_trigger();

-- Nota: Se existir uma tabela 'valores' genérica referenciada pelo usuário, podemos vinculá-la abaixo. 
-- Abastecimentos e Manutenções também costumam conter "valores" logados.
DROP TRIGGER IF EXISTS audit_abastecimentos_tgr ON abastecimentos;
CREATE TRIGGER audit_abastecimentos_tgr
    AFTER INSERT OR UPDATE OR DELETE ON abastecimentos
    FOR EACH ROW EXECUTE FUNCTION log_audit_event_trigger();

-- 5. Retenção de Logs Automática (Limpeza Trimestral / Compressão teórica de disco)
-- ATENÇÃO: Extensão pg_cron deve estar ativa em Database > Extensions no painel do Supabase.
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
    'delete-old-audit-logs', 
    '0 0 * * *', -- Roda todos os dias na meia-noite
    $$ DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days' $$
);
*/
