-- ================================================
-- SISTEMA DE CONTROLE FINANCEIRO - ENTREGAS SHOPEE
-- SEED SCRIPT: Dados Fictícios para Testes
-- ================================================
--
-- INSTRUÇÕES DE USO:
-- 1. Crie um usuário na sua aplicação (via tela de Login/Cadastro)
-- 2. Copie o ID (UUID) desse usuário do painel do Supabase (Authentication > Users)
-- 3. Substitua o valor 'SEU_USER_ID_AQUI' abaixo pelo seu ID real
-- 4. Execute este script no SQL Editor do Supabase

DO $$
DECLARE
  v_user_id UUID := '5eaa9690-3a79-4335-aac9-360cf7298402'; -- User UID from Supabase Dashboard
BEGIN

  -- 1. Verifica se o usuário existe, se não, aborta com uma mensagem clara
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE NOTICE '⚠️ AVISO: O USUÁRIO % NÃO FOI ENCONTRADO.', v_user_id;
    RAISE NOTICE 'Por favor, crie um usuário primeiro e cole o ID correto neste script.';
    RETURN;
  END IF;

  -- 2. Limpar dados antigos do usuário para evitar duplicatas (Opcional, mas recomendado para testes)
  DELETE FROM entregas WHERE user_id = v_user_id;
  DELETE FROM abastecimentos WHERE user_id = v_user_id;
  DELETE FROM manutencoes WHERE user_id = v_user_id;
  -- A configuração já deve existir pela trigger 'create_default_config', então apenas atualizamos:
  UPDATE configuracoes 
  SET veiculo = 'Honda CG 160 Titan', ano = 2022, consumo_medio = 35.00, valor_por_entrega = 4.00
  WHERE user_id = v_user_id;

  -- 3. Inserir Entregas (Últimos 7 dias)
  RAISE NOTICE 'Inserindo Entregas...';
  INSERT INTO entregas (user_id, data, quantidade_pacotes, km_inicial, km_final)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '6 days', 45, 12000.00, 12050.50),
    (v_user_id, CURRENT_DATE - INTERVAL '5 days', 52, 12050.50, 12110.00),
    (v_user_id, CURRENT_DATE - INTERVAL '4 days', 38, 12110.00, 12140.20),
    (v_user_id, CURRENT_DATE - INTERVAL '3 days', 60, 12140.20, 12210.80),
    (v_user_id, CURRENT_DATE - INTERVAL '2 days', 41, 12210.80, 12260.00),
    (v_user_id, CURRENT_DATE - INTERVAL '1 days', 55, 12260.00, 12325.50),
    (v_user_id, CURRENT_DATE,                 48, 12325.50, 12380.00);

  -- 4. Inserir Abastecimentos
  RAISE NOTICE 'Inserindo Abastecimentos...';
  INSERT INTO abastecimentos (user_id, data, valor_pago)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '6 days', 30.00),
    (v_user_id, CURRENT_DATE - INTERVAL '3 days', 45.00),
    (v_user_id, CURRENT_DATE,                 35.00);

  -- 5. Inserir Manutenções
  RAISE NOTICE 'Inserindo Manutenções...';
  INSERT INTO manutencoes (user_id, tipo, descricao, valor, data, km_troca, vida_util_km)
  VALUES
    (v_user_id, 'oleo', 'Troca de Óleo Motul', 45.00, CURRENT_DATE - INTERVAL '10 days', 11000.00, 1500),
    (v_user_id, 'pneus', 'Pneu Traseiro Michelin', 250.00, CURRENT_DATE - INTERVAL '30 days', 9500.00, 12000),
    (v_user_id, 'corrente', 'Kit Relação Allen', 180.00, CURRENT_DATE - INTERVAL '45 days', 8000.00, 15000);

  RAISE NOTICE '✅ SEED CONCLUÍDO COM SUCESSO PARA O USUÁRIO %!', v_user_id;

END $$;
