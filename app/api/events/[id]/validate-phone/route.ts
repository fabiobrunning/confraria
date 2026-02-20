import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/events/{id}/validate-phone?phone=11999999999 — Validate phone for RSVP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = rateLimit(request, 'validate-phone', {
      maxRequests: 20,
      windowMs: 60 * 1000,
    })
    if (rateLimited) return rateLimited

    const { id: eventId } = await params
    const url = new URL(request.url)
    const phone = url.searchParams.get('phone')

    if (!phone) return apiError(400, 'Parâmetro phone é obrigatório')

    const adminSupabase = createAdminClient()

    // Verify event exists and is active
    const { data: event } = await adminSupabase
      .from('events' as any)
      .select('id')
      .eq('id', eventId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single() as { data: { id: string } | null }

    if (!event) return apiError(404, 'Evento não encontrado')

    // Lookup phone in profiles (try both formatted and raw)
    const normalizedPhone = phone.replace(/\D/g, '')
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('full_name, phone')
      .is('deleted_at', null)
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.(${phone.slice(0,2)}) ${phone.slice(2)}`)
      .limit(1)
      .single() as { data: { full_name: string; phone: string } | null }

    if (!profile) {
      return apiSuccess({ valid: false })
    }

    // Check if already confirmed
    const { data: existing } = await adminSupabase
      .from('event_confirmations' as any)
      .select('confirmed_count, confirmed_at')
      .eq('event_id', eventId)
      .eq('user_phone', profile.phone)
      .single() as { data: { confirmed_count: number; confirmed_at: string } | null }

    return apiSuccess({
      valid: true,
      name: profile.full_name,
      phone: profile.phone,
      existing_confirmation: existing || null,
    })
  } catch (error) {
    return apiError(500, 'Erro ao validar telefone', error)
  }
}
