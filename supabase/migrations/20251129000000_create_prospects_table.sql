-- Migration: create_prospects_table
-- Description: Cria tabela prospects para captura de leads do formulário público
-- Created: 2024-11-29

-- ============================================
-- TABELA PROSPECTS
-- ============================================

CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados pessoais
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Dados da empresa
    company_name VARCHAR(255) NOT NULL,
    business_sector VARCHAR(255) NOT NULL,
    
    -- Origem e experiência
    how_found_us VARCHAR(50) NOT NULL,
    has_networking_experience BOOLEAN NOT NULL DEFAULT FALSE,
    networking_experience TEXT,
    
    -- Controle
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    contacted_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_prospects_status CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
    CONSTRAINT chk_prospects_how_found CHECK (how_found_us IN ('instagram', 'linkedin', 'referral', 'google', 'event', 'other'))
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_created ON prospects(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT anônimo (formulário público)
CREATE POLICY "prospects_insert_anon" ON prospects
    FOR INSERT TO anon
    WITH CHECK (TRUE);

-- Permitir SELECT para usuários autenticados
CREATE POLICY "prospects_select_auth" ON prospects
    FOR SELECT TO authenticated
    USING (TRUE);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "prospects_update_auth" ON prospects
    FOR UPDATE TO authenticated
    USING (TRUE);

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

-- Criar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON prospects;
CREATE TRIGGER trigger_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_prospects_updated_at();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE prospects IS 'Tabela de prospects capturados pelo formulário público de interesse';
COMMENT ON COLUMN prospects.status IS 'Status do prospect: new, contacted, converted, rejected';
COMMENT ON COLUMN prospects.how_found_us IS 'Como conheceu a Confraria: instagram, linkedin, referral, google, event, other';
COMMENT ON COLUMN prospects.has_networking_experience IS 'Se o prospect já participou de grupos de networking antes';
COMMENT ON COLUMN prospects.networking_experience IS 'Descrição da experiência prévia com networking (se houver)';
