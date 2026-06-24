import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { listAllPendingMembers } from '@/lib/pre-registration/server-service'
import { apiError } from '@/lib/api-response'

/**
 * GET /api/admin/pending-members
 * Retorna todos os membros que nunca fizeram login (pre_registered=true),
 * com grupo e status de pré-cadastro.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listAllPendingMembers(page, limit)
    return NextResponse.json(result)
  } catch (error) {
    return apiError(500, 'Erro ao buscar membros pendentes', error)
  }
}
