/*
  EPIC-1 Story 1.1: Event RSVP System - Database Foundation

  Creates:
  - events table (event management with soft delete)
  - event_confirmations table (RSVP tracking by phone)
  - RLS policies using public.is_admin() to avoid circular references
  - Indexes for performance

  Rollback: See bottom of file for DROP commands
*/

-- ============================================================
-- 1. EVENTS TABLE
-- ============================================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  confirmation_limit INTEGER NOT NULL CHECK (confirmation_limit > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_status_active ON public.events(status, date)
  WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_events_date ON public.events(date DESC);

-- Updated_at trigger
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. EVENT_CONFIRMATIONS TABLE
-- ============================================================

CREATE TABLE public.event_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  confirmed_count INTEGER NOT NULL CHECK (confirmed_count BETWEEN 1 AND 4),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_phone)
);

-- Indexes
CREATE INDEX idx_event_confirmations_event_id ON public.event_confirmations(event_id);
CREATE INDEX idx_event_confirmations_user_phone ON public.event_confirmations(user_phone);

-- Updated_at trigger
CREATE TRIGGER set_event_confirmations_updated_at
  BEFORE UPDATE ON public.event_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. RLS POLICIES — EVENTS
-- ============================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Admins see all events (including cancelled/deleted)
CREATE POLICY "Admins can manage all events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members see active, non-deleted events only
CREATE POLICY "Members can view active events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND deleted_at IS NULL
  );

-- ============================================================
-- 4. RLS POLICIES — EVENT_CONFIRMATIONS
-- ============================================================

ALTER TABLE public.event_confirmations ENABLE ROW LEVEL SECURITY;

-- Admins see all confirmations
CREATE POLICY "Admins can manage all confirmations"
  ON public.event_confirmations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members can view their own confirmations (by phone match)
CREATE POLICY "Members can view own confirmations"
  ON public.event_confirmations
  FOR SELECT
  TO authenticated
  USING (
    user_phone = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Members can insert their own confirmations
CREATE POLICY "Members can insert own confirmations"
  ON public.event_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_phone = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Members can update their own confirmations
CREATE POLICY "Members can update own confirmations"
  ON public.event_confirmations
  FOR UPDATE
  TO authenticated
  USING (
    user_phone = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_phone = (
      SELECT phone FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- ROLLBACK (run manually if needed)
-- ============================================================
/*
DROP TABLE IF EXISTS public.event_confirmations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
*/
