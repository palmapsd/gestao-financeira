-- =============================================
-- SCHEMA DO BANCO DE DADOS - PALMA.PSD
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. TABELA PROFILES (extensão da auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA PROJETOS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA PERÍODOS
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  nome_periodo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Fechado')),
  total_periodo DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA PRODUÇÕES
CREATE TABLE IF NOT EXISTS productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  projeto_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Feed', 'Story', 'Reels', 'Vídeo', 'Logo', 'Outro')),
  nome_producao TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  periodo_id UUID REFERENCES periods(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Fechado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_cliente ON projects(cliente_id);
CREATE INDEX IF NOT EXISTS idx_periods_cliente ON periods(cliente_id);
CREATE INDEX IF NOT EXISTS idx_productions_cliente ON productions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_productions_periodo ON productions(periodo_id);
CREATE INDEX IF NOT EXISTS idx_productions_data ON productions(data);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- PROFILES: usuário vê apenas seu próprio perfil
CREATE POLICY "Profiles: users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Profiles: users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Admin pode ver todos os profiles
CREATE POLICY "Profiles: admin can view all" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Profiles: admin can update all" 
  ON profiles FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Profiles: admin can insert" 
  ON profiles FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = id
  );

-- DADOS: Todos os autenticados podem ver (viewer e admin)
CREATE POLICY "Clients: authenticated can read" 
  ON clients FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Projects: authenticated can read" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Periods: authenticated can read" 
  ON periods FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Productions: authenticated can read" 
  ON productions FOR SELECT 
  TO authenticated 
  USING (true);

-- WRITE: Apenas admin pode modificar dados
CREATE POLICY "Clients: admin can insert" 
  ON clients FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients: admin can update" 
  ON clients FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients: admin can delete" 
  ON clients FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Projects
CREATE POLICY "Projects: admin can insert" 
  ON projects FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Projects: admin can update" 
  ON projects FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Projects: admin can delete" 
  ON projects FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Periods
CREATE POLICY "Periods: admin can insert" 
  ON periods FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Periods: admin can update" 
  ON periods FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Periods: admin can delete" 
  ON periods FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Productions
CREATE POLICY "Productions: admin can insert" 
  ON productions FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Productions: admin can update" 
  ON productions FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Productions: admin can delete" 
  ON productions FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TRIGGER: Criar profile automaticamente ao registrar
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNÇÃO: Recalcular total do período
-- =============================================

CREATE OR REPLACE FUNCTION recalculate_period_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE periods
  SET total_periodo = (
    SELECT COALESCE(SUM(total), 0)
    FROM productions
    WHERE periodo_id = COALESCE(NEW.periodo_id, OLD.periodo_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.periodo_id, OLD.periodo_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_period ON productions;
CREATE TRIGGER trigger_recalculate_period
  AFTER INSERT OR UPDATE OR DELETE ON productions
  FOR EACH ROW EXECUTE FUNCTION recalculate_period_total();
