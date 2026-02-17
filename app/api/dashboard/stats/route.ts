import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-response'

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for business transactions
 *
 * Returns:
 * - total_value: Total value moved across all transactions
 * - by_type: Breakdown by transaction type (direct_business, referral, consortium)
 * - monthly_evolution: Monthly values for last 12 months
 * - recent_transactions: Latest 10 transactions
 *
 * Auth: Requires admin role
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profile = profileData as { role: string } | null

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // 1. Get total value using PostgreSQL function
    const { data: totalData, error: totalError } = await supabase.rpc(
      'get_total_business_value'
    )

    if (totalError) {
      console.error('Error fetching total value:', totalError)
    }

    // 2. Get value by transaction type using PostgreSQL function
    const { data: byTypeData, error: byTypeError } = await supabase.rpc(
      'get_value_by_transaction_type'
    )

    if (byTypeError) {
      console.error('Error fetching by type:', byTypeError)
    }

    // 3. Get monthly evolution using PostgreSQL function
    const { data: monthlyData, error: monthlyError } = await supabase.rpc(
      'get_monthly_business_evolution'
    )

    if (monthlyError) {
      console.error('Error fetching monthly evolution:', monthlyError)
    }

    // 4. Get recent transactions (last 10)
    const { data: recentTransactions, error: recentError } = await supabase
      .from('business_transactions')
      .select(`
        id,
        transaction_type,
        amount,
        description,
        transaction_date,
        created_at,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name, phone),
        member_to:profiles!business_transactions_member_to_id_fkey(id, full_name, phone),
        consortium_group:groups(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent transactions:', recentError)
    }

    // Note: Count by type is already included in byTypeData from the function

    // 6. Get total transaction count
    const { count: totalCount, error: countTotalError } = await supabase
      .from('business_transactions')
      .select('*', { count: 'exact', head: true })

    if (countTotalError) {
      console.error('Error fetching total count:', countTotalError)
    }

    // 7. Get top members by transaction value (given)
    const { data: topGivers, error: topGiversError } = await supabase
      .from('business_transactions')
      .select(`
        member_from_id,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name),
        amount
      `)
      .order('amount', { ascending: false })
      .limit(5)

    if (topGiversError) {
      console.error('Error fetching top givers:', topGiversError)
    }

    // Aggregate top givers by member
    const topGiversAggregated = topGivers?.reduce((acc: any[], transaction: any) => {
      const existingMember = acc.find(
        (m) => m.member_id === transaction.member_from_id
      )

      if (existingMember) {
        existingMember.total_given += transaction.amount
        existingMember.transaction_count += 1
      } else {
        acc.push({
          member_id: transaction.member_from_id,
          member_name: transaction.member_from?.full_name || 'Unknown',
          total_given: transaction.amount,
          transaction_count: 1,
        })
      }

      return acc
    }, [])
      .sort((a: any, b: any) => b.total_given - a.total_given)
      .slice(0, 5)

    // Format response
    const stats = {
      summary: {
        total_value: totalData || 0,
        total_transactions: totalCount || 0,
        average_transaction_value:
          totalCount && totalCount > 0 ? (totalData || 0) / totalCount : 0,
      },
      by_type: (byTypeData || []).map((item: any) => ({
        type: item.transaction_type,
        total_value: parseFloat(item.total_value || 0),
        transaction_count: parseInt(item.transaction_count || 0),
        percentage:
          totalData && totalData > 0
            ? (parseFloat(item.total_value || 0) / totalData) * 100
            : 0,
      })),
      monthly_evolution: (monthlyData || []).map((item: any) => ({
        month: item.month,
        total_value: parseFloat(item.total_value || 0),
        transaction_count: parseInt(item.transaction_count || 0),
      })),
      recent_transactions: recentTransactions || [],
      top_members: topGiversAggregated || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    return apiError(500, 'Erro ao buscar estatísticas do dashboard', error)
  }
}
