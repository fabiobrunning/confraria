/*
  # Schema Inicial do Sistema de Confraria
  
  ## Descrição
  Cria o schema completo do sistema com todas as tabelas, relacionamentos, RLS e triggers.
  
  ## Tabelas Criadas
  
  ### 1. profiles
  - Perfil de usuários vinculado ao auth.users
  - Campos: id, full_name, phone, role, instagram, endereço completo
  - DELETE CASCADE: ao excluir usuário do auth.users, o perfil é excluído
  
  ### 2. companies
  - Empresas cadastradas pelos membros
  - Campos: id, name, cnpj, description, contatos, endereço completo
  
  ### 3. member_companies
  - Tabela de junção entre membros e empresas (muitos-para-muitos)
  - DELETE CASCADE: ao excluir membro ou empresa, os vínculos são excluídos
  
  ### 4. consortium_groups
  - Grupos de consórcio
  - Campos: id, description, asset_value, total_quotas, monthly_value
  
  ### 5. quotas
  - Cotas de consórcio vinculadas a grupos e membros
  - DELETE CASCADE: ao excluir grupo ou membro, as cotas são excluídas
  
  ## Segurança (RLS)
  
  ### profiles
  - SELECT: todos podem visualizar
  - UPDATE: usuários podem atualizar próprio perfil
  - INSERT: usuários podem inserir próprio perfil, admins podem inserir qualquer
  - DELETE: apenas admins
  
  ### companies
  - SELECT: todos podem visualizar
  - ALL: membros podem gerenciar suas empresas, admins gerenciam todas
  
  ### member_companies
  - SELECT: todos podem visualizar
  - ALL: membros podem gerenciar seus vínculos, admins gerenciam todos
  
  ### consortium_groups
  - SELECT: todos podem visualizar
  - ALL: apenas admins podem gerenciar
  
  ### quotas
  - SELECT: todos podem visualizar
  - ALL: apenas admins podem gerenciar
  
  ## Importante
  - Todos os relacionamentos usam ON DELETE CASCADE para manter integridade
  - RLS ativado em todas as tabelas
  - Triggers de updated_at configurados
  - Função is_admin() para verificação de permissões
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for quota status
DO $$ BEGIN
  CREATE TYPE public.quota_status AS ENUM ('active', 'contemplated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  instagram TEXT,
  address_cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  description TEXT,
  phone TEXT,
  instagram TEXT,
  address_cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create member_companies junction table
CREATE TABLE IF NOT EXISTS public.member_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, company_id)
);

-- Create consortium_groups table
CREATE TABLE IF NOT EXISTS public.consortium_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  asset_value DECIMAL(15,2) NOT NULL,
  total_quotas INTEGER NOT NULL CHECK (total_quotas > 0),
  monthly_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quotas table
CREATE TABLE IF NOT EXISTS public.quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.consortium_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quota_number INTEGER NOT NULL,
  status quota_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, quota_number)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert any profile" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Drop existing policies for companies
DROP POLICY IF EXISTS "Users can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;

-- RLS Policies for companies
CREATE POLICY "Users can view all companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.member_companies
      WHERE company_id = companies.id AND member_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all companies" ON public.companies
  FOR ALL USING (public.is_admin(auth.uid()));

-- Drop existing policies for member_companies
DROP POLICY IF EXISTS "Users can view all member_companies" ON public.member_companies;
DROP POLICY IF EXISTS "Users can manage their own links" ON public.member_companies;
DROP POLICY IF EXISTS "Admins can manage all member_companies" ON public.member_companies;

-- RLS Policies for member_companies
CREATE POLICY "Users can view all member_companies" ON public.member_companies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own links" ON public.member_companies
  FOR ALL USING (member_id = auth.uid());

CREATE POLICY "Admins can manage all member_companies" ON public.member_companies
  FOR ALL USING (public.is_admin(auth.uid()));

-- Drop existing policies for consortium_groups
DROP POLICY IF EXISTS "Users can view all groups" ON public.consortium_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.consortium_groups;

-- RLS Policies for consortium_groups
CREATE POLICY "Users can view all groups" ON public.consortium_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage groups" ON public.consortium_groups
  FOR ALL USING (public.is_admin(auth.uid()));

-- Drop existing policies for quotas
DROP POLICY IF EXISTS "Users can view all quotas" ON public.quotas;
DROP POLICY IF EXISTS "Admins can manage all quotas" ON public.quotas;

-- RLS Policies for quotas
CREATE POLICY "Users can view all quotas" ON public.quotas
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all quotas" ON public.quotas
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_consortium_groups_updated_at ON public.consortium_groups;
DROP TRIGGER IF EXISTS update_quotas_updated_at ON public.quotas;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consortium_groups_updated_at
  BEFORE UPDATE ON public.consortium_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotas_updated_at
  BEFORE UPDATE ON public.quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();