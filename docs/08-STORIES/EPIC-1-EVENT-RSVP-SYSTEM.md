---
epic_id: EPIC-1
title: Event RSVP System - Confirmação Digital de Presença em Eventos
status: Ready
created_at: 2026-02-17
created_by: Morgan (@pm)
updated_at: 2026-02-17
version: 1.0

# Metadata
epic_scope: brownfield_isolated
complexity: medium
estimated_effort: 3-4 weeks
team_size: 3-4 (dev, data-engineer, ux)
priority: high
dependencies: []
---

# EPIC-1: Event RSVP System

**Confirmação Digital de Presença em Eventos**

---

## Epic Summary

Substituir confirmação de presença via WhatsApp por um sistema digital que automatiza contagem de participantes, reduz caos de mensagens e fornece ao admin uma visão clara e atualizada em tempo real.

**Problem Statement:**
Confirmação de presença em eventos atualmente é feita pelo WhatsApp, gerando 60+ mensagens por evento, muito caos e difícil de acompanhar. Demanda muito grande no grupo.

**Solution:**
Sistema RSVP digital com link compartilhável onde:
- Pessoa valida pelo WhatsApp (usa número já cadastrado)
- Escolhe quantas pessoas vão (+1/+2/+3/+4)
- Sistema soma automaticamente
- Admin vê total atualizado em tempo real

---

## Epic Goal

Entregar um sistema de confirmação de presença em eventos que:
1. Reduz demanda no WhatsApp (zero mensagens de confirmação)
2. Automatiza contagem de participantes
3. Fornece admin dashboard em tempo real
4. Identifica participantes via WhatsApp já cadastrado
5. Permite múltiplos confirmadores e contagem acumulativa

---

## Epic Description

### Existing System Context

**Current Functionality:**
- Sistema Confraria já tem cadastro de telefone/WhatsApp (em grupos e cotas)
- Confirmação é manual via WhatsApp (caos, muito volume)
- Nenhuma integração com dashboard/membros existente

**Technology Stack:**
- Next.js 14 (App Router), TypeScript, Supabase, shadcn/ui, Tailwind, React Query

**Integration Points:**
- Usar número de WhatsApp já cadastrado em `profiles.phone`
- Validação: número deve estar em perfil ativo
- Nenhuma alteração em tabelas existentes

### Enhancement Details

**What's Being Added:**
1. Sistema RSVP com evento + confirmações
2. Página pública de validação e confirmação
3. Admin dashboard para gerenciar eventos
4. Contagem cumulativa de participantes

**How It Integrates:**
- Isolado do sistema existente (tabelas novas, API nova, página nova)
- Zero impacto em dados existentes (members, companies, groups)
- RLS: cada pessoa vê só seus dados, admin vê tudo

**Success Criteria:**
- ✅ Admin consegue criar evento com limite e deadline
- ✅ Pessoa recebe link, valida WhatsApp, confirma com +1/+2/+3/+4
- ✅ Total atualizado em tempo real
- ✅ Histórico armazenado para auditoria
- ✅ Link compartilhável que abre página pública

---

## Stories (4 Stories)

### Story 1: Database Schema & RLS Policies

**ID:** EPIC-1-STORY-1
**Executor:** `@data-engineer` (Dara)
**Quality Gate:** `@dev` (Dex)
**Quality Gate Tools:** `[schema_validation, rls_test, migration_review]`

**Description:**
Criar tabelas `events` e `event_confirmations` com todas as colunas necessárias, índices, e RLS policies.

**Acceptance Criteria:**
- [ ] Tabela `events` criada com campos: id, name, description, date, time, deadline, confirmation_limit, status, created_by, created_at, updated_at, deleted_at
- [ ] Tabela `event_confirmations` criada com campos: id, event_id, user_phone, confirmed_count, confirmed_at, created_at, updated_at
- [ ] Índice UNIQUE em (event_id, user_phone)
- [ ] RLS policies: only admin can see all, users can't see others
- [ ] Soft delete pattern (deleted_at) implemented
- [ ] Migration executes without errors
- [ ] All RLS policies tested successfully

**Pre-Commit Quality Gate:**
- ✅ Schema validation (all required fields present)
- ✅ RLS policies tested (only admin sees data)
- ✅ Unique constraints verified
- ✅ Soft delete pattern implemented
- ✅ Indexes created for performance

---

### Story 2: Event Management APIs

**ID:** EPIC-1-STORY-2
**Executor:** `@dev` (Dex)
**Quality Gate:** `@architect` (Aria)
**Quality Gate Tools:** `[api_contract_validation, security_scan, backward_compatibility]`

**Description:**
Criar endpoints REST para gerenciar eventos e confirmações.

**Endpoints to Implement:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/events` | Criar novo evento | Admin only |
| GET | `/api/events` | Listar todos eventos | Admin only |
| GET | `/api/events/{id}` | Buscar evento (info + confirmações) | Public (info), Admin (all) |
| PUT | `/api/events/{id}` | Editar evento | Admin only |
| DELETE | `/api/events/{id}` | Cancelar evento | Admin only |
| POST | `/api/events/{id}/confirm` | Confirmar presença | Public + WhatsApp validation |
| GET | `/api/events/{id}/confirmations` | Ver lista de confirmações | Admin only |
| GET | `/api/events/{id}/export` | Exportar confirmados (CSV) | Admin only |

**Acceptance Criteria:**
- [ ] All 8 endpoints implemented and tested
- [ ] WhatsApp validation on `/confirm` endpoint
- [ ] Rate limiting: max 10 confirms per IP per minute
- [ ] Unique constraint enforcement (can't confirm twice)
- [ ] Deadline validation (no confirms after deadline)
- [ ] All endpoints return proper HTTP status codes (200, 400, 403, 404, 429)
- [ ] Activity logging for all operations
- [ ] Input validation with Zod
- [ ] No hardcoded secrets in code
- [ ] Tests cover success and error paths

**Pre-Commit Quality Gate:**
- ✅ Security scan (no injection, no hardcoded secrets)
- ✅ Error handling (all scenarios covered)
- ✅ Backward compatibility (no existing APIs altered)
- ✅ API contract documentation
- ✅ Rate limiting verified

---

### Story 3: Public RSVP Page

**ID:** EPIC-1-STORY-3
**Executor:** `@ux-design-expert` (Uma) or `@dev` (Dex)
**Quality Gate:** `@dev` (Dex)
**Quality Gate Tools:** `[component_accessibility, ux_validation, responsive_test]`

**Description:**
Criar página pública `/rsvp/{eventId}` onde pessoas confirmam presença.

**Page Structure:**

**Section 1: Event Info (Read-only)**
- Nome do evento
- Data / Horário
- Descrição
- Deadline para confirmar
- Total de confirmações (contador ao vivo)

**Section 2: WhatsApp Validation**
- Input: "Digite seu número de WhatsApp"
- Format: (00) 00000-0000
- Botão: "Validar"
- Feedback: "✅ Número reconhecido! Olá, [Nome]"

**Section 3: Confirmation (após validar)**
- Texto: "Quantas pessoas vão?"
- Botões: +1, +2, +3, +4
- Botão: "Confirmar"
- Feedback: "✅ Você confirmou para X pessoas!"
- Live counter: "Total de confirmações: 45/50"

**Section 4: Already Confirmed**
- Se já confirmou: "Você já confirmou para X pessoas em [data/hora]"
- Opção: "Alterar confirmação"

**Acceptance Criteria:**
- [ ] Page responsive (mobile-first design)
- [ ] WhatsApp input with formatting
- [ ] Real-time counter updates (or refresh button)
- [ ] Form validation (number must exist in system)
- [ ] Error messages clear and helpful
- [ ] Loading states during validation
- [ ] Confirmation animation/feedback
- [ ] Already-confirmed state handled
- [ ] Accessibility: WCAG AA compliance
- [ ] No login required (public page)

**Pre-Commit Quality Gate:**
- ✅ Mobile responsiveness tested
- ✅ Accessibility scan (buttons, labels, contrast)
- ✅ Performance (< 2s load time)
- ✅ Error handling (network, invalid number, etc.)
- ✅ Cross-browser testing (Chrome, Firefox, Safari)

---

### Story 4: Admin Dashboard

**ID:** EPIC-1-STORY-4
**Executor:** `@dev` (Dex)
**Quality Gate:** `@architect` (Aria)
**Quality Gate Tools:** `[ui_patterns, integration_consistency, performance_validation]`

**Description:**
Criar dashboard admin para gerenciar eventos completo.

**Page 4a: Event List** (`/admin/events`)
- Tabela: Evento | Data | Deadline | Status | Confirmações | Ações
- Botão: "+ Novo Evento"
- Ações por linha: "Ver detalhes" | "Editar" | "Cancelar"
- Filtros: Status (ativo/cancelado), date range
- Busca: por nome do evento
- Paginação se > 20 eventos

**Page 4b: Create/Edit Event**
- Form campos:
  - Nome do evento (required)
  - Descrição (required)
  - Data (required, date picker)
  - Horário (required, time picker)
  - Deadline para confirmar (required)
  - Limite de confirmações (required, número)
- Validação: deadline >= data do evento
- Botão: "Criar" / "Salvar"

**Page 4c: Event Details**
- Info do evento (read-only ou editável)
- Tabela confirmações:
  - Nome | Número WhatsApp | Contagem | Data Confirmação
  - Botão: "Deletar" (soft delete)
- Botão: "Copiar link RSVP" (copy to clipboard)
- Botão: "Compartilhar no WhatsApp" (pre-filled message)
- Botão: "Exportar confirmações" (CSV download)
- Contador: "45 / 50 confirmações"
- Gráfico: Timeline confirmações (tempo vs total acumulado)

**Acceptance Criteria:**
- [ ] All 3 pages (list, create/edit, details) implemented
- [ ] Admin auth check (only role=admin can access)
- [ ] Real-time updates on confirmations table
- [ ] Copy-to-clipboard functionality works
- [ ] WhatsApp share link pre-fills message
- [ ] CSV export includes: Name, WhatsApp, Count, Timestamp
- [ ] Chart renders correctly
- [ ] Pagination works if > 20 events
- [ ] Edit form validates deadline >= date
- [ ] Soft delete on confirmation removal
- [ ] Integration with existing Confraria UI (header, sidebar, layout)
- [ ] Follows shadcn/ui + Tailwind patterns

**Pre-Commit Quality Gate:**
- ✅ Admin auth validated
- ✅ Real-time updates work (or refresh mechanism)
- ✅ Performance (table with 1000 rows doesn't freeze)
- ✅ UI consistency (matches existing Confraria design)
- ✅ CSV export tested (valid format)
- ✅ Error handling (network, permissions)

---

## Compatibility & Risk

### Compatibility Requirements

✅ **Existing APIs remain unchanged**
- No modifications to `/api/members/*`, `/api/companies/*`, `/api/groups/*`, etc.

✅ **Database schema changes are backward compatible**
- Only new tables created (`events`, `event_confirmations`)
- No alterations to existing tables

✅ **UI changes follow existing patterns**
- New page uses same layout, components, styling as Confraria
- Existing sidebar/navigation unaffected

✅ **Performance impact is minimal**
- RSVP page: < 2s load
- Admin dashboard: < 2s with 500+ confirmations
- No impact on existing pages

### Risk Mitigation

**Primary Risk:** User enters WhatsApp number not in system, causes confusion
- **Mitigation:** Clear error message "Número não encontrado. Verifique se está cadastrado."
- **Rollback:** Disable link, show friendly message

**Risk:** Rate limiting prevents legitimate confirms
- **Mitigation:** Rate limit is 10/min per IP (very generous)
- **Rollback:** Increase or remove limit in code

**Risk:** Admin enters deadline in past
- **Mitigation:** Validation prevents (deadline >= date)
- **Rollback:** Edit event to set new deadline

**Quality Assurance Strategy:**
- CodeRabbit validation on all new code
- @data-engineer reviews schema + RLS
- @architect reviews API design + integration
- All stories tested end-to-end
- No regression in existing features

---

## Definition of Done

Epic is **COMPLETE** when:

**Story 1 Done:**
- [ ] Tables created, RLS policies tested, migrations ran successfully
- [ ] Data validated: unique constraints work, soft delete pattern verified

**Story 2 Done:**
- [ ] All 8 endpoints working, tested with Postman/Insomnia
- [ ] Security scan passed (no vulns)
- [ ] Rate limiting verified
- [ ] Activity logging confirmed
- [ ] Tests: 100% coverage of happy path + error cases

**Story 3 Done:**
- [ ] Page accessible at `/rsvp/{eventId}`
- [ ] Mobile responsive (tested on iPhone/Android)
- [ ] WhatsApp validation works
- [ ] Real-time counter updates (or refresh)
- [ ] Accessibility audit passed (WCAG AA)

**Story 4 Done:**
- [ ] Admin dashboard at `/admin/events` fully functional
- [ ] Create/Edit/Delete events works
- [ ] View confirmations + export CSV works
- [ ] Real-time updates (or refresh mechanism)
- [ ] UI integrated with Confraria design

**Integration Done:**
- [ ] Admin creates event → gets link → shares on WhatsApp
- [ ] User clicks link → validates WhatsApp → confirms with +1/+2/+3/+4
- [ ] Admin sees total updated on dashboard (live or refresh)
- [ ] Export CSV: name, WhatsApp, count (all correct)

**Testing Done:**
- [ ] E2E test: full flow (admin create → user confirm → admin sees)
- [ ] No regressions: existing pages still work
- [ ] Performance: dashboard with 1000+ confirms doesn't lag
- [ ] Edge cases: invalid number, deadline passed, event cancelled

**Documentation Done:**
- [ ] README updated with instructions
- [ ] API docs updated
- [ ] Admin guide for creating events

---

## File List

### Created Files

**Database:**
- `supabase/migrations/{timestamp}_create_events_tables.sql` — tables + RLS

**API Routes:**
- `app/api/events/route.ts` — POST (create), GET (list) → admin only
- `app/api/events/[id]/route.ts` — GET (details), PUT (edit), DELETE (cancel) → admin only
- `app/api/events/[id]/confirm/route.ts` — POST (confirm) → public
- `app/api/events/[id]/confirmations/route.ts` — GET (list) → admin only
- `app/api/events/[id]/export/route.ts` — GET (CSV) → admin only

**Pages:**
- `app/(protected)/admin/events/page.tsx` — event list (admin)
- `app/(protected)/admin/events/new/page.tsx` — create event (admin)
- `app/(protected)/admin/events/[id]/page.tsx` — event details (admin)
- `app/(protected)/rsvp/[eventId]/page.tsx` — public RSVP page

**Components:**
- `components/events/EventCard.tsx` — reusable event card
- `components/events/EventForm.tsx` — create/edit form
- `components/events/ConfirmationTable.tsx` — confirmations table
- `components/events/RSVPForm.tsx` — public confirmation form
- `components/events/EventChart.tsx` — timeline chart

**Utilities:**
- `lib/schemas/event.ts` — Zod schemas
- `lib/api/events.ts` — client-side API calls

**Tests:**
- `e2e/events.spec.ts` — E2E tests (create → confirm → export)

### Modified Files

None. This epic is completely isolated.

### Deprecated Files

None.

---

## Change Log

| Date | Author | Change | Story | Status |
|------|--------|--------|-------|--------|
| 2026-02-17 | Morgan (@pm) | Epic created | — | Ready |
| — | — | Story 1: Database | EPIC-1-STORY-1 | Pending |
| — | — | Story 2: APIs | EPIC-1-STORY-2 | Pending |
| — | — | Story 3: RSVP Page | EPIC-1-STORY-3 | Pending |
| — | — | Story 4: Admin Dashboard | EPIC-1-STORY-4 | Pending |

---

## Next Steps

### Handoff to @sm (Story Manager)

This epic is ready for story creation. **@sm** will:

1. Create 4 detailed user stories from EPIC-1-STORY-1 through EPIC-1-STORY-4
2. Break down each story into granular acceptance criteria
3. Assign story IDs
4. Set up story files in `docs/08-STORIES/`
5. Coordinate story sequencing with @dev

### Execution Timeline

**Estimated Effort:** 3-4 weeks (with 3-4 person-weeks)

**Suggested Sequencing:**
1. **Week 1:** Story 1 (Database) + Story 2 (APIs) in parallel
2. **Week 2:** Story 3 (RSVP Page) + Story 4 (Admin Dashboard) in parallel
3. **Week 3-4:** Testing, integration, refinements

---

## Approval & Sign-Off

**Created By:** Morgan (@pm) — 2026-02-17
**Status:** Ready for Story Creation
**Approval Needed From:** @po (story validation) before dev starts

---

*Epic created via Pre-Flight Planning (PM Mode)*
