// @ts-nocheck
// Edge Function para criação do administrador master
// Este arquivo é executado no ambiente Deno do Supabase Edge Functions

import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const phone = '48991836483'
    const password = 'confraria'
    const email = `${phone}@confraria.local`

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone }
    })

    if (authError) throw authError

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Administrador Master',
        phone: phone,
        role: 'admin'
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário master criado com sucesso',
        userId: authData.user.id
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
