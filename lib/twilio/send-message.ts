/**
 * Serviço para enviar mensagens via Twilio
 * Suporta WhatsApp e SMS
 *
 * Uso:
 * ```typescript
 * import { sendWhatsAppMessage, sendSMSMessage } from '@/lib/twilio/send-message'
 *
 * // Enviar WhatsApp
 * await sendWhatsAppMessage({
 *   to: '+5511999999999',
 *   message: 'Olá, bem-vindo!'
 * })
 *
 * // Enviar SMS
 * await sendSMSMessage({
 *   to: '+5511999999999',
 *   message: 'Olá, bem-vindo!'
 * })
 * ```
 */

import { getTwilioClient, checkTwilioConfiguration, getTwilioWhatsAppNumber, getTwilioSMSNumber } from './client'

interface SendMessageOptions {
  to: string // Número com código país: +55XXXXXXXXXXX
  message: string // Conteúdo da mensagem
  mediaUrl?: string // (WhatsApp only) URL de imagem/vídeo
}

interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envia mensagem via WhatsApp usando Twilio
 *
 * @param options Opções de envio
 * @returns Resultado do envio
 */
export async function sendWhatsAppMessage(
  options: SendMessageOptions
): Promise<SendMessageResult> {
  try {
    // Verifica se Twilio está configurado
    const config = checkTwilioConfiguration()
    if (!config.configured) {
      console.warn('[WhatsApp] ' + config.message)
      return {
        success: false,
        error: 'Twilio não está configurado. Mensagem não foi enviada.',
      }
    }

    const client = getTwilioClient()
    const whatsappNumber = getTwilioWhatsAppNumber()

    // Formata o número: deve ser precedido por 'whatsapp:'
    const toNumber = options.to.startsWith('+') ? options.to : '+' + options.to
    const fromNumber = `whatsapp:${whatsappNumber}`
    const toWhatsApp = `whatsapp:${toNumber}`

    // Envia mensagem
    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: toWhatsApp,
      mediaUrl: options.mediaUrl, // Opcional
    })

    console.log(`[WhatsApp] Mensagem enviada com sucesso: ${message.sid}`)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[WhatsApp] Erro ao enviar mensagem:', errorMessage)

    return {
      success: false,
      error: `Falha ao enviar WhatsApp: ${errorMessage}`,
    }
  }
}

/**
 * Envia mensagem via SMS usando Twilio
 *
 * @param options Opções de envio
 * @returns Resultado do envio
 */
export async function sendSMSMessage(
  options: SendMessageOptions
): Promise<SendMessageResult> {
  try {
    // Verifica se Twilio está configurado
    const config = checkTwilioConfiguration()
    if (!config.configured) {
      console.warn('[SMS] ' + config.message)
      return {
        success: false,
        error: 'Twilio não está configurado. Mensagem não foi enviada.',
      }
    }

    const client = getTwilioClient()
    const smsNumber = getTwilioSMSNumber()

    // Formata o número: deve ser precedido de '+'
    const toNumber = options.to.startsWith('+') ? options.to : '+' + options.to

    // Envia mensagem
    const message = await client.messages.create({
      body: options.message,
      from: smsNumber,
      to: toNumber,
    })

    console.log(`[SMS] Mensagem enviada com sucesso: ${message.sid}`)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[SMS] Erro ao enviar mensagem:', errorMessage)

    return {
      success: false,
      error: `Falha ao enviar SMS: ${errorMessage}`,
    }
  }
}

/**
 * Envia mensagem de pré-cadastro (WhatsApp ou SMS)
 */
export async function sendPreRegistrationMessage(
  phone: string,
  message: string,
  sendMethod: 'whatsapp' | 'sms'
): Promise<SendMessageResult> {
  if (sendMethod === 'whatsapp') {
    return sendWhatsAppMessage({ to: phone, message })
  } else {
    return sendSMSMessage({ to: phone, message })
  }
}

/**
 * Envia várias mensagens (útil para bulk)
 */
export async function sendBulkMessages(
  messages: Array<{ to: string; message: string; method: 'whatsapp' | 'sms' }>
): Promise<SendMessageResult[]> {
  return Promise.all(
    messages.map((msg) => sendPreRegistrationMessage(msg.to, msg.message, msg.method))
  )
}
