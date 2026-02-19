# Confraria Pedra Branca — PRD de Melhoria Brownfield

**Versão:** 1.0
**Data:** 2026-02-17
**Autor:** Morgan (@pm)
**Status:** Rascunho

---

## 1. Análise Introdutória do Projeto e Contexto

### 1.1 Fonte da Análise

- Análise direta do projeto carregado via IDE
- Documentação existente: `docs/03-ARCHITECTURE/brownfield-architecture.md`, `docs/DESIGN-REFACTOR-PLAN.md`

### 1.2 Estado Atual do Projeto

O **Confraria Pedra Branca** é um sistema de gestão de consórcio e networking para um clube de membros. Construído com Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), shadcn/ui, Tailwind CSS, TanStack React Query e validação com Zod.

Estrutura atual das áreas afetadas:

| Área | Route | Acesso | Padrão de UI |
|------|-------|--------|--------------|
| Membros | `/members` | Todos (CRUD admin) | Cards em lista linear com busca |
| Pré-Cadastros | `/admin/pre-registrations` | Somente admin | Tabela paginada |
| Empresas (admin) | `/admin/companies` | Somente admin | Cards em grid + modals |
| Empresas (membro) | `/companies` | Todos | Cards em grid (somente leitura) |
| Grupos | `/groups` | Todos (CRUD admin) | Cards em grid com busca |

### 1.3 Documentação Disponível

- [x] Documentação do Tech Stack
- [x] Árvore de código / Arquitetura (`brownfield-architecture.md`)
- [ ] Padrões de Código (Coding Standards)
- [x] Documentação de API (inline em `CLAUDE.md`)
- [ ] Documentação de APIs externas
- [ ] Diretrizes de UX/UI
- [ ] Documentação de Débito Técnico

### 1.4 Definição do Escopo da Melhoria

**Tipo de Melhoria:**
- [x] Modificação de Feature Principal
- [x] Revisão de UI/UX (UX Overhaul)

**Descrição da Melhoria:**
Unificar a gestão de pré-cadastros na área de Membros, mantendo um badge/tag visual "Pré-Cadastro" para diferenciar o status. Simultaneamente, padronizar a UX de visualização de Membros, Empresas e Grupos para entregar uma experiência consistente.

**Avaliação de Impacto:**
- [x] Impacto Moderado (algumas alterações no código existente)

Áreas afetadas:
- `app/(protected)/members/page.tsx` — absorve a funcionalidade de pré-cadastros
- `app/(protected)/admin/pre-registrations/` — depreciado/redirecionado
- `app/(protected)/companies/` e `app/(protected)/admin/companies/` — refatoração de UX
- `app/(protected)/groups/` — refatoração de UX
- `components/Sidebar.tsx` — remoção do item "Pré-Cadastro"
- Rotas de API — backend sem alterações

### 1.5 Objetivos

- Eliminar a navegação fragmentada unificando os pré-cadastros na tela de Membros
- Manter identificação clara via badge/tag "Pré-Cadastro"
- Padronizar a UX de listagem para Membros, Empresas e Grupos
- Reduzir os itens do sidebar admin (de 7 para 6)
- Melhorar a experiência do admin para o ciclo de vida completo do associado

### 1.6 Contexto de Negócio

Atualmente, o admin precisa alternar entre a tela de Membros e a tela de Pré-Cadastros para gerenciar o ciclo de vida de um associado. Isso fragmenta o fluxo de trabalho e cria fricção desnecessária. Ao unificar essas views com filtros e badges, o admin terá uma visão completa de todos os associados (ativos e pendentes) em um único lugar.

A padronização de UX nas três áreas principais (Membros, Empresas, Grupos) trará consistência visual e reduzirá a curva de aprendizado do sistema.

### 1.7 Histórico de Mudanças

| Mudança | Data | Versão | Descrição | Autor |
|---------|------|--------|-----------|-------|
| Rascunho inicial | 2026-02-17 | 1.0 | PRD criado via fluxo interativo | Morgan (@pm) |

---

## 2. Requisitos

### 2.1 Requisitos Funcionais

- **FR1:** A tela de Membros (`/members`) exibirá membros ativos e pré-cadastros em uma lista unificada, diferenciados por badge de status ("Ativo", "Pré-Cadastro")
- **FR2:** O admin poderá filtrar a lista de membros por status: Todos, Ativos, Pré-Cadastro
- **FR3:** As ações de pré-cadastro (gerar senha, reenviar credenciais, copiar senha) estarão disponíveis inline na lista de membros para itens com status "Pré-Cadastro"
- **FR4:** O botão "+ Novo Pré-Cadastro" estará disponível na tela de Membros (somente admin), substituindo ou complementando o atual "Novo Membro"
- **FR5:** O item "Pré-Cadastro" será removido do sidebar, simplificando a navegação do admin
- **FR6:** A exibição de Membros, Empresas e Grupos seguirá um padrão visual unificado (mesmo layout de card, mesmo estilo de barra de busca, mesma estrutura de filtros)
- **FR7:** A tela de Empresas (admin) e a tela de Empresas (membro) serão unificadas em uma única route com permissões condicionais
- **FR8:** Cada card de membro, empresa e grupo exibirá informações-chave de forma consistente (nome, badge de status, dados secundários, ações)

### 2.2 Requisitos Não Funcionais

- **NFR1:** A performance da tela unificada de Membros não deve degradar com a adição dos pré-cadastros (tempo de carregamento < 2s para até 500 registros)
- **NFR2:** As APIs existentes de pré-cadastro (`/api/admin/pre-registrations/*`) serão mantidas sem alterações — as modificações são exclusivamente no frontend
- **NFR3:** O design responsivo deve funcionar de forma consistente em mobile e desktop nas 3 áreas (Membros, Empresas, Grupos)
- **NFR4:** Manter os padrões de acessibilidade existentes (badges semânticos, contraste adequado)

### 2.3 Requisitos de Compatibilidade

- **CR1: Compatibilidade de API** — Todas as API routes existentes (`/api/members`, `/api/admin/pre-registrations`, `/api/companies`, `/api/draws`) permanecem sem alterações
- **CR2: Compatibilidade de Banco de Dados** — Zero alterações de schema. Tabelas `profiles`, `pre_registration_attempts`, `companies`, `groups` intocadas
- **CR3: Consistência de UI/UX** — Novos componentes seguem o design system existente (shadcn/ui, Tailwind, variantes de badge já existentes)
- **CR4: Compatibilidade de Auth/RLS** — Regras de RLS e verificações de role (admin/member) mantidas. Membros continuam sem acesso aos dados de pré-cadastro

---

## 3. Objetivos de Melhoria da Interface do Usuário

### 3.1 Integração com a UI Existente

O projeto utiliza um design system consolidado baseado em **shadcn/ui + Tailwind CSS** com componentes de layout padronizados:

| Componente Existente | Reuso |
|----------------------|-------|
| `PageContainer` | Wrapper para as 3 áreas — já utilizado |
| `PageHeader` | Cabeçalho com título + ação — já utilizado |
| `EmptyState` | Estado sem dados — já utilizado |
| `Badge` (variants: `default`, `warning`, `success`) | Status de membros e pré-cadastros — já existe |
| `SearchBar` | Busca/filtro — já utilizado em Membros e Grupos |
| `Card` (shadcn) | Cards em Empresas e Grupos — já utilizado |
| `Dialog` / `AlertDialog` | Modais de ação — já utilizados |

**Novos componentes necessários:**
- `MemberStatusFilter` — Filtro de status (segmented control ou dropdown)
- Possível `UnifiedCard` ou refatoração do padrão de card para consistência entre áreas

### 3.2 Telas e Views Modificadas/Novas

| Tela | Tipo | Mudança |
|------|------|---------|
| Membros (`/members`) | Modificada | Absorve pré-cadastros, adiciona filtro de status, ações contextuais por tipo |
| Empresas (`/companies` + `/admin/companies`) | Modificada | Unificação de route, UX padronizada com o mesmo padrão de card |
| Grupos (`/groups`) | Modificada | Alinhamento visual ao padrão unificado |
| Pré-Cadastros (`/admin/pre-registrations`) | Depreciada | Redirect para `/members?status=pre-cadastro` ou removida |
| Sidebar (`components/Sidebar.tsx`) | Modificada | Remoção do item "Pré-Cadastro" |

### 3.3 Requisitos de Consistência de UI

Padrão visual unificado para as 3 áreas:

```
+---------------------------------------------+
|  PageHeader: Título + Descrição + [Ação]     |
+---------------------------------------------+
|  SearchBar + StatusFilter (quando aplicável) |
+---------------------------------------------+
|  +--------+  +--------+  +--------+         |
|  | Card   |  | Card   |  | Card   |         |
|  | -Badge |  | -Badge |  | -Badge |         |
|  | -Info  |  | -Info  |  | -Info  |         |
|  | -Ações |  | -Ações |  | -Ações |         |
|  +--------+  +--------+  +--------+         |
|                                              |
|  Paginação (quando necessário)               |
+---------------------------------------------+
```

| Elemento | Padrão |
|----------|--------|
| Layout | Grid responsivo: 1 col (mobile) > 2 cols (md) > 3 cols (lg) |
| Estrutura do card | Nome/título + badge de status + 2-3 dados secundários + ações |
| Badges | `success` = ativo, `warning` = pré-cadastro/pendente, `default` = padrão |
| Busca | `SearchBar` com placeholder contextual por área |
| Ações admin | Botões dentro do card (não dropdown menu) — consistente com o padrão atual |
| Estado vazio | `EmptyState` com ícone + mensagem + CTA |
| Hover | `hover:shadow-lg` + `transition` — já utilizado em Empresas e Grupos |

---

## 4. Restrições Técnicas e Requisitos de Integração

### 4.1 Tech Stack Existente

| Camada | Tecnologia | Versão/Detalhe |
|--------|-----------|----------------|
| Framework | Next.js 14 (App Router) | React 18, Server + Client Components |
| Linguagem | TypeScript | Modo strict |
| Banco de Dados | Supabase (PostgreSQL) | RLS em toda a aplicação |
| Biblioteca de UI | shadcn/ui | 50+ primitivas, baseColor: slate |
| Estilização | Tailwind CSS 3 | Dark mode (estratégia por classe), tailwindcss-animate |
| Data Fetching | TanStack React Query | staleTime: 60s, retry: 1 |
| Validação | Zod | Schemas centralizados em `lib/schemas.ts` |
| Auth | Supabase Auth + SSR | JWT via middleware, roles em `profiles.role` |

### 4.2 Abordagem de Integração

**Estratégia de Integração com Banco de Dados:** Sem alterações. As queries existentes retornam todos os dados necessários. A tela de Membros consumirá adicionalmente `/api/admin/pre-registrations` para usuários admin.

**Estratégia de Integração de API:** APIs existentes mantidas intactas (CR1). Nenhuma nova API route é necessária — duas requisições paralelas da página unificada de Membros são aceitáveis para o volume atual (< 200 membros).

**Estratégia de Integração de Frontend:**
- Componentes de pré-cadastro (`PreRegistrationModal`, `PreRegistrationStatusBadge`) importados de `@/components/pre-registrations/`
- Hooks existentes (`usePreRegistrations`, `useCreatePreRegistration`, etc.) reutilizados diretamente
- Filtro de status adicionado ao lado do `SearchBar` existente

**Estratégia de Integração de Testes:** Testes E2E existentes em `e2e/` adaptados para as novas routes. Testes de API permanecem sem alterações.

### 4.3 Organização de Código e Padrões

```
app/(protected)/members/
  page.tsx                     # Server component (busca de dados)
  MembersPageClient.tsx        # Client component unificado
  components/
    MemberCard.tsx             # Card padrão de membro
    MemberStatusFilter.tsx     # Filtro: Todos | Ativos | Pré-Cadastro
    PreRegActions.tsx          # Ações de pré-cadastro (gerar senha, reenviar)
    MemberFormModal.tsx        # Modal de edição (existente, refatorado)

app/(protected)/companies/
  page.tsx                     # Unificado (admin+membro)
  CompaniesPageClient.tsx      # Client com permissões condicionais

app/(protected)/groups/
  page.tsx                     # Mantido (alinhamento visual)
  GroupsPageClient.tsx         # Refatorado para o padrão de card
```

### 4.4 Deploy e Operações

- **Processo de Build:** Sem alterações. `npm run build` continua funcionando.
- **Estratégia de Deploy:** Deploy padrão. Alterações somente no frontend, sem migração de banco de dados.
- **Monitoramento:** Logs de atividade existentes (`lib/activity-log.ts`) permanecem sem alterações.
- **Configuração:** Sem novas variáveis de ambiente. Sem configurações adicionais.

### 4.5 Avaliação de Riscos e Mitigação

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Performance da lista unificada com muitos registros | Média | Paginação ou virtual scroll se > 200 itens |
| Regressão nas ações de pré-cadastro (gerar senha, reenviar) | Alta | Testar cada ação após migração para a nova UI |
| Vazamento de permissão — membro vendo dados de pré-cadastro | Alta | RLS protege em nível de DB; verificar se o frontend não expõe status de pré-cadastro para o role `member` |
| Bookmarks quebrados em `/admin/pre-registrations` | Baixa | Redirect 301 para `/members?status=pre-cadastro` |
| Inconsistência visual durante implementação parcial | Média | Implementar por story: unificar membros primeiro, depois padronizar empresas, depois grupos |

### 4.6 Resultados do Technical Spike

**Portabilidade do sistema de pré-cadastro validada:**
- Todos os hooks (`usePreRegistrations`, `useCreatePreRegistration`, `useResendCredentials`, `useRegeneratePassword`) são **totalmente portáveis** — usam caminhos absolutos de API, sem dependências de route
- Todas as API routes usam autorização por sessão + role admin, **não verificações baseadas em path**
- Todos os componentes (`PreRegistrationModal`, `PreRegistrationStatusBadge`, `PreRegistrationsTable`) usam aliases `@/`, **zero dependências de caminho relativo**
- O middleware não tem tratamento especial para `/admin/pre-registrations`

**Dois sistemas de senha coexistentes identificados:**
1. Tela de Membros: `TemporaryPasswordGenerator` → `/api/members/{id}/generate-password`
2. Tela Admin: `useRegeneratePassword` → `/api/admin/pre-registrations/{id}/regenerate-password`

Reconciliação necessária na Story 1.2 (AC6).

---

## 5. Estrutura de Épicos e Stories

### Abordagem de Épico

**Épico único** — Todas as mudanças são interconectadas por um objetivo comum (UX consistente) e compartilham um componente de base (padrão de card). Múltiplos épicos fragmentariam desnecessariamente um escopo coeso e de impacto moderado.

---

## Épico 1: Unificação de Membros e Padronização de UX

**Objetivo do Épico:** Unificar a gestão de pré-cadastros na tela de Membros e padronizar a experiência visual em Membros, Empresas e Grupos.

**Requisitos de Integração:** Zero alterações de backend/banco de dados. Componentes e hooks existentes são 100% portáveis (validado pelo spike).

### Mapa de Dependências

```
Story 1.1 (Fundação)
   |
   +---> Story 1.2 (Membros + Pré-Cadastro) ---> Story 1.5 (Cleanup)
   |
   +---> Story 1.3 (Empresas) --- paralelo ---+
   |                                           |
   +---> Story 1.4 (Grupos)   --- paralelo ---+
```

---

### Story 1.1: Fundação — Padrão de Card e Componentes Base

> Como admin, quero um padrão visual unificado de card para que Membros, Empresas e Grupos tenham uma aparência consistente.

**Critérios de Aceite:**

- AC1: Padrão de card definido e implementado como componente reutilizável (grid responsivo 1 > 2 > 3 cols)
- AC2: `MemberStatusFilter` criado (Todos / Ativos / Pré-Cadastro)
- AC3: Variantes de badge confirmadas e documentadas para todos os estados

**Verificação de Integração:**

- IV1: Componentes existentes (`PageContainer`, `PageHeader`, `EmptyState`) continuam funcionando
- IV2: Sem regressão visual nas telas atuais

---

### Story 1.2: Membros — Unificar Pré-Cadastros

> _Depende de: Story 1.1_

> Como admin, quero ver membros ativos e pré-cadastros em uma única tela com filtro de status, para que eu possa gerenciar o ciclo de vida completo do associado sem trocar de páginas.

**Critérios de Aceite:**

- AC1: `members/page.tsx` refatorado para server component + `MembersPageClient`
- AC2: Lista unificada exibe profiles + status de pré-cadastro via badge `warning`
- AC3: Filtro de status funcional (Todos / Ativos / Pré-Cadastro)
- AC4: Ações de pré-cadastro (gerar senha, reenviar credenciais) disponíveis inline para itens de pré-cadastro
- AC5: Modal "Novo Pré-Cadastro" funcional via hooks existentes (`useCreatePreRegistration`)
- AC6: Sistemas de senha reconciliados (decisão: manter `TemporaryPasswordGenerator` ou migrar para `useRegeneratePassword`)
- AC7: Membros (role `member`) NÃO veem filtro de status nem ações de pré-cadastro

**Verificação de Integração:**

- IV1: APIs `/api/admin/pre-registrations/*` continuam respondendo corretamente
- IV2: APIs `/api/members/*` sem alterações
- IV3: RLS não expõe dados de pré-cadastro para o role `member`

---

### Story 1.3: Empresas — Padronizar UX

> _Depende de: Story 1.1 | Paralela com: Story 1.2_

> Como usuário, quero visualizar as empresas com o mesmo padrão visual de card usado nas outras áreas, para uma experiência consistente.

**Critérios de Aceite:**

- AC1: Tela de Empresas utiliza o padrão de card da Story 1.1
- AC2: Barra de busca com placeholder contextual
- AC3: Admin vê ações de CRUD, membro vê somente leitura
- AC4: Avaliação da unificação de route `/companies` + `/admin/companies` (FR7)

**Verificação de Integração:**

- IV1: APIs `/api/companies/*` sem alterações
- IV2: Permissões admin/membro preservadas

---

### Story 1.4: Grupos — Padronizar UX

> _Depende de: Story 1.1 | Paralela com: Story 1.2 e Story 1.3_

> Como usuário, quero visualizar os grupos com o padrão visual unificado, incluindo badges consistentes de status e cota.

**Critérios de Aceite:**

- AC1: Tela de Grupos alinhada ao padrão de card da Story 1.1
- AC2: Informações-chave mantidas (valor do bem, valor mensal, cotas ativas/contempladas)
- AC3: Barra de busca e estado vazio padronizados

**Verificação de Integração:**

- IV1: APIs `/api/draws/*` e funcionalidade de sorteio sem alterações
- IV2: Navegação para `/groups/[id]` e `/groups/[id]/draw` preservada

---

### Story 1.5: Cleanup — Sidebar, Redirects e Depreciação

> _Depende de: Story 1.2_

> Como admin, quero que o sidebar reflita a nova estrutura unificada e que as URLs antigas redirecionem corretamente.

**Critérios de Aceite:**

- AC1: Item "Pré-Cadastro" removido do sidebar
- AC2: Route `/admin/pre-registrations` redireciona para `/members?status=pre-cadastro`
- AC3: Testes E2E adaptados para a nova estrutura
- AC4: Sem links quebrados no sistema

**Verificação de Integração:**

- IV1: Sidebar funcional em desktop e mobile
- IV2: Todas as routes protegidas permanecem protegidas

---

_Gerado por Morgan (@pm) via Brownfield PRD Workflow v2.0_
_— Morgan, planejando o futuro_
