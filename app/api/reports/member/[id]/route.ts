import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-response'

/**
 * GET /api/reports/member/[id]
 * Get detailed business report for a specific member
 *
 * Returns:
 * - member: Member profile information
 * - statistics: Aggregated stats (total given, received, referrals)
 * - transactions: All transactions involving the member
 * - by_type: Breakdown by transaction type
 * - timeline: Monthly evolution for this member
 *
 * Auth: Admin can view any member, members can only view their own
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const memberId = params.id

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profile = profileData as { role: string } | null

    // Authorization: Admin can view any member, members can only view themselves
    if (profile?.role !== 'admin' && session.user.id !== memberId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own report' },
        { status: 403 }
      )
    }

    // 1. Get member profile
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, instagram')
      .eq('id', memberId)
      .single() as { data: any; error: any }

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 2. Get member statistics using PostgreSQL function
    const { data: statsData, error: statsError } = await supabase.rpc(
      'get_member_business_stats',
      { member_uuid: memberId } as any
    ) as { data: any[] | null; error: any }

    if (statsError) {
      console.error('Error fetching member stats:', statsError)
    }

    // statsData is an array with one row, extract it
    const stats = statsData && Array.isArray(statsData) && statsData.length > 0 ? statsData[0] : null

    // 3. Get all transactions involving this member (given)
    const { data: transactionsGiven, error: givenError } = await supabase
      .from('business_transactions')
      .select(`
        *,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name, phone),
        member_to:profiles!business_transactions_member_to_id_fkey(id, full_name, phone),
        consortium_group:groups(id, name)
      `)
      .eq('member_from_id', memberId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

    if (givenError) {
      console.error('Error fetching transactions given:', givenError)
    }

    // 4. Get all transactions involving this member (received)
    const { data: transactionsReceived, error: receivedError } = await supabase
      .from('business_transactions')
      .select(`
        *,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name, phone),
        member_to:profiles!business_transactions_member_to_id_fkey(id, full_name, phone),
        consortium_group:groups(id, name)
      `)
      .eq('member_to_id', memberId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

    if (receivedError) {
      console.error('Error fetching transactions received:', receivedError)
    }

    // Combine and sort all transactions
    const allTransactions = [
      ...(transactionsGiven || []),
      ...(transactionsReceived || []),
    ].sort((a, b) => {
      // Sort by transaction_date descending, then by created_at descending
      if (a.transaction_date !== b.transaction_date) {
        return b.transaction_date.localeCompare(a.transaction_date)
      }
      return b.created_at.localeCompare(a.created_at)
    })

    // 5. Calculate breakdown by transaction type
    const byType = allTransactions.reduce((acc: any[], transaction: any) => {
      const existingType = acc.find(
        (t) => t.type === transaction.transaction_type
      )

      const isGiver = transaction.member_from_id === memberId
      const amount = transaction.amount

      if (existingType) {
        if (isGiver) {
          existingType.total_given += amount
          existingType.count_given += 1
        } else {
          existingType.total_received += amount
          existingType.count_received += 1
        }
      } else {
        acc.push({
          type: transaction.transaction_type,
          total_given: isGiver ? amount : 0,
          total_received: isGiver ? 0 : amount,
          count_given: isGiver ? 1 : 0,
          count_received: isGiver ? 0 : 1,
        })
      }

      return acc
    }, [])

    // 6. Calculate monthly timeline for this member (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0]

    const recentTransactions = allTransactions.filter(
      (t) => t.transaction_date >= twelveMonthsAgoStr
    )

    // Group by month
    const monthlyTimeline = recentTransactions.reduce((acc: any[], transaction: any) => {
      const month = transaction.transaction_date.substring(0, 7) // YYYY-MM

      const existingMonth = acc.find((m) => m.month === month)

      const isGiver = transaction.member_from_id === memberId
      const amount = transaction.amount

      if (existingMonth) {
        if (isGiver) {
          existingMonth.total_given += amount
          existingMonth.count_given += 1
        } else {
          existingMonth.total_received += amount
          existingMonth.count_received += 1
        }
      } else {
        acc.push({
          month,
          total_given: isGiver ? amount : 0,
          total_received: isGiver ? 0 : amount,
          count_given: isGiver ? 1 : 0,
          count_received: isGiver ? 0 : 1,
        })
      }

      return acc
    }, []).sort((a: any, b: any) => b.month.localeCompare(a.month))

    // Format response
    const report = {
      member: {
        id: member.id,
        full_name: member.full_name,
        phone: member.phone,
        role: member.role,
        instagram: member.instagram,
      },
      statistics: {
        total_given: parseFloat(stats?.total_given || 0),
        total_received: parseFloat(stats?.total_received || 0),
        net_balance: parseFloat(stats?.total_received || 0) - parseFloat(stats?.total_given || 0),
        total_transactions: parseInt(stats?.total_transactions || 0),
        referrals_given: parseInt(stats?.referrals_given || 0),
        referrals_received: parseInt(stats?.referrals_received || 0),
      },
      transactions: allTransactions.map((t) => ({
        ...t,
        direction: t.member_from_id === memberId ? 'given' : 'received',
      })),
      by_type: byType.map((item) => ({
        type: item.type,
        total_given: parseFloat(item.total_given || 0),
        total_received: parseFloat(item.total_received || 0),
        count_given: item.count_given,
        count_received: item.count_received,
      })),
      monthly_timeline: monthlyTimeline.map((item) => ({
        month: item.month,
        total_given: parseFloat(item.total_given || 0),
        total_received: parseFloat(item.total_received || 0),
        count_given: item.count_given,
        count_received: item.count_received,
        net: parseFloat(item.total_received || 0) - parseFloat(item.total_given || 0),
      })),
    }

    return NextResponse.json(report)
  } catch (error) {
    return apiError(500, 'Erro ao buscar relatório do membro', error)
  }
}
