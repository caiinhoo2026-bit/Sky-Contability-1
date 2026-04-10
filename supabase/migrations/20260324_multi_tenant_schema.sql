-- ================================================
-- MIGRAÇÃO SAAS: ARQUITETURA MULTI-TENANT B2B
-- ================================================

-- 1. Tabela Base de Inquilinos (Empresas)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    max_users INT DEFAULT 3,
    max_fechamentos_month INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Interseção (Cargos e Vínculo Usuário <-> Empresa)
CREATE TABLE IF NOT EXISTS company_users (
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'employee', -- 'admin', 'manager', 'employee'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (company_id, user_id)
);

-- Índices úteis
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- 3. Função Helper para verificação rápida do RLS
CREATE OR REPLACE FUNCTION has_company_access(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Superadmin bypass global (Ajustar role em um claims auth / metadata para painéis SaaS)
    IF current_setting('request.jwt.claims', true)::json->>'is_superadmin' = 'true' THEN
        RETURN true;
    END IF;

    -- Funcionário / Admin tem acesso se está vinculado a companhia alvo
    RETURN EXISTS (
        SELECT 1 FROM company_users 
        WHERE user_id = auth.uid() AND company_id = cid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Modificações Estruturais no Banco Existente (Entregas de Exemplo)
-- OBS: Adapte para adicionar 'company_id' em 'abastecimentos' e 'fechamentos' também.
ALTER TABLE entregas ADD COLUMN company_id UUID REFERENCES companies(id);

-- 5. Atualização de Políticas (Isolamento Massivo Multi-Tenant)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Exemplo: Empresas só são visíveis se o user for membro
CREATE POLICY "Visualizar empresas as quais pertence"
    ON companies FOR SELECT
    USING (has_company_access(id));

-- Exemplo re-escrito de Entregas (Muda de user_id owner -> para company owner isolado)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias entregas" ON entregas;
CREATE POLICY "Visualizar entregas da sua empresa"
    ON entregas FOR SELECT
    USING (has_company_access(company_id));

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias entregas" ON entregas;
CREATE POLICY "Inserir entregas na sua empresa"
    ON entregas FOR INSERT
    WITH CHECK (has_company_access(company_id));
