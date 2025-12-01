-- Migration: create_prospects_table
-- Criado em: 2025-11-29
-- Descricao: Tabela para armazenar prospects do formulario de interesse

-- Remover tabela se existir (para desenvolvimento)
DROP TABLE IF EXISTS prospects;

CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados pessoais
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,

    -- Origem
    how_found_us VARCHAR(50) NOT NULL,

    -- Dados da empresa
    company_name VARCHAR(255) NOT NULL,
    business_sector VARCHAR(255) NOT NULL,

    -- Experiencia networking
    has_networking_experience BOOLEAN NOT NULL DEFAULT FALSE,
    networking_experience TEXT,

    -- Controle administrativo
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    contacted_at TIMESTAMP WITH TIME ZONE,
    contacted_by UUID,
    converted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,

    -- Sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT chk_prospects_status CHECK (status IN ('new', 'contacted', 'in_progress', 'converted', 'rejected')),
    CONSTRAINT chk_prospects_how_found CHECK (how_found_us IN ('instagram', 'linkedin', 'referral', 'google', 'event', 'other'))
);

-- Indices para otimizacao de queries
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_created ON prospects(created_at DESC);

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em cada UPDATE
CREATE TRIGGER trg_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode criar (formulario publico)
CREATE POLICY "prospects_insert_public" ON prospects
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

-- Policy: Usuarios autenticados podem ver todos os prospects
CREATE POLICY "prospects_select_auth" ON prospects
    FOR SELECT TO authenticated
    USING (TRUE);

-- Policy: Usuarios autenticados podem atualizar prospects
CREATE POLICY "prospects_update_auth" ON prospects
    FOR UPDATE TO authenticated
    USING (TRUE);

-- Comentarios na tabela
COMMENT ON TABLE prospects IS 'Tabela de prospects do formulario de interesse Confraria';
COMMENT ON COLUMN prospects.full_name IS 'Nome completo do prospect';
COMMENT ON COLUMN prospects.email IS 'Email de contato';
COMMENT ON COLUMN prospects.phone IS 'Telefone de contato';
COMMENT ON COLUMN prospects.how_found_us IS 'Como conheceu a Confraria';
COMMENT ON COLUMN prospects.company_name IS 'Nome da empresa';
COMMENT ON COLUMN prospects.business_sector IS 'Setor de atuacao da empresa';
COMMENT ON COLUMN prospects.has_networking_experience IS 'Se possui experiencia com networking';
COMMENT ON COLUMN prospects.networking_experience IS 'Descricao da experiencia com networking';
COMMENT ON COLUMN prospects.status IS 'Status do prospect no funil';
COMMENT ON COLUMN prospects.contacted_at IS 'Data/hora do primeiro contato';
COMMENT ON COLUMN prospects.contacted_by IS 'UUID do usuario que fez o contato';
COMMENT ON COLUMN prospects.converted_at IS 'Data/hora da conversao para membro';
COMMENT ON COLUMN prospects.notes IS 'Notas internas sobre o prospect';
