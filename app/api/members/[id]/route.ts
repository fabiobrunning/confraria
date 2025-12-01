import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Fetch member with companies
    const { data: member, error } = await supabase
      .from('profiles')
      .select(`
        *,
        member_companies (
          id,
          company:companies (
            id,
            name,
            cnpj,
            phone,
            instagram
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching member:', error)
      return NextResponse.json(
        { error: 'Membro nao encontrado' },
        { status: 404 }
      )
    }

    // Format response
    interface MemberCompany {
      company: { id: string; name: string; cnpj: string | null; phone: string | null; instagram: string | null } | null
    }
    interface MemberWithCompanies {
      id: string;
      full_name: string;
      phone: string;
      instagram: string | null;
      role: string;
      member_companies: MemberCompany[];
      [key: string]: unknown;
    }
    const typedMember = member as unknown as MemberWithCompanies;
    const formattedMember = {
      ...typedMember,
      companies: typedMember.member_companies
        ?.map((mc) => mc.company)
        .filter(Boolean) || []
    }

    return NextResponse.json({ data: formattedMember })
  } catch (error) {
    console.error('Error in member API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin or updating their own profile
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAdmin = (currentUser as { role: string } | null)?.role === 'admin'
    const isOwnProfile = session.user.id === id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: 'Sem permissao para editar este perfil' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id: _, member_companies, companies, created_at, ...updateData } = body

    // If not admin, prevent role changes
    if (!isAdmin) {
      delete updateData.role
    }

    // Update the profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedMember, error } = await (supabase as any)
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar membro' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedMember })
  } catch (error) {
    console.error('Error in member update API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
