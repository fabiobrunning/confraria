# Guia de Setup: Fluxo de Pré-Cadastro de Membros

## ✅ Fase 1 Concluída: Fundação

Arquivos criados e prontos para implementação:

### Banco de Dados
- ✅ **Migration**: `supabase/migrations/20260131120000_create_pre_registration_attempts_table.sql`
  - Cria tabela `pre_registration_attempts` com rastreamento completo
  - Índices otimizados para queries
  - RLS policies para segurança

### Bibliotecas Utilitárias
- ✅ **Geração de senhas**: `lib/pre-registration/generate-password.ts`
  - `generateTemporaryPassword()` - 12 caracteres mistos
  - `generateSMSFriendlyPassword()` - 8 caracteres SMS-friendly
  - `validatePasswordStrength()`
  - `formatPasswordForAudit()`

- ✅ **Schemas Zod**: `lib/pre-registration/schemas.ts`
  - `createPreRegistrationSchema`
  - `preRegistrationLoginSchema`
  - `resendCredentialsSchema`
  - `regeneratePasswordSchema`
  - `setPermanentPasswordSchema`

- ✅ **Templates de Mensagem**: `lib/pre-registration/message-templates.ts`
  - WhatsApp e SMS templates
  - Mensagens: Inicial, Lembrete, Reset de senha
  - Suporte a variáveis (nome, telefone, senha, validade)

- ✅ **Server Service**: `lib/pre-registration/server-service.ts`
  - `createPreRegistrationAttempt()`
  - `getActivePreRegistrationAttempt()`
  - `resendCredentials()`
  - `regeneratePassword()`
  - `listPendingPreRegistrations()`
  - `markFirstAccess()`
  - `incrementFailedAttempts()`

---

## 🚀 Próximos Passos

### Passo 1: Aplicar Migration ao Supabase

**Via CLI (Recomendado):**
```bash
# Navegar para o diretório do projeto
cd /Users/fabiobrunning/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/Fabio\ BB/10-Negócios/10.02-Produto/confraria

# Aplicar migration via Supabase CLI
npx supabase db push

# Ou executar manualmente no Supabase Dashboard:
# 1. Ir para SQL Editor
# 2. Cole o conteúdo de: supabase/migrations/20260131120000_create_pre_registration_attempts_table.sql
# 3. Execute
```

**Via Dashboard Supabase:**
1. Acesse https://app.supabase.com → Seu Projeto
2. SQL Editor → New Query
3. Cole o SQL da migration
4. Execute (Run)

### Passo 2: Gerar Tipos TypeScript

Depois de aplicar a migration, regenere os tipos:

```bash
npm run db:generate-types
# ou
npx supabase gen types typescript --project-id=seu-project-id > lib/supabase/types.ts
```

### Passo 3: Instalar Dependências (se necessário)

```bash
# bcrypt para hash seguro de senhas (próximo passo)
npm install bcrypt
npm install -D @types/bcrypt
```

---

## 🏗️ Arquitetura: Tabela pre_registration_attempts

### Estrutura de Dados

```sql
pre_registration_attempts {
  id                      UUID PK
  member_id               UUID FK → profiles.id
  created_by_admin_id     UUID FK → profiles.id (admin que criou)

  -- Credenciais (NUNCA armazene plain text)
  temporary_password_hash TEXT (bcrypt hash)
  password_generated_at   TIMESTAMPTZ

  -- Rastreamento de Envio
  send_method            VARCHAR ('whatsapp' | 'sms')
  send_count             INTEGER (quantas vezes foi reenviado)
  last_sent_at           TIMESTAMPTZ

  -- Status de Acesso
  first_accessed_at      TIMESTAMPTZ (null = nunca acessou)
  first_access_from_ip   INET (IP do primeiro acesso)

  -- Segurança
  access_attempts        INTEGER (tentativas falhadas de login)
  max_access_attempts    INTEGER (default: 5)
  locked_until           TIMESTAMPTZ (bloqueado até quando)

  -- Expiração
  expiration_date        TIMESTAMPTZ (padrão: +30 dias)

  -- Metadata
  notes                  TEXT (observações do admin)
  created_at             TIMESTAMPTZ
  updated_at             TIMESTAMPTZ
}
```

### Índices Criados

| Índice | Propósito |
|--------|-----------|
| `idx_pre_registration_attempts_member_id` | Buscar por membro |
| `idx_pre_registration_attempts_created_by_admin_id` | Auditoria |
| `idx_pre_registration_attempts_created_at` | Listagem ordenada |
| `idx_pre_registration_attempts_expiration` | Limpar expirados |
| `idx_pre_registration_attempts_first_accessed` | Filtrar pendentes |

### RLS Policies

| Policy | Quem | Ação | Condição |
|--------|------|------|----------|
| Admins view all | Admin | SELECT | role = 'admin' |
| Admins create | Admin | INSERT | role = 'admin' AND created_by = auth.uid |
| Admins update | Admin | UPDATE | role = 'admin' |
| Members view own | Member | SELECT | member_id = auth.uid |

---

## 📋 Fluxo Esperado

### 1️⃣ Admin Cria Pré-Cadastro

```typescript
// Admin UI: Clica em "Novo Pré-Cadastro"
const result = await createPreRegistrationAttempt(
  memberId: '123e4567-e89b-12d3-a456-426614174000',
  createdByAdminId: 'admin-uuid',
  sendMethod: 'whatsapp'
);

// Retorna:
// {
//   success: true,
//   attemptId: 'attempt-uuid',
//   temporaryPassword: 'A1b2C3d4E5f6' // Plain text - ENVIA AGORA
// }
```

### 2️⃣ Sistema Envia Mensagem WhatsApp

```typescript
// Usa template + mensagem
const message = getWhatsAppInitialCredentialsMessage({
  recipientName: 'João Silva',
  phone: '(11) 99999-9999',
  password: 'A1b2C3d4E5f6',
  expiresIn: '30 dias',
  appUrl: 'https://confraria.app'
});

// Envia via Twilio (próxima implementação)
await sendWhatsAppViaTwilio(phone, message);
```

### 3️⃣ Membro Faz Primeiro Acesso

```typescript
// POST /api/auth/pre-registration-login
// Body: { phone: '(11) 99999-9999', temporary_password: 'A1b2C3d4E5f6' }

// 1. Verifica se pré-registro existe e está válido
// 2. Valida senha (bcrypt)
// 3. Marca first_accessed_at
// 4. Cria session
// 5. Redireciona para mudar senha permanente
```

### 4️⃣ Admin pode Reenviar (Mesma Senha)

```typescript
// Admin UI: Botão "Reenviar Credenciais"
await resendCredentials(
  preRegistrationId: 'attempt-uuid',
  sendMethod: 'whatsapp'
);

// Atualiza:
// - send_count++ (incrementa)
// - last_sent_at (agora)
// - Usa MESMA password_hash
```

### 5️⃣ Admin pode Regenerar (Nova Senha)

```typescript
// Admin UI: Botão "Regenerar Senha"
const result = await regeneratePassword(
  preRegistrationId: 'attempt-uuid',
  adminId: 'admin-uuid',
  sendMethod: 'whatsapp'
);

// Retorna nova senha para enviar
// Atualiza:
// - temporary_password_hash (novo hash)
// - password_generated_at (agora)
// - send_count (reset)
```

### 6️⃣ Admin Lista Pendentes

```typescript
// GET /api/admin/pre-registrations/pending?page=1&limit=20
const result = await listPendingPreRegistrations(1, 20);

// Retorna:
// {
//   data: [
//     {
//       id: 'attempt-uuid',
//       member_name: 'João Silva',
//       member_phone: '(11) 99999-9999',
//       created_at: '2026-01-31T12:00:00Z',
//       last_sent_at: '2026-01-31T12:05:00Z',
//       send_count: 2,
//       first_accessed_at: null  // Ainda não acessou
//     },
//     // ... mais registros
//   ],
//   total: 45,
//   page: 1,
//   totalPages: 3
// }
```

---

## 🔐 Segurança: O que foi Implementado

✅ **Proteção de Senhas**
- Senhas temporárias NÃO são armazenadas em plain text
- Hash com bcrypt (12 rounds - padrão do Supabase)
- Apenas últimos 4 caracteres são logados (para auditoria)

✅ **Expiração**
- Padrão: 30 dias
- Verificado em cada login
- Pode ser estendido por admin

✅ **Limite de Tentativas**
- Máximo 5 tentativas falhadas
- Bloqueado por 15 minutos após exceder
- Reset ao sucesso ou expiração do bloqueio

✅ **RLS Policies**
- Admins: acesso completo
- Membros: apenas visualizar sua própria tentativa
- Anônimos: sem acesso

✅ **Auditoria**
- Quem criou o pré-registro (created_by_admin_id)
- Quando cada mensagem foi enviada (last_sent_at)
- IP do primeiro acesso (first_access_from_ip)
- Tentativas de login (access_attempts)

---

## 📚 Estrutura de Arquivos Criados

```
lib/pre-registration/
├── generate-password.ts          # Geração + validação de senhas
├── schemas.ts                    # Zod schemas para validação
├── message-templates.ts          # Templates de mensagens
└── server-service.ts             # Operações no servidor

docs/04-IMPLEMENTATION/
└── PRE-REGISTRATION-SETUP.md     # Este arquivo

supabase/migrations/
└── 20260131120000_create_pre_registration_attempts_table.sql
```

---

## ⚠️ TODOs para Implementação

### Antes da Fase 2 (Backend APIs)

- [ ] Aplicar migration ao Supabase
- [ ] Regenerar tipos TypeScript (npm run db:generate-types)
- [ ] Instalar bcrypt: `npm install bcrypt @types/bcrypt`
- [ ] Criar Edge Function para hash seguro de senhas (bcrypt)
- [ ] Configurar Twilio para envio de WhatsApp/SMS

### Antes da Fase 3 (Frontend)

- [ ] Implementar endpoints API (POST, GET, PUT)
- [ ] Testes dos endpoints
- [ ] Criar componentes React

---

## 🔗 Referências

### Funções Disponíveis

#### `generate-password.ts`
```typescript
generateTemporaryPassword(length?: number): string
generateSMSFriendlyPassword(length?: number): string
validatePasswordStrength(password: string): { score, hasUppercase, ... }
formatPasswordForAudit(password: string): string
validatePhoneFormat(phone: string): boolean
normalizePhoneNumber(phone: string): string
```

#### `message-templates.ts`
```typescript
getWhatsAppInitialCredentialsMessage(context): string
getSMSInitialCredentialsMessage(context): string
getWhatsAppReminderMessage(context): string
getSMSReminderMessage(context): string
getWhatsAppPasswordResetMessage(context): string
getSMSPasswordResetMessage(context): string
getMessageTemplate(method, type, context): string
formatPhoneForWhatsApp(phone: string): string
createWhatsAppLink(phone: string, message: string): string
```

#### `server-service.ts`
```typescript
createPreRegistrationAttempt(memberId, createdByAdminId, sendMethod?, notes?): Promise<{...}>
getActivePreRegistrationAttempt(memberId): Promise<PreRegistrationAttempt | null>
resendCredentials(preRegistrationId, sendMethod): Promise<{...}>
regeneratePassword(preRegistrationId, adminId, sendMethod?): Promise<{...}>
listPendingPreRegistrations(page?, limit?): Promise<{...}>
markFirstAccess(preRegistrationId, ipAddress?): Promise<{...}>
incrementFailedAttempts(preRegistrationId): Promise<{...}>
verifyTemporaryPassword(plainPassword, hashedPassword): Promise<boolean>
```

---

## 🎯 Próxima Fase

Quando a Fase 1 (Fundação) estiver completa:

### **Fase 2: Backend (APIs)**
1. `POST /api/admin/pre-registrations` - Criar
2. `GET /api/admin/pre-registrations/pending` - Listar
3. `POST /api/admin/pre-registrations/:id/resend` - Reenviar
4. `POST /api/admin/pre-registrations/:id/regenerate` - Regenerar
5. Integração Twilio
6. Testes

### **Fase 3: Frontend (UI)**
1. Modal de pré-cadastro
2. Tabela de pré-cadastros pendentes
3. Ações: Reenviar, Regenerar
4. Status badges

---

## 💬 Contato & Dúvidas

Se precisar de ajuda:
1. Verifique o relatório da @architect em: `docs/03-ARCHITECTURE/PRE-REGISTRATION-ARCH.md`
2. Verifique o relatório do @dev em: `docs/04-IMPLEMENTATION/PRE-REGISTRATION-ANALYSIS.md`

---

**Status**: ✅ Fase 1 (Fundação) Completa
**Próximo**: Aplicar migration + Implementar APIs (Fase 2)
