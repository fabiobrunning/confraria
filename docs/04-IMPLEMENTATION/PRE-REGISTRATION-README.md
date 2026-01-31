# 🎯 Fluxo de Pré-Cadastro de Membros - DOCUMENTAÇÃO COMPLETA

**Status**: ✅ Fase 1 & 2 Implementadas | ⏳ Fase 3 (Frontend) Planejada
**Última Atualização**: 31 de janeiro de 2026

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Fases de Implementação](#fases)
3. [Como Usar](#como-usar)
4. [Estrutura de Dados](#estrutura)
5. [API Endpoints](#endpoints)
6. [Segurança](#segurança)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de **pré-cadastro de membros** permite que:

1. **Admin cria pré-cadastro** → Gera senha aleatória + envia via WhatsApp/SMS
2. **Novo membro recebe mensagem** → Com usuário (telefone) + senha temporária
3. **Membro faz primeiro acesso** → Sistema marca como acessado
4. **Membro define senha permanente** → Completa o cadastro
5. **Admin gerencia pendentes** → Pode reenviar ou regenerar senhas

---

## 🚀 Fases de Implementação

### ✅ Fase 1: Fundação (COMPLETA)

**O que foi feito:**
- Tabela `pre_registration_attempts` no banco
- Funções de geração de senha
- Validação com Zod schemas
- Templates de mensagens WhatsApp/SMS
- Service layer completo

**Arquivos:**
- `supabase/migrations/20260131120000_create_pre_registration_attempts_table.sql`
- `lib/pre-registration/generate-password.ts`
- `lib/pre-registration/schemas.ts`
- `lib/pre-registration/message-templates.ts`
- `lib/pre-registration/server-service.ts`

**Status**: ✅ Pronto para usar

---

### ✅ Fase 2: Backend APIs (COMPLETA)

**O que foi feito:**
- 6 endpoints REST documentados
- Autenticação e autorização
- Validação de entrada
- Tratamento de erros
- Test suite

**Endpoints:**
- `POST /api/admin/pre-registrations` → Criar
- `GET /api/admin/pre-registrations` → Listar
- `GET /api/admin/pre-registrations/{id}` → Detalhes
- `POST /api/admin/pre-registrations/{id}/resend-credentials` → Reenviar
- `POST /api/admin/pre-registrations/{id}/regenerate-password` → Regenerar
- `PUT /api/admin/pre-registrations/{id}` → Atualizar

**Arquivos:**
- `app/api/admin/pre-registrations/route.ts`
- `app/api/admin/pre-registrations/[id]/route.ts`
- `app/api/admin/pre-registrations/[id]/resend-credentials/route.ts`
- `app/api/admin/pre-registrations/[id]/regenerate-password/route.ts`
- `app/api/admin/pre-registrations/__tests__/pre-registrations.test.ts`

**Documentação:**
- `docs/04-IMPLEMENTATION/PRE-REGISTRATION-API.md`

**Status**: ✅ Pronto para testar

---

### ⏳ Fase 3: Frontend + Twilio (PLANEJADA)

**O que será feito:**
- Componentes React para admin UI
- Integração Twilio (envio automático)
- Modal de criação
- Tabela de pendentes
- Status badges
- Bulk actions

**Estimado**: ~3-4 sprints

---

## 💡 Como Usar

### 1. Setup Inicial (Antes de Tudo)

```bash
# Instalar dependências
npm install bcrypt @types/bcrypt

# Aplicar migration ao Supabase
# Via CLI:
npx supabase db push

# Ou manualmente:
# 1. Acesse https://app.supabase.com
# 2. SQL Editor → New Query
# 3. Cole: supabase/migrations/20260131120000_...
# 4. Execute

# Regenerar tipos TypeScript
npm run db:generate-types
```

### 2. Criar Novo Pré-Cadastro (API)

**cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/pre-registrations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "member_id": "550e8400-e29b-41d4-a716-446655440000",
    "send_method": "whatsapp",
    "notes": "Novo cadastro"
  }'
```

**Response:**
```json
{
  "success": true,
  "preRegistrationId": "attempt-uuid",
  "member": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  },
  "credentials": {
    "temporaryPassword": "A1b2C3d4E5f6",
    "username": "(11) 99999-9999",
    "expiresIn": "30 dias"
  },
  "message": "Olá João Silva!...",
  "whatsappLink": "https://wa.me/5511999999999?text=..."
}
```

### 3. Enviar Mensagem (Manual - Fase 2)

**Opção A: Click no link**
```
Clique no "whatsappLink" retornado
```

**Opção B: Copy-Paste Manual**
```
Copie o "message" e envie via WhatsApp/SMS
```

**Opção C: Integração Twilio (Fase 3)**
```
[Será implementado com automated sending]
```

### 4. Listar Pendentes (API)

```bash
curl -X GET 'http://localhost:3000/api/admin/pre-registrations?page=1&limit=20' \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

Response:
```json
{
  "data": [
    {
      "id": "attempt-uuid",
      "member_name": "João Silva",
      "member_phone": "(11) 99999-9999",
      "created_at": "2026-01-31T12:00:00Z",
      "send_count": 1,
      "last_sent_at": "2026-01-31T12:00:00Z",
      "first_accessed_at": null
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

### 5. Reenviar ou Regenerar

**Reenviar (mesma senha):**
```bash
curl -X POST http://localhost:3000/api/admin/pre-registrations/ATTEMPT_ID/resend-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"send_method": "whatsapp"}'
```

**Regenerar (nova senha):**
```bash
curl -X POST http://localhost:3000/api/admin/pre-registrations/ATTEMPT_ID/regenerate-password \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"send_method": "whatsapp"}'
```

---

## 🗄️ Estrutura de Dados

### Tabela: `pre_registration_attempts`

```sql
CREATE TABLE pre_registration_attempts (
  id UUID PK,
  member_id UUID FK → profiles.id,
  created_by_admin_id UUID FK → profiles.id,
  temporary_password_hash TEXT (bcrypt),
  password_generated_at TIMESTAMPTZ,
  send_method VARCHAR ('whatsapp'|'sms'),
  send_count INTEGER,
  last_sent_at TIMESTAMPTZ,
  first_accessed_at TIMESTAMPTZ,
  first_access_from_ip INET,
  access_attempts INTEGER,
  max_access_attempts INTEGER,
  locked_until TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Relacionamentos

```
profiles
  ├─ id (PK)
  ├─ full_name
  ├─ phone
  ├─ pre_registered (boolean)
  └─ role ('admin'|'member')
     ↓ FK
pre_registration_attempts
  ├─ member_id → profiles.id
  ├─ created_by_admin_id → profiles.id
  └─ ... (credenciais + auditoria)
```

### RLS Policies

```
✅ Admins: acesso completo (SELECT, INSERT, UPDATE)
✅ Membros: visualizar apenas seu próprio
❌ Anônimos: sem acesso
```

---

## 🔌 API Endpoints

Para documentação completa, veja: `docs/04-IMPLEMENTATION/PRE-REGISTRATION-API.md`

### Resumo Rápido

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/admin/pre-registrations` | Criar novo |
| GET | `/api/admin/pre-registrations` | Listar pendentes |
| GET | `/api/admin/pre-registrations/{id}` | Detalhes |
| POST | `/api/admin/pre-registrations/{id}/resend-credentials` | Reenviar |
| POST | `/api/admin/pre-registrations/{id}/regenerate-password` | Regenerar |
| PUT | `/api/admin/pre-registrations/{id}` | Atualizar notes |

### Status Codes

```
200 OK                 - Sucesso
201 Created            - Criado com sucesso
400 Bad Request        - Dados inválidos
401 Unauthorized       - Sem autenticação
403 Forbidden          - Não é admin
404 Not Found          - Recurso não existe
500 Internal Server    - Erro no servidor
```

---

## 🔐 Segurança

### ✅ Implementado

- [x] Senhas: Hash bcrypt (NÃO plain text)
- [x] Autenticação: Sessão Supabase Auth
- [x] Autorização: Role-based (admin only)
- [x] Validação: Zod schemas
- [x] Expiração: 30 dias
- [x] Limite de tentativas: 5 com bloqueio 15 min
- [x] Auditoria: Rastreia admin, IP, timestamps
- [x] RLS Policies: Row-level security

### ⏳ Para Implementar (Fase 3)

- [ ] Rate limiting (5 req/min)
- [ ] CORS configuration
- [ ] IP whitelist (opcional)
- [ ] Webhook signatures (Twilio)
- [ ] Encryption at rest (dados sensíveis)

---

## 🧪 Como Testar

### Option 1: cURL (Terminal)

```bash
# Criar
curl -X POST http://localhost:3000/api/admin/pre-registrations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=TOKEN" \
  -d '{"member_id":"UUID","send_method":"whatsapp"}'

# Listar
curl http://localhost:3000/api/admin/pre-registrations \
  -H "Cookie: sb-access-token=TOKEN"
```

### Option 2: Postman / Thunder Client

1. Abra Postman
2. Collection → New
3. Adicione requests (veja examples na API doc)
4. Teste!

### Option 3: Frontend Code

```typescript
// React Hook
const [loading, setLoading] = useState(false);

const handleCreate = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/admin/pre-registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: 'uuid-do-membro',
        send_method: 'whatsapp'
      })
    });

    const data = await response.json();
    console.log('Sucesso:', data);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## ⚠️ Troubleshooting

### Erro: Migration não aplicada

**Sintoma**: `Table pre_registration_attempts does not exist`

**Solução**:
```bash
# Via Supabase CLI
npx supabase db push

# Ou manualmente no SQL Editor do Supabase
```

### Erro: 401 Unauthorized

**Sintoma**: `{"error":"Não autorizado"}`

**Solução**: Você não está autenticado. Faça login primeiro.

### Erro: 403 Forbidden

**Sintoma**: `{"error":"Acesso negado"}`

**Solução**: Sua conta não é admin. Use account com `role='admin'`.

### Erro: Tipos TypeScript desatualizados

**Sintoma**: Type errors ao usar types do banco

**Solução**:
```bash
npm run db:generate-types
```

### Erro: Password hash inválido

**Sintoma**: Login falha mesmo com senha correta

**Solução**: Verifique se `bcrypt` está instalado:
```bash
npm install bcrypt @types/bcrypt
```

---

## 📋 Checklist de Implementação

### Fase 1 ✅
- [x] Migration SQL
- [x] Geração de senhas
- [x] Validação (Zod)
- [x] Templates de mensagem
- [x] Server service

### Fase 2 ✅
- [x] Endpoints de API
- [x] Autenticação/Autorização
- [x] Documentação completa
- [x] Test suite
- [x] Error handling

### Fase 3 ⏳
- [ ] Componentes React
- [ ] Integração Twilio
- [ ] UI Admin
- [ ] E2E Tests
- [ ] Performance optimization

---

## 📞 Contato & Suporte

Dúvidas ou bugs?

1. Verifique `PRE-REGISTRATION-API.md` para referência
2. Verifique `PRE-REGISTRATION-SETUP.md` para setup
3. Verifique testes em `__tests__/pre-registrations.test.ts`
4. Verifique logs do servidor: `npm run dev`

---

## 📚 Referências

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Zod Docs**: https://zod.dev
- **bcrypt Docs**: https://github.com/kelektiv/node.bcrypt.js

---

## 🎓 Próximos Passos

### Imediato
1. Aplicar migration ao Supabase
2. Regenerar tipos TypeScript
3. Testar endpoints com cURL

### Curto Prazo (Semana)
1. Implementar componentes React (Fase 3)
2. Integrar Twilio (automático)
3. Criar UI admin

### Médio Prazo (Mês)
1. Tests E2E com Cypress
2. Performance optimization
3. Analytics & monitoring

---

**Criado por**: Orion, Master Orchestrator 👑
**Data**: 31 de janeiro de 2026
**Versão**: 1.0

---

## 📊 Sumário Rápido

| Item | Status | Localização |
|------|--------|------------|
| Migration SQL | ✅ | `supabase/migrations/` |
| Funções Core | ✅ | `lib/pre-registration/` |
| Endpoints API | ✅ | `app/api/admin/pre-registrations/` |
| Documentação API | ✅ | `docs/04-IMPLEMENTATION/PRE-REGISTRATION-API.md` |
| Testes | ✅ | `app/api/admin/pre-registrations/__tests__/` |
| Fase 3 (Frontend) | ⏳ | TBD |
| Twilio Integration | ⏳ | TBD |

**Tudo pronto para a próxima fase! 🚀**
