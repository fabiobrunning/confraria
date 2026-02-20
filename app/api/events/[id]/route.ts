import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logActivity } from '@/lib/activity-log'
import { updateEventSchema } from '@/lib/schemas/events'

export const dynamic = 'force-dynamic'

// GET /api/events/{id} — Get event details (public-friendly via admin client)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminSupabase = createAdminClient()

    // Use admin client so public/unauthenticated users can see event info
    const { data: event, error } = await adminSupabase
      .from('events' as any)
      .select('id, name, description, date, time, deadline, confirmation_limit, status, created_at')
      .eq('id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single() as { data: { id: string; name: string; description: string | null; date: string; time: string | null; deadline: string; confirmation_limit: number | null; status: string; created_at: string } | null; error: unknown }

    if (error || !event) return apiError(404, 'Evento não encontrado')

    // Get total confirmed count
    const { data: confirmations } = await adminSupabase
      .from('event_confirmations')
      .select('confirmed_count')
      .eq('event_id', id)

    const total_confirmed = confirmations?.reduce(
      (sum, c) => sum + c.confirmed_count, 0
    ) || 0

    return apiSuccess({
      ...event,
      total_confirmed,
    })
  } catch (error) {
    return apiError(500, 'Erro ao buscar evento', error)
  }
}

// PUT /api/events/{id} — Update event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(400, 'Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    // Validate deadline >= date if both provided
    if (parsed.data.date && parsed.data.deadline) {
      const eventDate = new Date(parsed.data.date)
      const deadlineDate = new Date(parsed.data.deadline)
      if (deadlineDate < eventDate) {
        return apiError(400, 'Deadline deve ser igual ou posterior à data do evento')
      }
    }

    const { data: event, error } = await (supabase
      .from('events' as any) as any)
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single() as { data: Record<string, unknown> | null; error: { code?: string; message?: string } | null }

    if (error) {
      if (error.code === 'PGRST116') return apiError(404, 'Evento não encontrado')
      throw error
    }

    logActivity({
      userId: user.id,
      action: 'event.update',
      entityType: 'event',
      entityId: id,
      metadata: parsed.data,
    })

    return apiSuccess(event)
  } catch (error) {
    return apiError(500, 'Erro ao atualizar evento', error)
  }
}

// DELETE /api/events/{id} — Cancel event (soft delete, admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError(401, 'Não autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'admin') return apiError(403, 'Acesso restrito a administradores')

    const { error } = await (supabase
      .from('events' as any) as any)
      .update({ status: 'cancelled', deleted_at: new Date().toISOString() })
      .eq('id', id) as { error: { code?: string; message?: string } | null }

    if (error) {
      if (error.code === 'PGRST116') return apiError(404, 'Evento não encontrado')
      throw error
    }

    logActivity({
      userId: user.id,
      action: 'event.cancel',
      entityType: 'event',
      entityId: id,
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    return apiError(500, 'Erro ao cancelar evento', error)
  }
}
