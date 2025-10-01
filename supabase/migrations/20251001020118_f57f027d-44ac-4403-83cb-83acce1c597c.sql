-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'member');

-- Create enum for quota status
CREATE TYPE public.quota_status AS ENUM ('active', 'contemplated');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
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
CREATE TABLE public.companies (
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
CREATE TABLE public.member_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, company_id)
);

-- Create consortium_groups table
CREATE TABLE public.consortium_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  asset_value DECIMAL(15,2) NOT NULL,
  total_quotas INTEGER NOT NULL CHECK (total_quotas > 0),
  monthly_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quotas table
CREATE TABLE public.quotas (
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

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

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

-- RLS Policies for member_companies
CREATE POLICY "Users can view all member_companies" ON public.member_companies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own links" ON public.member_companies
  FOR ALL USING (member_id = auth.uid());

CREATE POLICY "Admins can manage all member_companies" ON public.member_companies
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for consortium_groups
CREATE POLICY "Users can view all groups" ON public.consortium_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage groups" ON public.consortium_groups
  FOR ALL USING (public.is_admin(auth.uid()));

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

-- Insert master admin user (will need to create auth user separately)
-- Password will be set during first authentication setup