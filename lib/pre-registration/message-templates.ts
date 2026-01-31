/**
 * Message templates for pre-registration notifications
 * Supports WhatsApp and SMS formats
 */

export interface MessageTemplateContext {
  recipientName: string;
  phone: string;
  password: string;
  expiresIn?: string; // e.g., "30 dias"
  appUrl?: string; // e.g., "https://confraria.app"
}

/**
 * WhatsApp message template for initial credentials
 */
export function getWhatsAppInitialCredentialsMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `Olá ${context.recipientName}! 👋

Bem-vindo à Confraria Pedra Branca!

Suas credenciais de acesso foram geradas:

👤 *Usuário:* ${context.phone}
🔐 *Senha temporária:* ${context.password}

📱 Acesse: ${appUrl}/login

⏳ Válido por ${context.expiresIn || '30 dias'}

*Importante:* Este é seu primeiro acesso. Você precisará definir uma nova senha permanente.

Dúvidas? Entre em contato com a Confraria.`;
}

/**
 * SMS message template for initial credentials (compact)
 */
export function getSMSInitialCredentialsMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `Confraria Pedra Branca
Usuario: ${context.phone}
Senha: ${context.password}
Link: ${appUrl}/login
Valido por ${context.expiresIn || '30 dias'}`;
}

/**
 * WhatsApp reminder message (resend)
 */
export function getWhatsAppReminderMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `Olá ${context.recipientName}! 📬

Estamos reenviando suas credenciais de acesso:

👤 *Usuário:* ${context.phone}
🔐 *Senha temporária:* ${context.password}

📱 Acesse agora: ${appUrl}/login

Não recebeu nosso primeiro contato? Aqui estão seus dados novamente!

Qualquer dúvida, é só chamar. 😊`;
}

/**
 * SMS reminder message (compact)
 */
export function getSMSReminderMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `[Confraria] Credentials resend
Usuario: ${context.phone}
Senha: ${context.password}
${appUrl}/login`;
}

/**
 * WhatsApp message for password regeneration
 */
export function getWhatsAppPasswordResetMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `Olá ${context.recipientName}! 🔄

Uma nova senha foi gerada para sua conta.

👤 *Usuário:* ${context.phone}
🔐 *Nova senha:* ${context.password}

📱 Use esta nova senha em: ${appUrl}/login

⏳ Válido por ${context.expiresIn || '30 dias'}

Se você não solicitou essa alteração, verifique com a Confraria.`;
}

/**
 * SMS message for password regeneration
 */
export function getSMSPasswordResetMessage(
  context: MessageTemplateContext
): string {
  const appUrl = context.appUrl || 'https://confraria.app';

  return `[Confraria] Nova senha
Usuario: ${context.phone}
Nova senha: ${context.password}
${appUrl}/login`;
}

/**
 * Get appropriate message template based on method and type
 */
export function getMessageTemplate(
  sendMethod: 'whatsapp' | 'sms',
  messageType: 'initial' | 'reminder' | 'reset',
  context: MessageTemplateContext
): string {
  if (sendMethod === 'whatsapp') {
    switch (messageType) {
      case 'initial':
        return getWhatsAppInitialCredentialsMessage(context);
      case 'reminder':
        return getWhatsAppReminderMessage(context);
      case 'reset':
        return getWhatsAppPasswordResetMessage(context);
    }
  } else if (sendMethod === 'sms') {
    switch (messageType) {
      case 'initial':
        return getSMSInitialCredentialsMessage(context);
      case 'reminder':
        return getSMSReminderMessage(context);
      case 'reset':
        return getSMSPasswordResetMessage(context);
    }
  }

  // Fallback
  return getWhatsAppInitialCredentialsMessage(context);
}

/**
 * Format phone number for WhatsApp link
 * Input: "11 99999-9999" or "+5511999999999"
 * Output: "5511999999999" (WhatsApp format)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-().+]/g, '');

  // Remove leading 0 if present (common in Brazil)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Add country code if not present
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

/**
 * Create WhatsApp link with pre-filled message
 * Note: This is for manual sending. Real implementation uses Twilio
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
