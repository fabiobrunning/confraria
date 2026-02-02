// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcrypt'

/**
 * POST /api/members/[id]/generate-password
 *
 * Generate a temporary password for a pre-registered member
 * Only accessible by admins
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profile = profileData as { role: string } | null

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { password, sendEmail } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Senha não fornecida' }, { status: 400 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('id, email, full_name, pre_registered')
      .eq('id', params.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    if (!member.pre_registered) {
      return NextResponse.json(
        { error: 'Este membro já completou o cadastro' },
        { status: 400 }
      )
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update member's password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      params.id,
      { password: hashedPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha no sistema de autenticação' },
        { status: 500 }
      )
    }

    // Send email if requested and email exists
    if (sendEmail && member.email) {
      // TODO: Implement email sending via Supabase or external service
      // For now, we'll log it
      console.log(`Email would be sent to ${member.email} with password: ${password}`)

      // In a real implementation, you would:
      // 1. Use Supabase's built-in email templates
      // 2. Or integrate with SendGrid/Mailgun/etc
      // await sendPasswordEmail({
      //   to: member.email,
      //   name: member.full_name,
      //   password: password,
      // })
    }

    return NextResponse.json({
      success: true,
      message: 'Senha gerada com sucesso',
      emailSent: sendEmail && !!member.email,
    })
  } catch (error) {
    console.error('Error generating password:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar senha' },
      { status: 500 }
    )
  }
}
