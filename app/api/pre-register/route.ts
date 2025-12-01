import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/lib/supabase/types'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Schema de validacao
const preRegisterSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10),
  instagram: z.string().optional().nullable(),
  address_cep: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  send_invite: z.boolean().default(false),
})

// Verificar se usuario eh admin
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

// Gerar senha temporaria aleatoria
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticacao e permissao
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
          error: 'Dados invalidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verificar se email ja existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.email)
      .maybeSingle()

    // Verificar email no auth (se tiver service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let userId: string | null = null
    let tempPassword: string | null = null

    if (serviceRoleKey && supabaseUrl) {
      // Usar admin client para criar usuario no Auth
      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Verificar se email ja existe no Auth
      const { data: users } = await adminClient.auth.admin.listUsers()
      const emailExists = users?.users?.some(u => u.email === data.email)

      if (emailExists || existingUser) {
        return NextResponse.json(
          { success: false, error: 'Ja existe um usuario cadastrado com este email.' },
          { status: 400 }
        )
      }

      tempPassword = generateTempPassword()

      // Criar usuario no Auth
      if (data.send_invite) {
        // Enviar convite por email (usuario define propria senha)
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          data.email,
          {
            data: {
              full_name: data.full_name,
            },
          }
        )

        if (inviteError) {
          console.error('Erro ao enviar convite:', inviteError)
          return NextResponse.json(
            { success: false, error: 'Erro ao enviar convite por email.' },
            { status: 500 }
          )
        }

        userId = inviteData.user?.id || null
        tempPassword = null // Nao mostrar senha se enviou convite
      } else {
        // Criar usuario com senha temporaria
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: data.email,
          password: tempPassword,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            full_name: data.full_name,
          },
        })

        if (createError) {
          console.error('Erro ao criar usuario:', createError)
          return NextResponse.json(
            { success: false, error: 'Erro ao criar usuario no sistema.' },
            { status: 500 }
          )
        }

        userId = newUser.user?.id || null
      }
    } else {
      // Sem service role key - apenas criar profile com ID gerado
      // O usuario precisara se cadastrar manualmente depois

      // Verificar email duplicado pelo menos nos profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', data.full_name)
        .maybeSingle()

      if (existingProfile) {
        return NextResponse.json(
          { success: false, error: 'Ja existe um membro com este nome.' },
          { status: 400 }
        )
      }

      // Gerar UUID para o profile (o usuario associara depois ao fazer signup)
      userId = crypto.randomUUID()
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar ID do usuario.' },
        { status: 500 }
      )
    }

    // Criar profile na tabela profiles
    const profileData: ProfileInsert = {
      id: userId,
      full_name: data.full_name,
      phone: data.phone,
      instagram: data.instagram || null,
      address_cep: data.address_cep || null,
      address_street: data.address_street || null,
      address_number: data.address_number || null,
      address_complement: data.address_complement || null,
      address_neighborhood: data.address_neighborhood || null,
      address_city: data.address_city || null,
      address_state: data.address_state?.toUpperCase() || null,
      role: 'member',
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData as never)

    if (profileError) {
      console.error('Erro ao criar profile:', profileError)

      // Se falhou ao criar profile mas criou usuario no Auth, tentar deletar
      if (serviceRoleKey && supabaseUrl) {
        const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)
        await adminClient.auth.admin.deleteUser(userId)
      }

      return NextResponse.json(
        { success: false, error: 'Erro ao criar perfil do membro.' },
        { status: 500 }
      )
    }

    // Retornar sucesso
    const response: {
      success: boolean
      message: string
      memberId: string
      tempPassword?: string
    } = {
      success: true,
      message: data.send_invite
        ? 'Membro cadastrado! Um email de convite foi enviado.'
        : serviceRoleKey
        ? 'Membro cadastrado com sucesso!'
        : 'Pre-cadastro realizado! O membro precisara completar o cadastro.',
      memberId: userId,
    }

    // Incluir senha temporaria se foi criada e nao enviou convite
    if (tempPassword && !data.send_invite) {
      response.tempPassword = tempPassword
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Erro no pre-cadastro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

// GET - Verificar se email ja existe
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticacao
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email nao informado' },
        { status: 400 }
      )
    }

    // Verificar no Auth se tiver service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let exists = false

    if (serviceRoleKey && supabaseUrl) {
      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { data: users } = await adminClient.auth.admin.listUsers()
      exists = users?.users?.some(u => u.email === email) || false
    }

    return NextResponse.json({
      success: true,
      exists,
    })

  } catch (error) {
    console.error('Erro ao verificar email:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
