/*
  ## Security Hardening Migration

  Fixes identified during password system audit:

  1. is_admin() now checks deleted_at IS NULL (soft-deleted admins lose powers)
  2. Members can no longer see temporary_password_hash via RLS
  3. updated_at trigger for pre_registration_attempts
  4. NOT NULL defaults for access_attempts and max_access_attempts
*/

-- 1. Fix is_admin() to respect soft delete
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
  );
$$;

-- 2-4. Pre_registration_attempts fixes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pre_registration_attempts') THEN
    -- 2. Restrict member SELECT on pre_registration_attempts
    DROP POLICY IF EXISTS "Members can view own pre_registration_attempts"
      ON public.pre_registration_attempts;

    -- Recreate: members can only see their record AFTER first access
    -- Pre-access validation uses admin client (bypasses RLS)
    EXECUTE 'CREATE POLICY "Members can view own pre_registration_attempts (limited)"
      ON public.pre_registration_attempts
      FOR SELECT
      TO authenticated
      USING (
        member_id = auth.uid()
        AND first_accessed_at IS NOT NULL
      )';

    -- 3. Add updated_at trigger
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'set_updated_at_pre_registration_attempts'
    ) THEN
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $func$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $func$;

      CREATE TRIGGER set_updated_at_pre_registration_attempts
        BEFORE UPDATE ON public.pre_registration_attempts
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- 4. Set NOT NULL defaults for access control columns
    ALTER TABLE public.pre_registration_attempts
      ALTER COLUMN access_attempts SET DEFAULT 0;

    -- Set NOT NULL only if no existing NULLs
    UPDATE public.pre_registration_attempts
      SET access_attempts = 0 WHERE access_attempts IS NULL;
    ALTER TABLE public.pre_registration_attempts
      ALTER COLUMN access_attempts SET NOT NULL;

    ALTER TABLE public.pre_registration_attempts
      ALTER COLUMN max_access_attempts SET DEFAULT 5;
    UPDATE public.pre_registration_attempts
      SET max_access_attempts = 5 WHERE max_access_attempts IS NULL;
    ALTER TABLE public.pre_registration_attempts
      ALTER COLUMN max_access_attempts SET NOT NULL;
  END IF;
END;
$$;
