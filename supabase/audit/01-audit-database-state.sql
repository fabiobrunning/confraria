-- ============================================================
-- AUDITORIA DO BANCO — CONFRARIA PEDRA BRANCA
-- Execute no Supabase Studio > SQL Editor
-- SOMENTE LEITURA — nenhum dado será alterado
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. INVENTÁRIO DE TABELAS
-- ────────────────────────────────────────────────────────────
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS tamanho,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = tablename) AS colunas
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ────────────────────────────────────────────────────────────
-- 2. MEMBROS: real vs teste vs nunca logou
-- ────────────────────────────────────────────────────────────
SELECT
  role,
  pre_registered,
  deleted_at IS NOT NULL AS soft_deleted,
  COUNT(*) AS total
FROM profiles
GROUP BY role, pre_registered, (deleted_at IS NOT NULL)
ORDER BY role, pre_registered;

-- ────────────────────────────────────────────────────────────
-- 3. MEMBROS QUE NUNCA FIZERAM LOGIN
-- ────────────────────────────────────────────────────────────
SELECT
  p.full_name,
  p.phone,
  p.pre_registered,
  p.created_at,
  u.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.last_sign_in_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- ────────────────────────────────────────────────────────────
-- 4. GRUPOS E COTAS
-- ────────────────────────────────────────────────────────────
SELECT
  g.name,
  g.is_active,
  g.total_quotas,
  COUNT(q.id) AS cotas_criadas,
  SUM(CASE WHEN q.status = 'active' THEN 1 ELSE 0 END) AS ativas,
  SUM(CASE WHEN q.status = 'contemplated' THEN 1 ELSE 0 END) AS contempladas,
  SUM(CASE WHEN q.member_id IS NULL THEN 1 ELSE 0 END) AS sem_membro
FROM groups g
LEFT JOIN quotas q ON q.group_id = g.id
GROUP BY g.id, g.name, g.is_active, g.total_quotas
ORDER BY g.created_at;

-- ────────────────────────────────────────────────────────────
-- 5. SORTEIOS REGISTRADOS
-- ────────────────────────────────────────────────────────────
SELECT
  g.name AS grupo,
  d.winning_number,
  d.drawn_numbers,
  d.winner_position,
  d.draw_date,
  d.deleted_at IS NOT NULL AS soft_deleted,
  d.created_at
FROM draws d
JOIN groups g ON g.id = d.group_id
ORDER BY d.created_at DESC;

-- ────────────────────────────────────────────────────────────
-- 6. PRE-REGISTRATION ATTEMPTS — estado atual
-- ────────────────────────────────────────────────────────────
SELECT
  status,
  send_method,
  COUNT(*) AS total,
  MIN(created_at) AS mais_antigo,
  MAX(created_at) AS mais_recente
FROM pre_registration_attempts
GROUP BY status, send_method
ORDER BY total DESC;

-- ────────────────────────────────────────────────────────────
-- 7. LEADS vs PROSPECTS — o que tem em cada
-- ────────────────────────────────────────────────────────────
SELECT 'leads' AS tabela, COUNT(*) AS registros FROM leads
UNION ALL
SELECT 'prospects', COUNT(*) FROM prospects;

-- Colunas da leads:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;

-- Colunas da prospects:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'prospects'
ORDER BY ordinal_position;

-- ────────────────────────────────────────────────────────────
-- 8. TABELA MEMBERS (legacy) — tem dados?
-- ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS registros_em_members FROM members;

-- ────────────────────────────────────────────────────────────
-- 9. CONSORTIUM_GROUPS (deprecated) — tem dados?
-- ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS registros_em_consortium_groups
FROM consortium_groups;

-- ────────────────────────────────────────────────────────────
-- 10. FUNÇÕES is_admin DUPLICADAS
-- ────────────────────────────────────────────────────────────
SELECT
  routine_name,
  routine_type,
  specific_name,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_admin'
ORDER BY specific_name;

-- ────────────────────────────────────────────────────────────
-- 11. ACTIVITY LOGS — volume e distribuição
-- ────────────────────────────────────────────────────────────
SELECT
  action,
  entity_type,
  COUNT(*) AS total,
  MIN(created_at) AS mais_antigo,
  MAX(created_at) AS mais_recente
FROM activity_logs
GROUP BY action, entity_type
ORDER BY total DESC
LIMIT 20;

-- ────────────────────────────────────────────────────────────
-- 12. MEMBER_COMPANIES — consistência
-- ────────────────────────────────────────────────────────────
-- Membros com empresa mas sem perfil ativo:
SELECT COUNT(*) AS orfaos
FROM member_companies mc
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = mc.member_id AND p.deleted_at IS NULL
);

-- ────────────────────────────────────────────────────────────
-- FIM DA AUDITORIA
-- Cole os resultados e envie para @data-engineer analisar
-- ────────────────────────────────────────────────────────────
