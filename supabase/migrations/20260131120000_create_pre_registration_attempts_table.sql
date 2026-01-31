/*
  # Create Pre-Registration Attempts Table

  ## Purpose
  - Centralized tracking of pre-registration credentials
  - Audits password generation and resend attempts
  - Tracks first access status for each pre-registration
  - Links to member profile (FK: profiles.id)

  ## Tables Created
  - pre_registration_attempts: Core tracking table

  ## RLS Policies
  - Admins can view all pre-registrations
  - Admins can create new attempts
  - Users can view their own attempt (after profile linked)
*/

-- Create pre_registration_attempts table
CREATE TABLE IF NOT EXISTS public.pre_registration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Credentials
  temporary_password_hash TEXT NOT NULL,
  password_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tracking
  send_method VARCHAR(20) NOT NULL CHECK (send_method IN ('whatsapp', 'sms')),
  send_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  -- First Access Status
  first_accessed_at TIMESTAMPTZ,
  first_access_from_ip INET,

  -- Attempts & Security
  access_attempts INTEGER DEFAULT 0,
  max_access_attempts INTEGER DEFAULT 5,
  locked_until TIMESTAMPTZ,

  -- Expiration
  expiration_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Metadata
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pre_registration_attempts_member_id
  ON public.pre_registration_attempts(member_id);

CREATE INDEX idx_pre_registration_attempts_created_by_admin_id
  ON public.pre_registration_attempts(created_by_admin_id);

CREATE INDEX idx_pre_registration_attempts_created_at
  ON public.pre_registration_attempts(created_at DESC);

CREATE INDEX idx_pre_registration_attempts_expiration
  ON public.pre_registration_attempts(expiration_date);

CREATE INDEX idx_pre_registration_attempts_first_accessed
  ON public.pre_registration_attempts(first_accessed_at);

-- Enable RLS
ALTER TABLE public.pre_registration_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all attempts
CREATE POLICY "Admins can view all pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policy: Admins can insert new attempts
CREATE POLICY "Admins can create pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    AND created_by_admin_id = auth.uid()
  );

-- RLS Policy: Admins can update attempts
CREATE POLICY "Admins can update pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policy: Members can view their own attempt
CREATE POLICY "Members can view own pre_registration_attempts"
  ON public.pre_registration_attempts
  FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid()
  );

-- Add comment for documentation
COMMENT ON TABLE public.pre_registration_attempts IS 'Tracks pre-registration attempts including password generation, resend history, and first access status';
COMMENT ON COLUMN public.pre_registration_attempts.temporary_password_hash IS 'Bcrypt hash of the temporary password - never store plain text';
COMMENT ON COLUMN public.pre_registration_attempts.password_generated_at IS 'When the temporary password was generated';
COMMENT ON COLUMN public.pre_registration_attempts.first_accessed_at IS 'When the user made their first login attempt';
COMMENT ON COLUMN public.pre_registration_attempts.expiration_date IS 'After this date, the pre-registration is considered expired and unusable';
