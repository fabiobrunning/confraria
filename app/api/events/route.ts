import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logActivity } from '@/lib/activity-log'
import { createEventSchema } from '@/lib/schemas/events'

export const dynamic = 'force-dynamic'

// POST /api/events — Create event (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError(401, 'Não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'admin') return apiError(403, 'Acesso restrito a administradores')

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(400, 'Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const { name, description, date, time, deadline, confirmation_limit } = parsed.data

    // Validate deadline >= event date
    const eventDate = new Date(date)
    const deadlineDate = new Date(deadline)
    if (deadlineDate < eventDate) {
      return apiError(400, 'Deadline deve ser igual ou posterior à data do evento')
    }

    const { data: event, error } = await (supabase
      .from('events' as any) as any)
      .insert({
        name,
        description,
        date,
        time,
        deadline,
        confirmation_limit,
        created_by: user.id,
      })
      .select()
      .single() as { data: { id: string; name: string; [key: string]: unknown } | null; error: unknown }

    if (error) throw error
    if (!event) throw new Error('Falha ao criar evento')

    logActivity({
      userId: user.id,
      action: 'event.create',
      entityType: 'event',
      entityId: event.id,
      metadata: { name, date },
    })

    return apiSuccess(event, 201)
  } catch (error) {
    return apiError(500, 'Erro ao criar evento', error)
  }
}

// GET /api/events — List events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError(401, 'Não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    const isAdmin = profile?.role === 'admin'

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status')
    const offset = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('events' as any) as any)
      .select('*, event_confirmations(confirmed_count)', { count: 'exact' })

    // Members only see active non-deleted (RLS handles this, but be explicit)
    if (!isAdmin) {
      query = query.eq('status', 'active').is('deleted_at', null)
    } else if (status) {
      query = query.eq('status', status)
    }

    const { data: events, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1) as { data: ({ event_confirmations: unknown[]; [key: string]: unknown })[] | null; error: unknown; count: number | null }

    if (error) throw error

    // Calculate total confirmations per event
    const eventsWithCount = events?.map(event => {
      const totalConfirmed = (event.event_confirmations as any[])?.reduce(
        (sum: number, c: any) => sum + c.confirmed_count, 0
      ) || 0
      const { event_confirmations, ...rest } = event
      return { ...rest, total_confirmed: totalConfirmed }
    })

    return apiSuccess({
      events: eventsWithCount,
      pagination: { page, limit, total: count || 0 },
    })
  } catch (error) {
    return apiError(500, 'Erro ao listar eventos', error)
  }
}
