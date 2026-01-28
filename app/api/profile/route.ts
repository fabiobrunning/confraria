import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Perfil nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile,
      email: user.email,
    })
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validacao basica
    if (!body.full_name || body.full_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome completo e obrigatorio (minimo 2 caracteres)' },
        { status: 400 }
      )
    }

    if (!body.phone || body.phone.trim().length < 10) {
      return NextResponse.json(
        { error: 'Telefone e obrigatorio (minimo 10 digitos)' },
        { status: 400 }
      )
    }

    // Preparar dados para atualizacao
    const updateData = {
      full_name: body.full_name.trim(),
      phone: body.phone.replace(/\D/g, ''), // Remove caracteres nao numericos
      instagram: body.instagram?.trim() || null,
      address_cep: body.address_cep?.replace(/\D/g, '') || null,
      address_street: body.address_street?.trim() || null,
      address_number: body.address_number?.trim() || null,
      address_complement: body.address_complement?.trim() || null,
      address_neighborhood: body.address_neighborhood?.trim() || null,
      address_city: body.address_city?.trim() || null,
      address_state: body.address_state?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      profile,
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
