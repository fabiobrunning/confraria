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

-- business_transactions: remove old *_policy duplicates (keep descriptive ones)
DROP POLICY IF EXISTS "business_transactions_delete_policy" ON public.business_transactions;
DROP POLICY IF EXISTS "business_transactions_insert_policy" ON public.business_transactions;
DROP POLICY IF EXISTS "business_transactions_update_policy" ON public.business_transactions;

-- consortium_groups: remove old *_policy duplicates (keep descriptive ones)
DROP POLICY IF EXISTS "consortium_groups_delete_policy" ON public.consortium_groups;
DROP POLICY IF EXISTS "consortium_groups_insert_policy" ON public.consortium_groups;
DROP POLICY IF EXISTS "consortium_groups_select_policy" ON public.consortium_groups;
DROP POLICY IF EXISTS "consortium_groups_update_policy" ON public.consortium_groups;

-- draws: remove old *_policy duplicates (ALL policy covers INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "draws_delete_policy" ON public.draws;
DROP POLICY IF EXISTS "draws_insert_policy" ON public.draws;

-- groups: remove old *_policy duplicates (keep descriptive ones)
DROP POLICY IF EXISTS "groups_delete_policy" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON public.groups;
DROP POLICY IF EXISTS "groups_update_policy" ON public.groups;

-- member_companies: remove old *_policy duplicates (ALL policies cover these)
DROP POLICY IF EXISTS "member_companies_delete_policy" ON public.member_companies;
DROP POLICY IF EXISTS "member_companies_insert_policy" ON public.member_companies;
DROP POLICY IF EXISTS "member_companies_select_policy" ON public.member_companies;
DROP POLICY IF EXISTS "member_companies_update_policy" ON public.member_companies;

-- quotas: remove old *_policy duplicates (ALL policy covers these)
DROP POLICY IF EXISTS "quotas_delete_policy" ON public.quotas;
DROP POLICY IF EXISTS "quotas_insert_policy" ON public.quotas;
DROP POLICY IF EXISTS "quotas_select_policy" ON public.quotas;
DROP POLICY IF EXISTS "quotas_update_policy" ON public.quotas;
