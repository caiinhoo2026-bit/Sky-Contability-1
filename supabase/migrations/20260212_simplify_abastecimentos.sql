-- ================================================
-- MIGRATION: Simplificar tabela abastecimentos
-- Remove colunas calculadas e campos desnecessários
-- ================================================

-- IMPORTANTE: Executar na ordem correta para evitar erros de dependência

-- 1. Primeiro, remover as colunas GENERATED (calculadas)
ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS valor_por_litro CASCADE;

ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS custo_por_km CASCADE;

-- 2. Depois, remover as colunas normais
ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS litros CASCADE;

ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS km_atual CASCADE;

-- 3. Verificar estrutura final
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'abastecimentos';
