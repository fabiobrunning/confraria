import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Company {
  id: string
  name: string
}

interface MemberCompany {
  id: string
  company: Company | null
}

interface Group {
  id: string
  name: string
}

interface MemberQuota {
  id: string
  quota_number: number
  status: string
  group: Group | null
}

interface MemberFromDB {
  id: string
  full_name: string
  phone: string
  instagram: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_cep: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
  member_companies: MemberCompany[]
  quotas: MemberQuota[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const preRegistered = searchParams.get('pre_registered')

    // Build query for members with their companies and quotas
    let query = supabase
      .from('profiles')
      .select(`
        *,
        member_companies (
          id,
          company:companies (
            id,
            name
          )
        ),
        quotas (
          id,
          quota_number,
          status,
          group:groups (
            id,
            name
          )
        )
      `, { count: 'exact' })
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply search filter if provided
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    // Filter by pre_registered status
    if (preRegistered === 'true') {
      query = query.eq('pre_registered', true)
    } else if (preRegistered === 'false') {
      query = query.eq('pre_registered', false)
    }

    const { data: members, error, count } = await query

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar membros' },
        { status: 500 }
      )
    }

    // Format response
    const membersData = members as unknown as MemberFromDB[]
    const formattedMembers = membersData?.map(member => ({
      ...member,
      companies: member.member_companies
        ?.map((mc) => mc.company)
        .filter(Boolean) || [],
      quotas: member.quotas
        ?.map((q) => ({
          id: q.id,
          quota_number: q.quota_number,
          status: q.status,
          group: q.group
        }))
        .filter(q => q.group) || []
    }))

    return NextResponse.json({
      data: formattedMembers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in members API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
