import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET /api/events/{id}/export — Export confirmations as CSV (admin only)
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
      .single()

    if (profile?.role !== 'admin') return apiError(403, 'Acesso restrito a administradores')

    // Verify event exists
    const { data: event } = await supabase
      .from('events' as any)
      .select('id, name')
      .eq('id', eventId)
      .single()

    if (!event) return apiError(404, 'Evento não encontrado')

    // Use admin client to get confirmations with profile names
    const adminSupabase = createAdminClient()
    const { data: confirmations, error } = await adminSupabase
      .from('event_confirmations' as any)
      .select('user_phone, confirmed_count, confirmed_at')
      .eq('event_id', eventId)
      .order('confirmed_at', { ascending: true })

    if (error) throw error

    // Lookup names from profiles
    const phones = confirmations?.map(c => c.user_phone) || []
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('phone, full_name')
      .in('phone', phones)

    const phoneToName = new Map(
      profiles?.map(p => [p.phone, p.full_name]) || []
    )

    // Build CSV
    const header = 'Nome,WhatsApp,Quantidade,Data Confirmação'
    const rows = confirmations?.map(c => {
      const name = phoneToName.get(c.user_phone) || 'Desconhecido'
      const date = new Date(c.confirmed_at).toLocaleString('pt-BR')
      return `"${name}","${c.user_phone}",${c.confirmed_count},"${date}"`
    }) || []

    const csv = [header, ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${eventId}-confirmations.csv"`,
      },
    })
  } catch (error) {
    return apiError(500, 'Erro ao exportar confirmações', error)
  }
}
