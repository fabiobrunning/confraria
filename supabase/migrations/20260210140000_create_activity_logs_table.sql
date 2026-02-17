-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying by user
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Index for querying by entity
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Index for time-based queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- RLS: Only admins can read activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert (API routes use service role)
CREATE POLICY "Service role can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
