/*
  # Create Statistics Functions

  ## Overview
  Functions to get dynamic statistics for the landing page counters.

  ## Functions
  - get_active_members_count() - Count of active members
  - get_companies_count() - Count of companies
  - get_total_value_moved() - Sum of deals + draws asset values
  - get_landing_stats() - All stats in one call
*/

-- Function to count active members
CREATE OR REPLACE FUNCTION public.get_active_members_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM public.members
  WHERE status = 'active';
$$;

-- Function to count companies
CREATE OR REPLACE FUNCTION public.get_companies_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM public.companies;
$$;

-- Function to calculate total value moved (deals + draws)
CREATE OR REPLACE FUNCTION public.get_total_value_moved()
RETURNS decimal(15, 2)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      -- Sum of confirmed deals
      SELECT COALESCE(SUM(amount), 0)
      FROM public.closed_deals
      WHERE status = 'confirmed'
    ) + (
      -- Sum of asset values from completed draws
      SELECT COALESCE(SUM(g.asset_value), 0)
      FROM public.draws d
      JOIN public.groups g ON d.group_id = g.id
      WHERE d.deleted_at IS NULL
    ),
    0
  );
$$;

-- Function to get all landing page stats in one call
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'members', public.get_active_members_count(),
    'companies', public.get_companies_count(),
    'total_value', public.get_total_value_moved()
  );
$$;

-- Grant execute permissions to anon (for public landing page)
GRANT EXECUTE ON FUNCTION public.get_active_members_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_companies_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_value_moved() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated;
