/*
  FIX 2 (HIGH): Analytics functions — add admin guard

  Execute via Supabase Dashboard > SQL Editor

  This script:
  1. Creates the transaction_type enum if missing (original migration silently failed)
  2. Creates the business_transactions table if missing
  3. Adds is_admin() checks to 4 SECURITY DEFINER analytics functions
*/

-- ============================================================
-- STEP 1: Ensure transaction_type enum exists
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM (
    'direct_business',
    'referral',
    'consortium'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- STEP 2: Ensure business_transactions table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type public.transaction_type NOT NULL,
  member_from_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_to_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(15, 2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  consortium_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT consortium_must_have_group CHECK (
    (transaction_type = 'consortium' AND consortium_group_id IS NOT NULL) OR
    (transaction_type != 'consortium')
  ),
  CONSTRAINT business_must_have_receiver CHECK (
    (transaction_type IN ('direct_business', 'referral') AND member_to_id IS NOT NULL) OR
    (transaction_type = 'consortium')
  )
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_business_transactions_member_from
  ON public.business_transactions(member_from_id);
CREATE INDEX IF NOT EXISTS idx_business_transactions_member_to
  ON public.business_transactions(member_to_id);
CREATE INDEX IF NOT EXISTS idx_business_transactions_consortium_group
  ON public.business_transactions(consortium_group_id);
CREATE INDEX IF NOT EXISTS idx_business_transactions_type
  ON public.business_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_business_transactions_date
  ON public.business_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_business_transactions_created_at
  ON public.business_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_transactions_members
  ON public.business_transactions(member_from_id, member_to_id);

-- RLS
ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop if exist to avoid duplicates)
DROP POLICY IF EXISTS "Admins can view all business transactions" ON public.business_transactions;
CREATE POLICY "Admins can view all business transactions"
  ON public.business_transactions FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Members can view own business transactions" ON public.business_transactions;
CREATE POLICY "Members can view own business transactions"
  ON public.business_transactions FOR SELECT TO authenticated
  USING (member_from_id = auth.uid() OR member_to_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert business transactions" ON public.business_transactions;
CREATE POLICY "Admins can insert business transactions"
  ON public.business_transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update business transactions" ON public.business_transactions;
CREATE POLICY "Admins can update business transactions"
  ON public.business_transactions FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete business transactions" ON public.business_transactions;
CREATE POLICY "Admins can delete business transactions"
  ON public.business_transactions FOR DELETE TO authenticated
  USING (public.is_admin());

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_business_transactions_updated_at ON public.business_transactions;
CREATE TRIGGER update_business_transactions_updated_at
  BEFORE UPDATE ON public.business_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 3: Analytics functions with admin guard
-- ============================================================

-- get_total_business_value(): admin only
CREATE OR REPLACE FUNCTION public.get_total_business_value()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN (SELECT COALESCE(SUM(amount), 0) FROM public.business_transactions);
END;
$$;

-- get_value_by_transaction_type(): admin only
CREATE OR REPLACE FUNCTION public.get_value_by_transaction_type()
RETURNS TABLE (
  transaction_type public.transaction_type,
  total_value numeric,
  transaction_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN QUERY
    SELECT
      bt.transaction_type,
      COALESCE(SUM(bt.amount), 0) AS total_value,
      COUNT(*) AS transaction_count
    FROM public.business_transactions bt
    GROUP BY bt.transaction_type
    ORDER BY total_value DESC;
END;
$$;

-- get_member_business_stats(uuid): admin or own data
CREATE OR REPLACE FUNCTION public.get_member_business_stats(member_uuid uuid)
RETURNS TABLE (
  total_given numeric,
  total_received numeric,
  total_transactions bigint,
  referrals_given bigint,
  referrals_received bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() AND member_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: admin or own data only';
  END IF;
  RETURN QUERY
    SELECT
      COALESCE(SUM(CASE WHEN bt.member_from_id = member_uuid THEN bt.amount ELSE 0 END), 0) AS total_given,
      COALESCE(SUM(CASE WHEN bt.member_to_id = member_uuid THEN bt.amount ELSE 0 END), 0) AS total_received,
      COUNT(*) AS total_transactions,
      COUNT(*) FILTER (WHERE bt.transaction_type = 'referral' AND bt.member_from_id = member_uuid) AS referrals_given,
      COUNT(*) FILTER (WHERE bt.transaction_type = 'referral' AND bt.member_to_id = member_uuid) AS referrals_received
    FROM public.business_transactions bt
    WHERE bt.member_from_id = member_uuid OR bt.member_to_id = member_uuid;
END;
$$;

-- get_monthly_business_evolution(): admin only
CREATE OR REPLACE FUNCTION public.get_monthly_business_evolution()
RETURNS TABLE (
  month date,
  total_value numeric,
  transaction_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN QUERY
    SELECT
      DATE_TRUNC('month', bt.transaction_date)::date AS month,
      COALESCE(SUM(bt.amount), 0) AS total_value,
      COUNT(*) AS transaction_count
    FROM public.business_transactions bt
    WHERE bt.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', bt.transaction_date)
    ORDER BY month DESC;
END;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE public.business_transactions IS 'Stores business transactions between members (direct business, referrals, consortium-related)';
COMMENT ON FUNCTION public.get_total_business_value() IS 'Returns total value moved across all transactions (admin only)';
COMMENT ON FUNCTION public.get_value_by_transaction_type() IS 'Returns total value and count by transaction type (admin only)';
COMMENT ON FUNCTION public.get_member_business_stats(uuid) IS 'Returns business statistics for a specific member (admin or own data)';
COMMENT ON FUNCTION public.get_monthly_business_evolution() IS 'Returns monthly business evolution for the last 12 months (admin only)';
