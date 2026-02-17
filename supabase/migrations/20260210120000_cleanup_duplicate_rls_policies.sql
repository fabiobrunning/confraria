/*
  # Cleanup Duplicate RLS Policies

  ## Purpose
  Remove duplicate RLS policies that were created by overlapping migrations.
  Each table had both old-style (*_policy) and descriptive policies doing the same thing.

  ## Removed (20 policies)
  - business_transactions: 3 duplicate *_policy entries
  - consortium_groups: 4 duplicate *_policy entries
  - draws: 2 duplicate *_policy entries
  - groups: 3 duplicate *_policy entries
  - member_companies: 4 duplicate *_policy entries
  - quotas: 4 duplicate *_policy entries
*/

-- Safely drop policies only if the table exists
DO $$
BEGIN
  -- business_transactions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_transactions') THEN
    DROP POLICY IF EXISTS "business_transactions_delete_policy" ON public.business_transactions;
    DROP POLICY IF EXISTS "business_transactions_insert_policy" ON public.business_transactions;
    DROP POLICY IF EXISTS "business_transactions_update_policy" ON public.business_transactions;
  END IF;

  -- consortium_groups
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consortium_groups') THEN
    DROP POLICY IF EXISTS "consortium_groups_delete_policy" ON public.consortium_groups;
    DROP POLICY IF EXISTS "consortium_groups_insert_policy" ON public.consortium_groups;
    DROP POLICY IF EXISTS "consortium_groups_select_policy" ON public.consortium_groups;
    DROP POLICY IF EXISTS "consortium_groups_update_policy" ON public.consortium_groups;
  END IF;

  -- draws
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'draws') THEN
    DROP POLICY IF EXISTS "draws_delete_policy" ON public.draws;
    DROP POLICY IF EXISTS "draws_insert_policy" ON public.draws;
  END IF;

  -- groups
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') THEN
    DROP POLICY IF EXISTS "groups_delete_policy" ON public.groups;
    DROP POLICY IF EXISTS "groups_insert_policy" ON public.groups;
    DROP POLICY IF EXISTS "groups_update_policy" ON public.groups;
  END IF;

  -- member_companies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_companies') THEN
    DROP POLICY IF EXISTS "member_companies_delete_policy" ON public.member_companies;
    DROP POLICY IF EXISTS "member_companies_insert_policy" ON public.member_companies;
    DROP POLICY IF EXISTS "member_companies_select_policy" ON public.member_companies;
    DROP POLICY IF EXISTS "member_companies_update_policy" ON public.member_companies;
  END IF;

  -- quotas
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quotas') THEN
    DROP POLICY IF EXISTS "quotas_delete_policy" ON public.quotas;
    DROP POLICY IF EXISTS "quotas_insert_policy" ON public.quotas;
    DROP POLICY IF EXISTS "quotas_select_policy" ON public.quotas;
    DROP POLICY IF EXISTS "quotas_update_policy" ON public.quotas;
  END IF;
END;
$$;
