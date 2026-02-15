# ⚠️ EXECUTAR MIGRATION (CORRIGIDA)

## Passo 1: Executar SQL Corrigido

O erro anterior aconteceu porque as colunas calculadas precisam ser removidas primeiro.

1. Abra o **Supabase Dashboard** → **SQL Editor**
2. **Apague** a query anterior (se ainda estiver lá)
3. Copie o SQL abaixo:

```sql
-- Remover colunas calculadas primeiro (ordem importante!)
ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS valor_por_litro CASCADE;

ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS custo_por_km CASCADE;

-- Depois remover as colunas normais
ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS litros CASCADE;

ALTER TABLE abastecimentos 
  DROP COLUMN IF EXISTS km_atual CASCADE;
```

4. Cole no editor e clique em **Run**

## Passo 2: Verificar

1. Vá em **Table Editor** → **abastecimentos**
2. A tabela deve ter apenas:
   - ✅ id
   - ✅ user_id
   - ✅ data
   - ✅ valor_pago
   - ✅ created_at
   - ✅ updated_at

## ✅ Pronto!

Confirme aqui após executar.
