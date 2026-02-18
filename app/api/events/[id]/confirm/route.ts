import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { rateLimit } from '@/lib/rate-limit'
import { confirmAttendanceSchema } from '@/lib/schemas/events'

export const dynamic = 'force-dynamic'

// POST /api/events/{id}/confirm — Confirm attendance (public with phone validation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 10 per minute per IP
    const rateLimited = rateLimit(request, 'event-confirm', {
      maxRequests: 10,
      windowMs: 60 * 1000,
    })
    if (rateLimited) return rateLimited

    const { id: eventId } = await params
    const adminSupabase = createAdminClient()

    const body = await request.json()
    const parsed = confirmAttendanceSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(400, 'Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const { user_phone, confirmed_count } = parsed.data

    // Normalize phone for lookup: (11) 99999-9999 → 11999999999
    const normalizedPhone = user_phone.replace(/\D/g, '')

    // Validate phone exists in profiles
    const { data: profileMatch } = await adminSupabase
      .from('profiles')
      .select('id, full_name, phone')
      .is('deleted_at', null)
      .or(`phone.eq.${user_phone},phone.eq.${normalizedPhone}`)
      .limit(1)
      .single()

    if (!profileMatch) {
      return apiError(400, 'Número não encontrado. Verifique se está cadastrado.')
    }

    // Validate event exists, is active, and deadline not passed
    const { data: event } = await adminSupabase
      .from('events' as any)
      .select('id, name, deadline, confirmation_limit, status')
      .eq('id', eventId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (!event) return apiError(404, 'Evento não encontrado')

    if (new Date(event.deadline) < new Date()) {
      return apiError(400, 'O prazo para confirmação já expirou')
    }

    // Check current total confirmations vs limit
    const { data: currentConfirmations } = await adminSupabase
      .from('event_confirmations' as any)
      .select('confirmed_count')
      .eq('event_id', eventId)

    const currentTotal = currentConfirmations?.reduce(
      (sum, c) => sum + c.confirmed_count, 0
    ) || 0

    // Check if user already confirmed (for upsert logic)
    const { data: existing } = await adminSupabase
      .from('event_confirmations' as any)
      .select('id, confirmed_count')
      .eq('event_id', eventId)
      .eq('user_phone', user_phone)
      .single()

    const additionalPeople = existing
      ? confirmed_count - existing.confirmed_count
      : confirmed_count

    if (currentTotal + additionalPeople > event.confirmation_limit) {
      return apiError(400, `Limite de ${event.confirmation_limit} confirmações atingido`)
    }

    // Upsert: update if exists, insert if new
    if (existing) {
      const { data: updated, error } = await adminSupabase
        .from('event_confirmations' as any)
        .update({
          confirmed_count,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return apiSuccess({
        confirmation: updated,
        user_name: profileMatch.full_name,
        total_confirmed: currentTotal + additionalPeople,
      })
    }

    const { data: confirmation, error } = await adminSupabase
      .from('event_confirmations' as any)
      .insert({
        event_id: eventId,
        user_phone,
        confirmed_count,
      })
      .select()
      .single()

    if (error) throw error

    return apiSuccess({
      confirmation,
      user_name: profileMatch.full_name,
      total_confirmed: currentTotal + confirmed_count,
    }, 201)
  } catch (error) {
    return apiError(500, 'Erro ao confirmar presença', error)
  }
}
