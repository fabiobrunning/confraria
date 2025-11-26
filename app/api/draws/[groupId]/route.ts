import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch current draw state and available quotas for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active draw (not deleted) for this group
    const { data: draw } = await supabase
      .from('draws')
      .select('*')
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .single()

    // Get available quotas (active, not contemplated)
    const { data: availableQuotas } = await supabase
      .from('quotas')
      .select(
        `
        id,
        quota_number,
        status,
        member:profiles(id, full_name)
      `
      )
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('quota_number')

    // Get group info
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    return NextResponse.json({
      draw,
      availableQuotas: availableQuotas ?? [],
      group,
    })
  } catch (error) {
    console.error('Error fetching draw data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete (reset) the current draw
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete the current draw
    const { error } = await supabase
      .from('draws')
      .update({ deleted_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .is('deleted_at', null)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting draw:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
