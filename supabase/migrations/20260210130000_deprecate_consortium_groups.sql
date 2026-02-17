/*
  # Deprecate consortium_groups table

  ## Reason
  The `consortium_groups` table is a duplicate of `groups` with fewer fields.
  All application code uses the `groups` table.

  ## Action
  Mark as deprecated. Data preserved for safety. Can be dropped in a future migration.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consortium_groups') THEN
    COMMENT ON TABLE public.consortium_groups IS 'DEPRECATED: Use public.groups instead. This table is a legacy duplicate and will be removed in a future migration.';
  END IF;
END;
$$;
