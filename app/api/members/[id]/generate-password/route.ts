import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'


/**
 * POST /api/members/[id]/generate-password
 *
 * Generate a temporary password for a pre-registered member
 * Only accessible by admins
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: string } | null

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Senha não fornecida' }, { status: 400 })
    }

    // Get member details using admin client to bypass RLS
    const { data: memberData, error: memberError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, phone, pre_registered')
      .eq('id', id)
      .single()

    const member = memberData as { id: string; full_name: string; phone: string; pre_registered: boolean } | null;

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    if (!member.pre_registered) {
      return NextResponse.json(
        { error: 'Este membro já completou o cadastro' },
        { status: 400 }
      )
    }

    // Update member's password in Supabase Auth using admin client
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      id,
      { password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha no sistema de autenticação' },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'member.generate_password',
      entityType: 'profile',
      entityId: id,
      metadata: { member_name: member.full_name },
    })

    return NextResponse.json({
      success: true,
      message: 'Senha gerada com sucesso',
    })
  } catch (error) {
    console.error('Error generating password:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar senha' },
      { status: 500 }
    )
  }
}
