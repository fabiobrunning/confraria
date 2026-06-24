-- ============================================================
-- MIGRATION: LIMPEZA DE SCHEMA LEGADO
-- Data: 2026-06-24
-- Autor: @data-engineer (Dara)
-- Risco: MÉDIO — remove tabelas/funções duplicadas
--
-- EXECUÇÃO:
--   1. Rode 01-audit-database-state.sql ANTES e confirme que:
--      - members.COUNT = 0
--      - consortium_groups.COUNT = 0
--      - is_admin retorna 3 funções (confirma duplicidade)
--   2. SNAPSHOT manual no Supabase Dashboard antes de aplicar
--   3. Aplique esta migration via: supabase db push
--
-- ROLLBACK: ver 20260624000001_rollback_legacy_schema.sql
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 1: REMOVER TABELA MEMBERS (legacy)
-- Condição: só remove se estiver vazia
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'members'
  ) THEN
    SELECT COUNT(*) INTO row_count FROM public.members;

    IF row_count = 0 THEN
      DROP TABLE public.members CASCADE;
      RAISE NOTICE 'Tabela members removida (estava vazia).';
    ELSE
      RAISE WARNING 'Tabela members tem % linhas. Não foi removida. Revisar dados antes de dropar.', row_count;
    END IF;
  ELSE
    RAISE NOTICE 'Tabela members não existe. Pulando.';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 2: REMOVER TABELA CONSORTIUM_GROUPS (deprecated)
-- Condição: só remove se estiver vazia
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'consortium_groups'
  ) THEN
    SELECT COUNT(*) INTO row_count FROM public.consortium_groups;

    IF row_count = 0 THEN
      DROP TABLE public.consortium_groups CASCADE;
      RAISE NOTICE 'Tabela consortium_groups removida (estava vazia).';
    ELSE
      RAISE WARNING 'Tabela consortium_groups tem % linhas. Movendo dados para groups antes de dropar.', row_count;
      -- Migrar dados se necessário (avaliar coluna a coluna):
      -- INSERT INTO public.groups (name, ...) SELECT name, ... FROM public.consortium_groups ON CONFLICT DO NOTHING;
      -- Descomentar linha acima, validar e re-executar se necessário
    END IF;
  ELSE
    RAISE NOTICE 'Tabela consortium_groups não existe. Pulando.';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 3: CONSOLIDAR FUNÇÕES is_admin DUPLICADAS
-- Manter apenas is_admin(user_id uuid) — a mais segura
-- ────────────────────────────────────────────────────────────

-- Remover is_admin sem parâmetro (a mais perigosa — usa auth.uid() implicitamente
-- o que pode causar comportamentos inesperados em contextos sem sessão)
DROP FUNCTION IF EXISTS public.is_admin();

-- Remover is_admin(user_id UUID) uppercase — duplicata da uuid lowercase
DROP FUNCTION IF EXISTS public.is_admin(user_id UUID);

-- Garantir que a versão correta existe e está segura
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
      AND deleted_at IS NULL
  );
$$;

RAISE NOTICE 'Função is_admin consolidada em uma única versão (user_id uuid).';

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 4: CONSOLIDAR FUNÇÕES update_updated_at DUPLICADAS
-- Há: handle_updated_at, update_updated_at_column, update_member_companies_updated_at
-- Padronizar para handle_updated_at como função única
-- ────────────────────────────────────────────────────────────

-- Garantir que a função principal existe
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Redirecionar aliases para a principal (manter por compatibilidade de triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 5: REMOVER TABELA LEADS (consolidar em prospects)
-- Condição: só faz a consolidação se leads tiver dados
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  leads_count INTEGER;
  prospects_count INTEGER;
BEGIN
  -- Verificar existência das tabelas
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    RAISE NOTICE 'Tabela leads não existe. Pulando consolidação.';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO leads_count FROM public.leads;
  SELECT COUNT(*) INTO prospects_count FROM public.prospects;

  RAISE NOTICE 'leads: % registros | prospects: % registros', leads_count, prospects_count;

  IF leads_count = 0 THEN
    DROP TABLE public.leads CASCADE;
    RAISE NOTICE 'Tabela leads removida (estava vazia).';
  ELSE
    RAISE WARNING 'Tabela leads tem % registros. Consolidação manual necessária.', leads_count;
    RAISE WARNING 'Passos: 1) Revisar colunas de leads vs prospects, 2) Fazer INSERT de leads → prospects, 3) DROP TABLE leads.';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 6: REMOVER APP_SETTINGS se ainda existir (foi dropada)
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 7: ADICIONAR COMENTÁRIOS DOCUMENTANDO TABELAS ATIVAS
-- ────────────────────────────────────────────────────────────
COMMENT ON TABLE public.profiles IS
  'Membros da Confraria Pedra Branca. Login via telefone@confraria.local. pre_registered=true = nunca acessou.';

COMMENT ON TABLE public.companies IS
  'Empresas dos membros. Exibidas na home pública. website/instagram = links clicáveis.';

COMMENT ON TABLE public.groups IS
  'Grupos de consórcio. Substituiu consortium_groups (deprecated em 2026-02-10).';

COMMENT ON TABLE public.quotas IS
  'Cotas dos grupos. status: active | contemplated. member_id nullable = cota sem titular.';

COMMENT ON TABLE public.draws IS
  'Registro de sorteios. drawn_numbers = todas as bolas. winning_number = ganhador.';

COMMENT ON TABLE public.pre_registration_attempts IS
  'Histórico de envios de credenciais. Limpar registros com status=failed com mais de 90 dias.';

COMMENT ON TABLE public.prospects IS
  'Formulário "Quero Conhecer". Leads externos interessados na Confraria.';

COMMENT ON TABLE public.activity_logs IS
  'Log de ações administrativas. Não deletar — auditoria de segurança.';

COMMIT;

-- ============================================================
-- PÓS-MIGRATION: Execute a query abaixo para confirmar
-- ============================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT routine_name, specific_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'is_admin';
