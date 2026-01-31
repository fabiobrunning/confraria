# 📱 Setup Twilio - Envio Automático de WhatsApp e SMS

**Status**: ⏳ Configuração Necessária
**Requisito**: Conta Twilio ativa
**Tempo Estimado**: 15-20 min

---

## 🎯 Objetivo

Configurar Twilio para envio automático de:
- ✅ Mensagens WhatsApp com credenciais de pré-cadastro
- ✅ SMS como fallback
- ✅ Rastreamento de delivery
- ✅ Webhook para status de mensagens

---

## 📋 Pré-requisitos

1. **Conta Twilio** - Criar em https://www.twilio.com
2. **Conta Twilio Verified** (opcional mas recomendado)
3. **Números Twilio** - Pelo menos um número para WhatsApp ou SMS

---

## 🔧 Configuração Passo a Passo

### Passo 1: Criar Conta Twilio

1. Acesse https://www.twilio.com/console
2. Sign up com email e senha
3. Confirme seu email
4. Você receberá um número de teste para desenvolvimento

### Passo 2: Obter Credenciais

1. Vá para: https://console.twilio.com/
2. No painel esquerdo, encontre "Account Info"
3. Copie:
   - **Account SID**: Começa com "AC"
   - **Auth Token**: Secreta, NÃO compartilhe!

### Passo 3: Configurar WhatsApp (Recomendado)

**Via Twilio Console:**

1. Acesse: https://console.twilio.com/phone-numbers/
2. Clique em "WhatsApp" → "Sandbox"
3. Escolha um número WhatsApp Twilio (ex: +1415...)
4. Salve este número (usar como `TWILIO_WHATSAPP_NUMBER`)

**Teste WhatsApp Sandbox:**

1. No painel WhatsApp, veja as instruções
2. Envie uma mensagem para o número Twilio com texto específico
3. Twilio confirmará e você poderá enviar mensagens

### Passo 4: Configurar SMS (Opcional)

1. Vá para: https://console.twilio.com/phone-numbers/incoming
2. Clique em "Buy a Phone Number"
3. Escolha um número com SMS habilitado
4. Salve este número (usar como `TWILIO_SMS_NUMBER`)

### Passo 5: Adicionar Variáveis de Ambiente

**Arquivo: `.env.local`**

```bash
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here

# Twilio Phone Numbers
TWILIO_WHATSAPP_NUMBER=+1415xxxxxxx
TWILIO_SMS_NUMBER=+1415xxxxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:**
- Nunca commite `.env.local` no git
- Adicione `.env.local` ao `.gitignore`
- Use `.env.example` como template (sem valores reais)

### Passo 6: Instalar Dependência Twilio

```bash
npm install twilio
# ou
yarn add twilio
```

### Passo 7: Testar Configuração

**Via Terminal (Node.js):**

```javascript
// test-twilio.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsApp() {
  try {
    const message = await client.messages.create({
      body: 'Teste de WhatsApp - Confraria Pedra Branca',
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: 'whatsapp:' + process.env.USER_PHONE // Seu número
    });
    console.log('✅ WhatsApp enviado:', message.sid);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testWhatsApp();
```

**Via App (React):**

```typescript
// Na página de admin, teste o endpoint:
fetch('/api/admin/pre-registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    member_id: 'test-uuid',
    send_method: 'whatsapp',
    notes: 'Teste Twilio'
  })
});
```

---

## 🚀 Ativar Envio Automático

### Opção 1: Envio Manual (Padrão Fase 3)

O admin cria o pré-cadastro e envia a mensagem manualmente:

```typescript
// Modal retorna whatsappLink
// Admin clica e envia via WhatsApp web
```

**Ativação:**
- Já está implementado ✅
- Sem necessidade de Twilio

### Opção 2: Envio Automático via API (Recomendado)

Modificar endpoint para enviar automaticamente via Twilio:

**Arquivo: `app/api/admin/pre-registrations/route.ts`**

```typescript
// Adicionar após criar pré-registro:
import { sendWhatsAppMessage } from '@/lib/twilio/send-message'

// ... após criar pré-cadastro ...

if (result.success && result.temporaryPassword) {
  // Enviar mensagem automaticamente
  const sendResult = await sendWhatsAppMessage({
    to: member.phone,
    message: message
  });

  if (sendResult.success) {
    // Atualizar send_count e last_sent_at no banco
    // (já feito no server-service)
  } else {
    // Log erro mas não falha a criação
    console.error('Aviso: Falha ao enviar WhatsApp:', sendResult.error);
  }
}
```

### Opção 3: Webhook para Delivery Status

**Setup de Webhook:**

1. Vá para: https://console.twilio.com/phone-numbers/whatsapp
2. Configure "Webhook URL":
   ```
   https://seu-app.com/api/webhooks/twilio/status
   ```
3. Método: POST

**Criar Endpoint: `app/api/webhooks/twilio/status/route.ts`**

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // body.MessageSid - ID da mensagem
  // body.MessageStatus - delivered, failed, undelivered, etc

  // Atualizar banco de dados com status
  // Logar para auditoria

  return Response.json({ success: true });
}
```

---

## 💰 Custos Twilio

### Desenvolvimento (Free Tier)

- ✅ $15 de crédito grátis ao criar conta
- ✅ Números de teste (WhatsApp Sandbox)
- ✅ SMS limitado

### Produção

**WhatsApp:**
- ~$0.0079 por mensagem de entrada
- ~$0.0044 por mensagem de saída (template)
- ~$0.0088 por mensagem de saída (não-template)

**SMS:**
- ~$0.0075 por SMS (varia por país)

**Estimativa para 100 pré-cadastros:**
- WhatsApp: ~$0.44 (envio inicial)
- SMS: ~$0.75 (se usar como fallback)
- **Total/mês**: ~$50-200 dependendo do volume

**Dica:** Comece com Free Tier, teste, depois contrate plano pago

---

## ✅ Checklist de Configuração

- [ ] Conta Twilio criada
- [ ] Account SID obtido
- [ ] Auth Token obtido
- [ ] Número WhatsApp configurado
- [ ] Número SMS configurado (opcional)
- [ ] Variáveis de ambiente adicionadas a `.env.local`
- [ ] Dependência Twilio instalada (`npm install twilio`)
- [ ] Teste WhatsApp de envio realizado
- [ ] Teste SMS de envio realizado (se aplicável)
- [ ] `.gitignore` atualizado (excluir `.env.local`)

---

## 🧪 Testes Recomendados

### Teste 1: Verificar Configuração

```bash
# Node REPL
node
> const config = require('./lib/twilio/client').checkTwilioConfiguration()
> console.log(config)
# Resultado: { configured: true, message: '...' }
```

### Teste 2: Enviar WhatsApp

```typescript
import { sendWhatsAppMessage } from '@/lib/twilio/send-message'

const result = await sendWhatsAppMessage({
  to: process.env.YOUR_PHONE,
  message: 'Teste de WhatsApp!'
})

console.log(result)
// Sucesso: { success: true, messageId: 'SMs...' }
// Erro: { success: false, error: '...' }
```

### Teste 3: Enviar SMS

```typescript
import { sendSMSMessage } from '@/lib/twilio/send-message'

const result = await sendSMSMessage({
  to: process.env.YOUR_PHONE,
  message: 'Teste de SMS!'
})
```

### Teste 4: Fluxo Completo

1. Abra dashboard de pré-cadastros
2. Clique "Novo Pré-Cadastro"
3. Selecione membro
4. Clique "Criar"
5. Verifique se mensagem foi enviada
6. Teste webhook de status (opcional)

---

## 🐛 Troubleshooting

### Erro: "Twilio não está configurado"

**Causa:** Variáveis de ambiente faltando

**Solução:**
```bash
# Verifique .env.local
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Se vazio, adicione as variáveis
# Restart do servidor necessário após adicionar
npm run dev
```

### Erro: "Invalid To Number"

**Causa:** Número sem formato correto

**Solução:**
```
❌ 11999999999
❌ (11)99999-9999
✅ +5511999999999
✅ +55 11 99999-9999
```

### Erro: "You have not activated WhatsApp"

**Causa:** WhatsApp Sandbox não configurado

**Solução:**
1. Vá para Console Twilio
2. WhatsApp → Sandbox
3. Siga as instruções de verificação
4. Envie mensagem de teste para o número Twilio

### Erro: "Invalid Auth Token"

**Causa:** Token expirado ou incorreto

**Solução:**
1. Vá para Console Twilio
2. Regenere Auth Token (não delete o antigo antes de atualizar)
3. Atualize `.env.local`
4. Restart servidor

---

## 📚 Recursos Adicionais

- **Twilio Docs**: https://www.twilio.com/docs
- **WhatsApp Setup**: https://www.twilio.com/docs/whatsapp/quickstart/node
- **SMS Setup**: https://www.twilio.com/docs/sms/quickstart/node
- **Webhooks**: https://www.twilio.com/docs/usage/webhooks

---

## 🎓 Próximos Passos

1. ✅ Configurar Twilio (este guia)
2. ✅ Testar envio manual (whatsappLink)
3. ⏳ Ativar envio automático (modificar endpoint)
4. ⏳ Setup webhook de delivery status
5. ⏳ Implementar retry logic
6. ⏳ Analytics & monitoring

---

**Última Atualização**: 31 de janeiro de 2026
**Status**: Documentação para Setup Manual

Pronto para enviar mensagens automáticas! 🚀
