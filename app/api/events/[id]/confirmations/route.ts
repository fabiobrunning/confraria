import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET /api/events/{id}/confirmations — List confirmations (admin only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError(401, 'Não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'admin') return apiError(403, 'Acesso restrito a administradores')

    // Verify event exists
    const { data: event } = await supabase
      .from('events' as any)
      .select('id, name')
      .eq('id', eventId)
      .single() as { data: { id: string; name: string } | null }

    if (!event) return apiError(404, 'Evento não encontrado')

    const { data: confirmations, error } = await supabase
      .from('event_confirmations' as any)
      .select('id, user_phone, confirmed_count, confirmed_at, created_at')
      .eq('event_id', eventId)
      .order('confirmed_at', { ascending: true }) as { data: { id: string; user_phone: string; confirmed_count: number; confirmed_at: string; created_at: string }[] | null; error: unknown }

    if (error) throw error

    return apiSuccess({ confirmations })
  } catch (error) {
    return apiError(500, 'Erro ao listar confirmações', error)
  }
}
