/*
  # Create business_transactions table for Feature 9 - Área Gerencial

  ## Overview
  This migration creates the business_transactions table to track business dealings,
  referrals, and consortium-related transactions between members.

  ## Table: business_transactions

  Stores all types of business interactions:
  - Direct business between members
  - Referrals/indications
  - Consortium-related transactions

  Fields:
  - id (uuid, PK)
  - transaction_type (enum: 'direct_business', 'referral', 'consortium')
  - member_from_id (uuid, FK → profiles) - Who initiated/gave
  - member_to_id (uuid, FK → profiles, nullable) - Who received (nullable for consortium)
  - amount (numeric) - Transaction value in BRL
  - description (text) - Transaction description
  - transaction_date (date) - When transaction occurred
  - consortium_group_id (uuid, FK → groups, nullable) - Related consortium group
  - notes (text, nullable) - Additional notes
  - created_at, updated_at (timestamps)

  ## RLS Policies
  - Admins can perform all operations
  - Members can view transactions they're involved in

  ## Indexes
  Created for optimal query performance on:
  - Foreign keys (member_from_id, member_to_id, consortium_group_id)
  - Transaction type and date (for filtering and reporting)
*/

-- =====================================================
-- ENUM: transaction_type
-- =====================================================
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'direct_business',
    'referral',
    'consortium'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: business_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type transaction_type NOT NULL,
  member_from_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_to_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(15, 2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  consortium_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: consortium transactions must have consortium_group_id
  CONSTRAINT consortium_must_have_group CHECK (
    (transaction_type = 'consortium' AND consortium_group_id IS NOT NULL) OR
    (transaction_type != 'consortium')
  ),

  -- Constraint: direct_business and referral must have member_to_id
  CONSTRAINT business_must_have_receiver CHECK (
    (transaction_type IN ('direct_business', 'referral') AND member_to_id IS NOT NULL) OR
    (transaction_type = 'consortium')
  )
);

-- =====================================================
-- INDEXES
-- =====================================================
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

-- Composite index for member involvement (for queries like "all transactions involving member X")
CREATE INDEX IF NOT EXISTS idx_business_transactions_members
  ON public.business_transactions(member_from_id, member_to_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can view all business transactions"
  ON public.business_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Members can view transactions they're involved in
CREATE POLICY "Members can view own business transactions"
  ON public.business_transactions FOR SELECT
  TO authenticated
  USING (
    member_from_id = auth.uid() OR
    member_to_id = auth.uid()
  );

-- Policy: Admins can insert transactions
CREATE POLICY "Admins can insert business transactions"
  ON public.business_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update transactions
CREATE POLICY "Admins can update business transactions"
  ON public.business_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete transactions
CREATE POLICY "Admins can delete business transactions"
  ON public.business_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- TRIGGER: updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_business_transactions_updated_at ON public.business_transactions;
CREATE TRIGGER update_business_transactions_updated_at
  BEFORE UPDATE ON public.business_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNCTIONS: Dashboard Statistics
-- =====================================================

-- Function: Get total value moved (sum of all transactions)
CREATE OR REPLACE FUNCTION public.get_total_business_value()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.business_transactions;
$$;

-- Function: Get value moved by transaction type
CREATE OR REPLACE FUNCTION public.get_value_by_transaction_type()
RETURNS TABLE (
  transaction_type transaction_type,
  total_value numeric,
  transaction_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    bt.transaction_type,
    COALESCE(SUM(bt.amount), 0) as total_value,
    COUNT(*) as transaction_count
  FROM public.business_transactions bt
  GROUP BY bt.transaction_type
  ORDER BY total_value DESC;
$$;

-- Function: Get member business statistics
CREATE OR REPLACE FUNCTION public.get_member_business_stats(member_uuid uuid)
RETURNS TABLE (
  total_given numeric,
  total_received numeric,
  total_transactions bigint,
  referrals_given bigint,
  referrals_received bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN member_from_id = member_uuid THEN amount ELSE 0 END), 0) as total_given,
    COALESCE(SUM(CASE WHEN member_to_id = member_uuid THEN amount ELSE 0 END), 0) as total_received,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE transaction_type = 'referral' AND member_from_id = member_uuid) as referrals_given,
    COUNT(*) FILTER (WHERE transaction_type = 'referral' AND member_to_id = member_uuid) as referrals_received
  FROM public.business_transactions
  WHERE member_from_id = member_uuid OR member_to_id = member_uuid;
$$;

-- Function: Get monthly business evolution (last 12 months)
CREATE OR REPLACE FUNCTION public.get_monthly_business_evolution()
RETURNS TABLE (
  month date,
  total_value numeric,
  transaction_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    DATE_TRUNC('month', transaction_date)::date as month,
    COALESCE(SUM(amount), 0) as total_value,
    COUNT(*) as transaction_count
  FROM public.business_transactions
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', transaction_date)
  ORDER BY month DESC;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.business_transactions IS 'Stores business transactions between members (direct business, referrals, consortium-related)';
COMMENT ON COLUMN public.business_transactions.transaction_type IS 'Type: direct_business, referral, or consortium';
COMMENT ON COLUMN public.business_transactions.member_from_id IS 'Member who initiated/gave (always required)';
COMMENT ON COLUMN public.business_transactions.member_to_id IS 'Member who received (required for direct_business and referral, null for consortium)';
COMMENT ON COLUMN public.business_transactions.amount IS 'Transaction value in BRL (always positive)';
COMMENT ON COLUMN public.business_transactions.consortium_group_id IS 'Related consortium group (required for consortium type)';

COMMENT ON FUNCTION public.get_total_business_value() IS 'Returns total value moved across all transactions';
COMMENT ON FUNCTION public.get_value_by_transaction_type() IS 'Returns total value and count by transaction type';
COMMENT ON FUNCTION public.get_member_business_stats(uuid) IS 'Returns business statistics for a specific member';
COMMENT ON FUNCTION public.get_monthly_business_evolution() IS 'Returns monthly business evolution for the last 12 months';
