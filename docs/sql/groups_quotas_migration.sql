-- Migração: Grupos e Cotas de Investimento
-- Data: 2024-12-01

-- ============================================
-- TABELA: groups (Grupos dinâmicos)
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Cor hex para identificação visual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: member_groups (Relação membro-grupo)
-- ============================================
CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, group_id)
);

-- ============================================
-- TABELA: quotas (Tipos de cotas de investimento)
-- ============================================
CREATE TABLE IF NOT EXISTS quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  value DECIMAL(15,2), -- Valor da cota (opcional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: member_quotas (Cotas do membro)
-- ============================================
CREATE TABLE IF NOT EXISTS member_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quota_id UUID NOT NULL REFERENCES quotas(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1, -- Quantidade de cotas
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'contemplada')),
  acquired_at DATE, -- Data de aquisição
  contemplated_at DATE, -- Data de contemplação (se aplicável)
  notes TEXT, -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_member_groups_member_id ON member_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_groups_group_id ON member_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_member_quotas_member_id ON member_quotas(member_id);
CREATE INDEX IF NOT EXISTS idx_member_quotas_quota_id ON member_quotas(quota_id);
CREATE INDEX IF NOT EXISTS idx_member_quotas_status ON member_quotas(status);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Groups: Leitura pública, escrita admin
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups são visíveis para todos autenticados" ON groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas admin pode inserir groups" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Apenas admin pode atualizar groups" ON groups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Apenas admin pode deletar groups" ON groups
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Member Groups: Leitura autenticados, escrita admin
ALTER TABLE member_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member groups são visíveis para autenticados" ON member_groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas admin pode gerenciar member_groups" ON member_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Quotas: Leitura autenticados, escrita admin
ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotas são visíveis para autenticados" ON quotas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas admin pode inserir quotas" ON quotas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Apenas admin pode atualizar quotas" ON quotas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Apenas admin pode deletar quotas" ON quotas
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Member Quotas: Membro vê suas próprias, admin vê todas
ALTER TABLE member_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro vê suas próprias cotas" ON member_quotas
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Apenas admin pode gerenciar member_quotas" ON member_quotas
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- DADOS INICIAIS (Opcional)
-- ============================================

-- Grupos de exemplo
INSERT INTO groups (name, description, color) VALUES
  ('Diretoria', 'Membros da diretoria executiva', '#dc2626'),
  ('Conselho', 'Membros do conselho consultivo', '#2563eb'),
  ('Fundadores', 'Membros fundadores da confraria', '#ca8a04'),
  ('Membros Ativos', 'Membros ativos regulares', '#16a34a')
ON CONFLICT (name) DO NOTHING;

-- Cotas de exemplo
INSERT INTO quotas (name, description, value) VALUES
  ('Cota Fundador', 'Cota especial para membros fundadores', 50000.00),
  ('Cota Premium', 'Cota com benefícios premium', 25000.00),
  ('Cota Standard', 'Cota padrão de investimento', 10000.00)
ON CONFLICT DO NOTHING;
