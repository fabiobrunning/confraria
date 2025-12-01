import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
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
        { error: 'ID do usuario e obrigatorio' },
        { status: 400 }
      )
    }

    // Gerar senha temporaria
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()

    // Atualizar senha do usuario usando admin API
    // Nota: Isso requer service_role key no servidor
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword
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
      tempPassword,
      message: 'Senha temporaria gerada com sucesso'
    })

  } catch (error) {
    console.error('Error in resend-password API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
