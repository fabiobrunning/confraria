/**
 * Cliente Twilio para envio de WhatsApp e SMS
 * Requer variáveis de ambiente:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_NUMBER
 * - TWILIO_SMS_NUMBER
 */

import twilio from 'twilio'

// Verifica se as credenciais estão configuradas
const isTwilioConfigured =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_WHATSAPP_NUMBER &&
  process.env.TWILIO_SMS_NUMBER

let client: twilio.Twilio | null = null

/**
 * Obtém a instância do cliente Twilio
 * @throws Error se as credenciais não estiverem configuradas
 */
export function getTwilioClient(): twilio.Twilio {
  if (!isTwilioConfigured) {
    throw new Error(
      'Twilio não está configurado. Adicione as variáveis de ambiente: ' +
        'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, TWILIO_SMS_NUMBER'
    )
  }

  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }

  return client
}

/**
 * Verifica se o Twilio está configurado
 */
export function checkTwilioConfiguration(): { configured: boolean; message: string } {
  if (!isTwilioConfigured) {
    const missing = []
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID')
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN')
    if (!process.env.TWILIO_WHATSAPP_NUMBER) missing.push('TWILIO_WHATSAPP_NUMBER')
    if (!process.env.TWILIO_SMS_NUMBER) missing.push('TWILIO_SMS_NUMBER')

    return {
      configured: false,
      message: `Twilio não configurado. Variáveis faltando: ${missing.join(', ')}`,
    }
  }

  return {
    configured: true,
    message: 'Twilio está configurado e pronto para usar',
  }
}

/**
 * Obtém o número do Twilio para WhatsApp
 */
export function getTwilioWhatsAppNumber(): string {
  if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    throw new Error('TWILIO_WHATSAPP_NUMBER não configurado')
  }
  return process.env.TWILIO_WHATSAPP_NUMBER
}

/**
 * Obtém o número do Twilio para SMS
 */
export function getTwilioSMSNumber(): string {
  if (!process.env.TWILIO_SMS_NUMBER) {
    throw new Error('TWILIO_SMS_NUMBER não configurado')
  }
  return process.env.TWILIO_SMS_NUMBER
}
