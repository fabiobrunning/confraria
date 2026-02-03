import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password'
import * as bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profileData = profile as { role: string } | null

    if (profileData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Generate secure temporary password using crypto-safe method
    const tempPassword = generateTemporaryPassword(12)

    // Hash the password for auth update
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds)

    // Update user password using admin client with SERVICE_ROLE_KEY
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: hashedPassword
    })

    if (error) {
      console.error('Erro ao resetar senha:', error)
      return NextResponse.json(
        { error: 'Erro ao resetar senha: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Senha temporária gerada com sucesso. Compartilhe com o usuário de forma segura.'
    })

  } catch (error) {
    console.error('Error in resend-password API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
