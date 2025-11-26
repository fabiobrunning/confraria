import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ExecuteDrawRequest {
  drawnNumbers: number[]
  winningNumber: number
  winnerPosition: number
}

// POST - Execute and save a draw
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body: ExecuteDrawRequest = await request.json()
    const { drawnNumbers, winningNumber, winnerPosition } = body

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

    // Validate at least 1 number drawn
    if (!drawnNumbers || drawnNumbers.length < 1) {
      return NextResponse.json(
        { error: 'At least 1 number must be drawn before saving' },
        { status: 400 }
      )
    }

    // Validate winner position
    if (winnerPosition < 1) {
      return NextResponse.json(
        { error: 'Winner position must be at least 1' },
        { status: 400 }
      )
    }

    // Find the winning quota
    const { data: winningQuota } = await supabase
      .from('quotas')
      .select('id, member_id, status')
      .eq('group_id', groupId)
      .eq('quota_number', winningNumber)
      .single()

    if (!winningQuota) {
      return NextResponse.json(
        { error: 'Winning quota not found' },
        { status: 400 }
      )
    }

    if (winningQuota.status === 'contemplated') {
      return NextResponse.json(
        { error: 'Quota already contemplated' },
        { status: 400 }
      )
    }

    // Start transaction: soft delete existing draw, create new, update quota

    // 1. Soft delete any existing active draw for this group
    await supabase
      .from('draws')
      .update({ deleted_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .is('deleted_at', null)

    // 2. Create new draw record
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        group_id: groupId,
        winning_quota_id: winningQuota.id,
        winning_number: winningNumber,
        drawn_numbers: drawnNumbers,
        winner_position: winnerPosition,
      })
      .select()
      .single()

    if (drawError) {
      console.error('Error creating draw:', drawError)
      throw drawError
    }

    // 3. Update the winning quota to contemplated
    const { error: quotaError } = await supabase
      .from('quotas')
      .update({ status: 'contemplated' })
      .eq('id', winningQuota.id)

    if (quotaError) {
      console.error('Error updating quota:', quotaError)
      throw quotaError
    }

    // 4. Check if all quotas are now contemplated -> deactivate group
    const { count: activeCount } = await supabase
      .from('quotas')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'active')

    let groupClosed = false
    if (activeCount === 0) {
      await supabase
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId)
      groupClosed = true
    }

    return NextResponse.json({
      success: true,
      draw,
      quotaUpdated: true,
      groupClosed,
      remainingQuotas: activeCount ?? 0,
    })
  } catch (error) {
    console.error('Error executing draw:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
