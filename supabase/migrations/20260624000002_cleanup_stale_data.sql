-- ============================================================
-- MIGRATION: LIMPEZA DE DADOS OBSOLETOS
-- Data: 2026-06-24
-- Autor: @data-engineer (Dara)
-- Risco: ALTO — deleta dados. Revisar com Fabio antes de aplicar.
--
-- SEQUÊNCIA OBRIGATÓRIA:
--   1. Rodar 01-audit-database-state.sql e revisar resultados
--   2. Identificar membros/dados de teste (lista manual)
--   3. Confirmar com Fabio quais IDs deletar
--   4. Snapshot ANTES de aplicar
--   5. Aplicar esta migration
--
-- ESTA MIGRATION USA DRY_RUN=true POR PADRÃO
-- Para executar de verdade: SET LOCAL dara.dry_run = 'false';
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- CONFIGURAÇÃO: DRY RUN (padrão SEGURO)
-- Mude para 'false' apenas quando quiser executar de verdade
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM set_config('dara.dry_run', 'true', true);
  RAISE NOTICE '=== MODO: DRY RUN (nenhum dado será deletado) ===';
  RAISE NOTICE 'Para executar: altere dry_run para false na linha acima.';
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 1: PRE-REGISTRATION ATTEMPTS OBSOLETOS
-- Deleta tentativas com status 'failed' com mais de 90 dias
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  dry_run BOOLEAN := current_setting('dara.dry_run', true) != 'false';
  affected INTEGER;
BEGIN
  -- Contar primeiro
  SELECT COUNT(*) INTO affected
  FROM pre_registration_attempts
  WHERE status = 'failed'
    AND created_at < NOW() - INTERVAL '90 days';

  RAISE NOTICE '[pre_registration_attempts] % registros failed > 90 dias encontrados.', affected;

  IF NOT dry_run THEN
    DELETE FROM pre_registration_attempts
    WHERE status = 'failed'
      AND created_at < NOW() - INTERVAL '90 days';
    RAISE NOTICE '[pre_registration_attempts] % registros deletados.', affected;
  ELSE
    RAISE NOTICE '[DRY RUN] Seriam deletados: % registros.', affected;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 2: ACTIVITY LOGS MUITO ANTIGOS (> 1 ANO)
-- Manter logs de ações críticas (member.create, draw.execute)
-- Deletar apenas logs de leitura/navegação antigos
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  dry_run BOOLEAN := current_setting('dara.dry_run', true) != 'false';
  affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected
  FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '365 days'
    AND action NOT IN ('member.create', 'draw.execute', 'quota.contemplate', 'member.delete');

  RAISE NOTICE '[activity_logs] % logs não-críticos com > 1 ano encontrados.', affected;

  IF NOT dry_run THEN
    DELETE FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '365 days'
      AND action NOT IN ('member.create', 'draw.execute', 'quota.contemplate', 'member.delete');
    RAISE NOTICE '[activity_logs] % registros deletados.', affected;
  ELSE
    RAISE NOTICE '[DRY RUN] Seriam deletados: % registros.', affected;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 3: MEMBROS DE TESTE — LISTA MANUAL
-- INSTRUÇÃO: adicione os IDs de membros de teste aqui
-- Como identificar: nomes como "Teste", "Admin", telefone fictício
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  dry_run BOOLEAN := current_setting('dara.dry_run', true) != 'false';
  test_ids UUID[];
  affected INTEGER;
BEGIN
  -- ========================================================
  -- PREENCHA AQUI após rodar a auditoria e identificar IDs:
  -- Exemplo:
  -- test_ids := ARRAY[
  --   'uuid-do-membro-teste-1'::UUID,
  --   'uuid-do-membro-teste-2'::UUID
  -- ];
  -- ========================================================
  test_ids := ARRAY[]::UUID[];  -- vazio por padrão

  IF array_length(test_ids, 1) IS NULL THEN
    RAISE NOTICE '[profiles] Nenhum ID de teste definido. Pule esta seção ou preencha test_ids.';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO affected
  FROM profiles
  WHERE id = ANY(test_ids);

  RAISE NOTICE '[profiles] % membros de teste encontrados.', affected;

  IF NOT dry_run THEN
    -- Soft delete (preserva histórico)
    UPDATE profiles
    SET deleted_at = NOW()
    WHERE id = ANY(test_ids)
      AND deleted_at IS NULL;
    RAISE NOTICE '[profiles] % membros marcados como deletados (soft delete).', affected;
  ELSE
    RAISE NOTICE '[DRY RUN] Seriam soft-deletados: % membros.', affected;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 4: DRAWS DE TESTE
-- Sorteios com winning_number = 0 ou drawn_numbers vazio
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  dry_run BOOLEAN := current_setting('dara.dry_run', true) != 'false';
  affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected
  FROM draws
  WHERE winning_number = 0
     OR drawn_numbers = '[]'::jsonb
     OR jsonb_array_length(drawn_numbers) = 0;

  RAISE NOTICE '[draws] % sorteios inválidos (winning_number=0 ou sem números) encontrados.', affected;

  IF NOT dry_run THEN
    DELETE FROM draws
    WHERE winning_number = 0
       OR drawn_numbers = '[]'::jsonb
       OR jsonb_array_length(drawn_numbers) = 0;
    RAISE NOTICE '[draws] % sorteios inválidos deletados.', affected;
  ELSE
    RAISE NOTICE '[DRY RUN] Seriam deletados: % sorteios.', affected;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SEÇÃO 5: COTAS ÓRFÃS SEM GRUPO VÁLIDO
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  dry_run BOOLEAN := current_setting('dara.dry_run', true) != 'false';
  affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected
  FROM quotas q
  WHERE NOT EXISTS (
    SELECT 1 FROM groups g WHERE g.id = q.group_id
  );

  RAISE NOTICE '[quotas] % cotas órfãs sem grupo encontradas.', affected;

  IF NOT dry_run THEN
    DELETE FROM quotas
    WHERE NOT EXISTS (
      SELECT 1 FROM groups g WHERE g.id = group_id
    );
    RAISE NOTICE '[quotas] % cotas órfãs deletadas.', affected;
  ELSE
    RAISE NOTICE '[DRY RUN] Seriam deletadas: % cotas órfãs.', affected;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- RELATÓRIO FINAL
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '=== FIM DA MIGRATION DE LIMPEZA ===';
  RAISE NOTICE 'Modo: %', CASE WHEN current_setting('dara.dry_run', true) != 'false' THEN 'DRY RUN (nenhum dado foi alterado)' ELSE 'EXECUTADO' END;
END;
$$;

COMMIT;
