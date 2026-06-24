---
epic_id: EPIC-2
title: Gestão de Membros Pendentes + Redesign Visual v2.0
status: Ready
created_at: 2026-06-24
created_by: Claude (sessão Confraria)
updated_at: 2026-06-24
version: 1.0

epic_scope: brownfield_improvement
complexity: high
estimated_effort: 2-3 semanas
team_size: 2 (dev, data-engineer)
priority: high
dependencies: []
---

# EPIC-2: Gestão de Membros Pendentes + Redesign Visual v2.0

## Contexto

O site da Confraria Pedra Branca (confrariapdrabranca.com.br) é um sistema Next.js 14 + Supabase com área de membros, gestão de consórcios e sorteios. Este epic cobre duas frentes simultâneas:

1. **Gestão de membros pendentes (URGENTE):** Fabio precisa ver, de dentro da plataforma, os membros que ainda não completaram o cadastro — com nome, grupo, e poder notificá-los via WhatsApp.

2. **Redesign visual completo (DESIGN.md v2.0):** Implementar o design system dark premium definido em `docs/DESIGN.md` — VideoHero, área do membro premium, tela de sorteio showcase.

## Requisitos

### Gestão de Membros (Stories 2.1–2.2)

- [x] Banco de dados auditado (`supabase/audit/01-audit-database-state.sql`)
- [ ] Schema legado limpo (migration 001 aplicada)
- [ ] Admin pode ver lista de membros pendentes com: nome, telefone, grupo, status de acesso
- [ ] Admin pode gerar mensagem WhatsApp personalizada por membro com credenciais
- [ ] Admin pode visualizar e editar dados dos 39 contatos diretamente na plataforma

### Redesign Visual (Stories 3.1–3.7)

- [ ] Design system v2.0 implementado: CSS vars, keyframes, Tailwind extensions
- [ ] Home pública com VideoHero (motion.mp4), counters, grid de empresas
- [ ] Login premium: dark, blob dourado, form focado
- [ ] Área do membro: sidebar reestilizada, GlassCard, DrawHistoryRow
- [ ] Tela de sorteio: fullscreen para TV, DrawMachine reestilizada, winner reveal dourado

## Ordem de Execução

```
[PREREQUISITO] Audit do banco (Fabio roda SQL)
      ↓
Story 2.2 — Limpeza do schema (migration 001)
      ↓
Story 2.1 — Gestão de membros pendentes
      ↓ (paralelo com 2.1 se possível)
Story 3.1 — Infraestrutura CSS
      ↓
Story 3.2 — Componentes base
      ↓
Story 3.3 — Home pública
      ↓
Story 3.4 — Login
      ↓
Story 3.5 — Shell interior
      ↓
Story 3.6 — Dashboard do membro
      ↓
Story 3.7 — Tela de sorteio showcase
```

## Referências

- Design system completo: `docs/DESIGN.md` (v2.0, 2026-06-24)
- Migrations: `supabase/migrations/20260624000001_*.sql` e `20260624000002_*.sql`
- Audit: `supabase/audit/01-audit-database-state.sql`
- Rollback: `supabase/audit/02-rollback-schema-cleanup.sql`
- Contatos importados: `confraria_contatos.numbers` (39 registros)
