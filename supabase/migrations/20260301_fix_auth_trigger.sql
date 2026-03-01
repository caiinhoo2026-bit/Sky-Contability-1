-- ================================================
-- CORREÇÃO: Trigger de criação de configurações padrão
-- ================================================

-- A função original falhava porque não especificava o schema 'public' 
-- e executava no contexto 'auth' pelo Supabase, causando
-- o erro "Database error saving new user".

CREATE OR REPLACE FUNCTION public.create_default_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.configuracoes (user_id, veiculo, ano, consumo_medio, valor_por_entrega)
  VALUES (NEW.id, 'Yamaha XTZ 125', 2006, 30.00, 4.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
