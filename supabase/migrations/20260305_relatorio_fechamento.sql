-- SQL para Configuração de Fechamentos e Resumos
DROP TABLE IF EXISTS public.fechamentos CASCADE;

CREATE TABLE public.fechamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_periodo TEXT CHECK (tipo_periodo IN ('semanal', 'quinzenal', 'mensal', 'personalizado')),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    total_entregas INT NOT NULL DEFAULT 0,
    total_ganhos DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_abastecimentos DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_manutencoes DECIMAL(10,2) NOT NULL DEFAULT 0,
    lucro_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
    ticket_medio DECIMAL(10,2),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data_inicio, data_fim)
);

ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus fechamentos"
    ON public.fechamentos FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_fechamentos_user_periodo ON public.fechamentos(user_id, data_inicio, data_fim);

-- IMPORTANTE: Remover a função antes de criá-la novamente para permitir mudar os campos de retorno
DROP FUNCTION IF EXISTS resumo_periodo(date, date);

CREATE OR REPLACE FUNCTION resumo_periodo(data_inicio DATE, data_fim DATE)
RETURNS TABLE(
    total_entregas INT,
    total_ganhos DECIMAL,
    total_abastecimentos DECIMAL,
    total_manutencoes DECIMAL,
    lucro_liquido DECIMAL
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INT FROM entregas WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim),
        (SELECT COALESCE(SUM(receita), 0)::DECIMAL FROM entregas WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim),
        (SELECT COALESCE(SUM(valor_pago), 0)::DECIMAL FROM abastecimentos WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim),
        (SELECT COALESCE(SUM(valor), 0)::DECIMAL FROM manutencoes WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim),
        (SELECT COALESCE(SUM(receita), 0)::DECIMAL FROM entregas WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim)
        - (SELECT COALESCE(SUM(valor_pago), 0)::DECIMAL FROM abastecimentos WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim)
        - (SELECT COALESCE(SUM(valor), 0)::DECIMAL FROM manutencoes WHERE user_id = v_user_id AND data BETWEEN data_inicio AND data_fim);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
