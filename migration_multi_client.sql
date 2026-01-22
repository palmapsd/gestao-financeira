-- =============================================
-- MIGRAÇÃO: SUPORTE A MÚLTIPLOS CLIENTES E FIX EMAIL
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Cria tabela associativa NxN
CREATE TABLE IF NOT EXISTS profile_clients (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (profile_id, client_id)
);

-- 2. Habilita RLS
ALTER TABLE profile_clients ENABLE ROW LEVEL SECURITY;

-- 3. Policy para Admin ver tudo
CREATE POLICY "ProfileClients: admin can all" 
  ON profile_clients 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Policy para usuário ver seus próprios vínculos
CREATE POLICY "ProfileClients: user can view own" 
  ON profile_clients FOR SELECT
  USING (auth.uid() = profile_id);

-- 5. Migrar dados existentes (Unico para Multiplo)
-- Insere na nova tabela baseado na coluna antiga cliente_id
INSERT INTO profile_clients (profile_id, client_id)
SELECT id, cliente_id
FROM profiles
WHERE cliente_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Atualizar Policies das outras tabelas para usar a nova relação
-- (Você pode precisar remover as antigas primeiro se houver conflito de nome, 
--  mas aqui vamos criar novas ou substituir se fosse replace)

-- Clients: Viewer pode ver clientes que ele tem vínculo
DROP POLICY IF EXISTS "Clients: authenticated can read" ON clients;
CREATE POLICY "Clients: viewer can read linked" 
  ON clients FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') -- Admin vê tudo
    OR
    EXISTS (SELECT 1 FROM profile_clients WHERE profile_id = auth.uid() AND client_id = id) -- Viewer vê vinculados
  );

-- Projects
DROP POLICY IF EXISTS "Projects: authenticated can read" ON projects;
CREATE POLICY "Projects: viewer can read linked" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (SELECT 1 FROM profile_clients WHERE profile_id = auth.uid() AND client_id = cliente_id)
  );

-- Periods
DROP POLICY IF EXISTS "Periods: authenticated can read" ON periods;
CREATE POLICY "Periods: viewer can read linked" 
  ON periods FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (SELECT 1 FROM profile_clients WHERE profile_id = auth.uid() AND client_id = cliente_id)
  );

-- Productions
DROP POLICY IF EXISTS "Productions: authenticated can read" ON productions;
CREATE POLICY "Productions: viewer can read linked" 
  ON productions FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (SELECT 1 FROM profile_clients WHERE profile_id = auth.uid() AND client_id = cliente_id)
  );
