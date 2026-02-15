# 🔧 Instruções para Configurar o Banco de Dados Supabase

## Passo 1: Executar a Migration SQL

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto: `bwnfjsbgzbjsrrepssdi`
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo: `supabase/migrations/20260212_initial_schema.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

## Passo 2: Verificar Tabelas Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver 4 tabelas criadas:
   - ✅ `entregas`
   - ✅ `abastecimentos`
   - ✅ `manutencoes`
   - ✅ `configuracoes`

## Passo 3: Verificar RLS (Row Level Security)

1. Clique em qualquer tabela
2. Clique na aba **Policies**
3. Você deve ver 4 policies para cada tabela (SELECT, INSERT, UPDATE, DELETE)

## ✅ Pronto!

Após executar o SQL, volte aqui e me confirme que deu tudo certo.

Se houver algum erro, me envie a mensagem de erro completa.
