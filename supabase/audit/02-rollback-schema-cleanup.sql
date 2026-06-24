-- ============================================================
-- ROLLBACK: Desfaz a migration 20260624000001_cleanup_legacy_schema.sql
-- Use APENAS se algo der errado após aplicar a migration de schema.
-- ============================================================

-- Recriar função is_admin sem parâmetro (caso algum trigger dependa)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
  );
$$;

-- Nota: as tabelas members/consortium_groups eram vazias antes de dropar.
-- Se tinham dados, restaure via backup do Supabase Dashboard.

-- Para restaurar backup: Dashboard → Settings → Backups → Point-in-time restore
