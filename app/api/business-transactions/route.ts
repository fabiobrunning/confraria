import { createClient } from '@/lib/supabase/server'
import { businessTransactionSchema } from '@/lib/schemas'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/business-transactions
 * List all business transactions (with optional filters)
 *
 * Query params:
 * - member_id: Filter by member (transactions where member is from or to)
 * - transaction_type: Filter by type (direct_business, referral, consortium)
 * - start_date: Filter by date (YYYY-MM-DD)
 * - end_date: Filter by date (YYYY-MM-DD)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Note: Admin check would go here if needed for GET
    // Currently allowing all authenticated users to read

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')
    const transactionType = searchParams.get('transaction_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('business_transactions')
      .select(`
        *,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name, phone),
        member_to:profiles!business_transactions_member_to_id_fkey(id, full_name, phone),
        consortium_group:groups(id, name)
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (memberId) {
      query = query.or(`member_from_id.eq.${memberId},member_to_id.eq.${memberId}`)
    }

    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data, error: queryError, count } = await query

    if (queryError) {
      throw queryError
    }

    return NextResponse.json({
      transactions: data,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching business transactions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business-transactions
 * Create a new business transaction
 *
 * Body:
 * {
 *   transaction_type: 'direct_business' | 'referral' | 'consortium',
 *   member_from_id: string (uuid),
 *   member_to_id?: string (uuid) | null,
 *   amount: number,
 *   description: string,
 *   transaction_date?: string (YYYY-MM-DD),
 *   consortium_group_id?: string (uuid) | null,
 *   notes?: string | null
 * }
 */
export async function POST(request: NextRequest) {
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
      .single() as { data: { role: string } | null }

    if (profileData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()

    const validation = businessTransactionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const transactionData = validation.data

    // Verify member_from_id exists
    const { data: memberFrom, error: memberFromError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', transactionData.member_from_id)
      .single()

    if (memberFromError || !memberFrom) {
      return NextResponse.json(
        { error: 'Membro de origem não encontrado' },
        { status: 404 }
      )
    }

    // Verify member_to_id exists (if provided)
    if (transactionData.member_to_id) {
      const { data: memberTo, error: memberToError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', transactionData.member_to_id)
        .single()

      if (memberToError || !memberTo) {
        return NextResponse.json(
          { error: 'Membro de destino não encontrado' },
          { status: 404 }
        )
      }
    }

    // Verify consortium_group_id exists (if provided)
    if (transactionData.consortium_group_id) {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('id', transactionData.consortium_group_id)
        .single()

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Grupo de consórcio não encontrado' },
          { status: 404 }
        )
      }
    }

    // Insert transaction
    const { data: newTransaction, error: insertError } = await supabase
      .from('business_transactions')
      .insert([{
        transaction_type: transactionData.transaction_type,
        member_from_id: transactionData.member_from_id,
        member_to_id: transactionData.member_to_id,
        amount: transactionData.amount,
        description: transactionData.description,
        transaction_date: transactionData.transaction_date || new Date().toISOString().split('T')[0],
        consortium_group_id: transactionData.consortium_group_id,
        notes: transactionData.notes,
      }] as any)
      .select(`
        *,
        member_from:profiles!business_transactions_member_from_id_fkey(id, full_name, phone),
        member_to:profiles!business_transactions_member_to_id_fkey(id, full_name, phone),
        consortium_group:groups(id, name)
      `)
      .single() as { data: any; error: any }

    if (insertError) {
      throw insertError
    }

    return NextResponse.json(
      {
        success: true,
        transaction: newTransaction,
        message: 'Transação registrada com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating business transaction:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
