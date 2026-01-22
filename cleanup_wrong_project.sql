-- SCRIPT DE LIMPEZA (CLEANUP)
-- Execute este script no SQL Editor do projeto ERRADO (Elo 42) para remover tudo que foi criado do Palma.PSD.

-- 1. Remover Triggers e Functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Remover Tabelas (na ordem correta por causa das chaves estrangeiras)
DROP TABLE IF EXISTS public.productions;
DROP TABLE IF EXISTS public.periods;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.production_types;
DROP TABLE IF EXISTS public.profile_clients;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.profiles;

-- 3. (Opcional) Se você criou Policies manualmente sem ser nas tabelas acima, elas somem junto com as tabelas.

-- 4. ATENÇÃO: Os usuários criados na aba "Authentication" precisam ser deletados manualmente na aba Authentication > Users.
-- Este script limpa apenas o Banco de Dados (public schema).
