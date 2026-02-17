import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password'
import * as bcrypt from 'bcrypt'
import { rateLimit } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-response'

/**
 * POST /api/auth/forgot-password
 *
 * Regenerate temporary password for a member who forgot their password
 * Syncs with Supabase Auth and triggers n8n webhook to send WhatsApp message
 */
export async function POST(request: NextRequest) {
  // Rate limit: 3 requests per hour
  const rateLimitResponse = rateLimit(request, 'forgot-password', {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Find profile by phone
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('phone', phone.replace(/\D/g, ''))
      .single()

    const profile = profileData as { id: string; full_name: string; phone: string } | null;

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Membro não encontrado com este telefone' },
        { status: 404 }
      )
    }

    // Check if member has an active pre-registration
    // pre_registration_attempts not in generated types
    const { data: preReg, error: preRegError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select('id, expiration_date')
      .eq('member_id', profile.id)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { id: string; expiration_date: string } | null; error: any }

    if (preRegError || !preReg) {
      return NextResponse.json(
        {
          error: 'Este membro não tem um pré-cadastro ativo. Entre em contato com o administrador.',
        },
        { status: 404 }
      )
    }

    // Generate new temporary password
    const newPassword = generateTemporaryPassword(12)

    // Update password in Supabase Auth using admin client
    // NOTE: Supabase Auth hashes internally — send plaintext here
    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    )

    if (authUpdateError) {
      console.error('Error updating auth password:', authUpdateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha no sistema de autenticação' },
        { status: 500 }
      )
    }

    // Also update hash in pre_registration_attempts table for consistency
    const hashedForDb = await bcrypt.hash(newPassword, 12)
    await (supabase as any)
      .from('pre_registration_attempts')
      .update({
        temporary_password_hash: hashedForDb,
        password_generated_at: new Date().toISOString(),
        send_count: 1,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', preReg.id)

    // Call n8n webhook to send WhatsApp message
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn('N8N_WEBHOOK_URL not configured, skipping webhook')
    } else {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: process.env.NEXT_PUBLIC_APP_URL || 'https://confrariapedrabranca.com.br',
          },
          body: JSON.stringify({
            fullName: profile.full_name,
            phone: profile.phone.replace(/\D/g, ''),
            password: newPassword,
            role: 'member',
            createdAt: new Date().toISOString(),
          }),
        })

        if (!webhookResponse.ok) {
          console.error(
            'Webhook error:',
            webhookResponse.status,
            await webhookResponse.text()
          )
          // Continue anyway - password was still updated in auth
        }
      } catch (webhookError) {
        console.error('Error calling webhook:', webhookError)
        // Continue anyway - password was updated in auth
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Nova senha temporária foi enviada para seu WhatsApp',
        phone: profile.phone,
        name: profile.full_name,
      },
      { status: 200 }
    )
  } catch (error) {
    return apiError(500, 'Erro ao processar solicitação', error)
  }
}
