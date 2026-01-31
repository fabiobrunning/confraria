# API Endpoints: Pré-Cadastro de Membros

**Base URL**: `https://your-app.com/api/admin`
**Autenticação**: Requer sessão Supabase Auth + Role Admin
**Formato**: JSON

---

## 📋 Endpoints

### 1. Criar Pré-Cadastro

**Endpoint**: `POST /pre-registrations`

**Descrição**: Cria um novo pré-registro, gera senha temporária e retorna a mensagem para envio.

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {session_token}
```

**Request Body**:
```json
{
  "member_id": "uuid-do-membro",
  "send_method": "whatsapp",
  "notes": "Cadastro via formulário web"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "preRegistrationId": "uuid-do-attempt",
  "member": {
    "id": "uuid-do-membro",
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  },
  "credentials": {
    "temporaryPassword": "A1b2C3d4E5f6",
    "username": "(11) 99999-9999",
    "expiresIn": "30 dias"
  },
  "message": "Olá João Silva!...",
  "whatsappLink": "https://wa.me/5511999999999?text=...",
  "notes": "Copie a senha acima e envie via WhatsApp ou SMS"
}
```

**Erros**:
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Sem autenticação
- `403 Forbidden` - Não é admin
- `404 Not Found` - Membro não existe
- `500 Internal Server Error` - Erro ao criar

**Exemplo com cURL**:
```bash
curl -X POST https://your-app.com/api/admin/pre-registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "member_id": "550e8400-e29b-41d4-a716-446655440000",
    "send_method": "whatsapp",
    "notes": "Novo membro via portal"
  }'
```

---

### 2. Listar Pré-Registros Pendentes

**Endpoint**: `GET /pre-registrations?page=1&limit=20`

**Descrição**: Lista todos os pré-registros que ainda não foram acessados.

**Query Parameters**:
| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Itens por página (max 100) |

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid-do-attempt",
      "member_id": "uuid-do-membro",
      "member_name": "João Silva",
      "member_phone": "(11) 99999-9999",
      "created_at": "2026-01-31T12:00:00Z",
      "password_generated_at": "2026-01-31T12:00:00Z",
      "send_count": 2,
      "last_sent_at": "2026-01-31T12:05:00Z",
      "send_method": "whatsapp",
      "first_accessed_at": null,
      "expiration_date": "2026-03-02T12:00:00Z",
      "access_attempts": 0,
      "locked_until": null
    },
    {
      "id": "outro-uuid",
      "member_name": "Maria Santos",
      "member_phone": "(21) 98888-8888",
      "created_at": "2026-01-30T10:00:00Z",
      "send_count": 1,
      "last_sent_at": "2026-01-30T10:01:00Z",
      "send_method": "sms",
      "first_accessed_at": null,
      "expiration_date": "2026-03-01T10:00:00Z",
      "access_attempts": 0,
      "locked_until": null
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

**Exemplo com cURL**:
```bash
curl -X GET 'https://your-app.com/api/admin/pre-registrations?page=1&limit=20' \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

### 3. Obter Detalhes de Pré-Registro

**Endpoint**: `GET /pre-registrations/{id}`

**Descrição**: Obtém detalhes completos de um pré-registro específico.

**URL Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do pré-registro |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-attempt",
    "member": {
      "id": "uuid-do-membro",
      "full_name": "João Silva",
      "phone": "(11) 99999-9999",
      "role": "member",
      "created_at": "2026-01-31T12:00:00Z"
    },
    "createdByAdmin": {
      "id": "uuid-do-admin",
      "full_name": "Admin Name"
    },
    "credentials": {
      "sendMethod": "whatsapp",
      "passwordGeneratedAt": "2026-01-31T12:00:00Z",
      "expirationDate": "2026-03-02T12:00:00Z",
      "isExpired": false
    },
    "sendHistory": {
      "sendCount": 2,
      "lastSentAt": "2026-01-31T12:05:00Z"
    },
    "accessStatus": {
      "firstAccessedAt": null,
      "firstAccessFromIp": null,
      "hasAccessed": false,
      "accessAttempts": 0,
      "maxAccessAttempts": 5,
      "isLocked": false,
      "lockedUntil": null
    },
    "metadata": {
      "notes": "Observações do admin",
      "createdAt": "2026-01-31T12:00:00Z",
      "updatedAt": "2026-01-31T12:00:00Z"
    }
  }
}
```

**Exemplo com cURL**:
```bash
curl -X GET 'https://your-app.com/api/admin/pre-registrations/550e8400-e29b-41d4-a716-446655440000' \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

### 4. Reenviar Credenciais

**Endpoint**: `POST /pre-registrations/{id}/resend-credentials`

**Descrição**: Reenvia a MESMA senha temporária ao membro (incrementa send_count).

**URL Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do pré-registro |

**Request Body**:
```json
{
  "send_method": "whatsapp"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Credenciais reenviadas com sucesso. Atualize send_count e last_sent_at no banco.",
  "member": {
    "id": "uuid-do-membro",
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  },
  "notes": "A senha não é exibida por segurança. Verifique o banco de dados para o hash."
}
```

**Erros**:
- `400 Bad Request` - Membro já acessou ou pré-registro expirado
- `404 Not Found` - Pré-registro não encontrado

**Exemplo com cURL**:
```bash
curl -X POST 'https://your-app.com/api/admin/pre-registrations/550e8400-e29b-41d4-a716-446655440000/resend-credentials' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"send_method": "whatsapp"}'
```

---

### 5. Regenerar Senha

**Endpoint**: `POST /pre-registrations/{id}/regenerate-password`

**Descrição**: Gera uma NOVA senha temporária e substitui a anterior.

**URL Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do pré-registro |

**Request Body**:
```json
{
  "send_method": "whatsapp"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "preRegistrationId": "uuid-do-attempt",
  "member": {
    "id": "uuid-do-membro",
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  },
  "credentials": {
    "newTemporaryPassword": "X9y8Z7w6V5u4",
    "username": "(11) 99999-9999",
    "expiresIn": "30 dias"
  },
  "message": "Olá João Silva! Uma nova senha foi gerada...",
  "whatsappLink": "https://wa.me/5511999999999?text=...",
  "notes": "Nova senha gerada com sucesso. Envie ao membro via WhatsApp ou SMS."
}
```

**Erros**:
- `400 Bad Request` - Pré-registro expirado
- `404 Not Found` - Pré-registro não encontrado

**Exemplo com cURL**:
```bash
curl -X POST 'https://your-app.com/api/admin/pre-registrations/550e8400-e29b-41d4-a716-446655440000/regenerate-password' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"send_method": "whatsapp"}'
```

---

### 6. Atualizar Observações

**Endpoint**: `PUT /pre-registrations/{id}`

**Descrição**: Atualiza as observações (notes) de um pré-registro.

**URL Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do pré-registro |

**Request Body**:
```json
{
  "notes": "Novo texto de observação"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-attempt",
    "notes": "Novo texto de observação",
    "updated_at": "2026-01-31T13:00:00Z"
  }
}
```

**Exemplo com cURL**:
```bash
curl -X PUT 'https://your-app.com/api/admin/pre-registrations/550e8400-e29b-41d4-a716-446655440000' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"notes": "Membro confirmou recebimento da senha"}'
```

---

## 🔐 Autenticação

Todos os endpoints requerem:

1. **Sessão Supabase Auth válida**
   - Obtém automaticamente do cookie `sb-access-token`
   - Alternativa: passar no header Authorization

2. **Role Admin**
   - Verifica `profiles.role = 'admin'`
   - Sem admin, retorna `403 Forbidden`

---

## ⚠️ Limites e Regras

| Regra | Descrição |
|-------|-----------|
| **Expiração** | 30 dias a partir da criação |
| **Tentativas** | Máx 5 tentativas de login falhadas |
| **Bloqueio** | 15 minutos após exceder tentativas |
| **Envio** | Não há limite de resends (auditado) |
| **Regeneração** | Reset send_count ao gerar nova senha |

---

## 📊 Fluxo de Uso Típico

```
1. Admin cria pré-registro
   POST /pre-registrations
   → Retorna: ID + Senha + Mensagem

2. Admin envia mensagem manualmente (via WhatsApp/SMS)
   Clica no whatsappLink ou copia a mensagem

3. Admin monitora pendentes
   GET /pre-registrations?page=1

4. Se membro não acessar após 2 dias:
   POST /pre-registrations/{id}/resend-credentials
   → Reenvia MESMA senha

5. Se membro perdeu a senha:
   POST /pre-registrations/{id}/regenerate-password
   → Gera NOVA senha + reenvia

6. Membro faz primeiro acesso:
   [Sistema marca first_accessed_at automaticamente]

7. Admin verifica status:
   GET /pre-registrations/{id}
   → Vê: first_accessed_at preenchido
```

---

## 🧪 Testes com Postman/Thunder Client

**Importar Variáveis de Ambiente**:
```json
{
  "base_url": "https://your-app.com",
  "session_token": "your-session-token-here"
}
```

**Requests Prontas**:

1. **Criar**:
```
POST {{base_url}}/api/admin/pre-registrations
Header: Authorization: Bearer {{session_token}}
Body:
{
  "member_id": "550e8400-e29b-41d4-a716-446655440000",
  "send_method": "whatsapp"
}
```

2. **Listar**:
```
GET {{base_url}}/api/admin/pre-registrations?page=1&limit=20
Header: Authorization: Bearer {{session_token}}
```

3. **Reenviar**:
```
POST {{base_url}}/api/admin/pre-registrations/ATTEMPT_ID/resend-credentials
Header: Authorization: Bearer {{session_token}}
Body: {"send_method": "whatsapp"}
```

---

## 🐛 Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | Sem sessão válida | Faça login primeiro |
| `403 Forbidden` | Não é admin | Use conta admin |
| `404 Not Found` | ID inválido | Verifique UUID |
| `400 Bad Request` | Já acessou | Use regenerate, não resend |
| `500 Internal Server Error` | Erro no servidor | Verifique logs |

---

## 📚 Próximos Passos

- [ ] Implementar Frontend UI (React components)
- [ ] Integrar Twilio para envio automático
- [ ] Criar tests E2E
- [ ] Documentar webhooks de delivery

---

**Última Atualização**: 31 de janeiro de 2026
