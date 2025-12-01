import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema de validação simplificado - apenas nome e telefone
const preRegisterSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
})

// Verificar se usuário é admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  return (profile as { role: string } | null)?.role === 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação e permissão
    if (!await isAdmin(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores podem cadastrar membros.' },
        { status: 403 }
      )
    }

    // Validar dados do body
    const body = await request.json()
    const validationResult = preRegisterSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verificar se já existe membro com este nome
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', data.full_name)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Já existe um membro com este nome.' },
        { status: 400 }
      )
    }

    // Gerar UUID para o profile
    const userId = crypto.randomUUID()

    // Criar profile na tabela profiles - usando SQL raw para evitar problemas de tipo
    const { error: profileError } = await supabase.rpc('insert_profile_simple', {
      p_id: userId,
      p_full_name: data.full_name,
      p_phone: data.phone,
    })

    // Se a função RPC não existir, tenta insert direto
    if (profileError && profileError.message.includes('function')) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: data.full_name,
          phone: data.phone,
          role: 'member',
        } as never)

      if (insertError) {
        console.error('Erro ao criar profile:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erro ao criar perfil do membro: ' + insertError.message },
          { status: 500 }
        )
      }
    } else if (profileError) {
      console.error('Erro ao criar profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar perfil do membro: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Membro pré-cadastrado com sucesso!',
      memberId: userId,
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no pré-cadastro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
