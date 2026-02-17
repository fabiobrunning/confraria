import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password'
import bcrypt from 'bcryptjs'

/**
 * POST /api/admin/reset-pending-passwords
 *
 * Reset passwords for ALL pre-registered members who haven't completed
 * their first access. Generates new passwords, syncs to Supabase Auth,
 * and updates pre_registration_attempts table.
 *
 * Returns the list of members with their new temporary passwords
 * so the admin can send them via WhatsApp.
 *
 * Auth: Admin only
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Find all pre-registration attempts that haven't been accessed yet
    // and are not expired
    const { data: pendingAttempts, error: fetchError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select(`
        id,
        member_id,
        expiration_date,
        first_accessed_at,
        profiles!member_id(id, full_name, phone)
      `)
      .is('first_accessed_at', null)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching pending attempts:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar pré-cadastros pendentes' },
        { status: 500 }
      )
    }

    if (!pendingAttempts || pendingAttempts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum pré-cadastro pendente encontrado',
        results: [],
      })
    }

    const results: Array<{
      memberId: string
      memberName: string
      phone: string
      newPassword: string
      status: 'success' | 'error'
      error?: string
    }> = []

    for (const attempt of pendingAttempts) {
      const member = Array.isArray(attempt.profiles)
        ? attempt.profiles[0]
        : attempt.profiles

      if (!member) {
        results.push({
          memberId: attempt.member_id,
          memberName: 'Desconhecido',
          phone: '',
          newPassword: '',
          status: 'error',
          error: 'Perfil do membro não encontrado',
        })
        continue
      }

      try {
        // Generate new password
        const newPassword = generateTemporaryPassword(12)

        // 1. Sync to Supabase Auth (plaintext — Auth hashes internally)
        const { error: authError } = await adminSupabase.auth.admin.updateUserById(
          attempt.member_id,
          { password: newPassword }
        )

        if (authError) {
          results.push({
            memberId: attempt.member_id,
            memberName: member.full_name,
            phone: member.phone,
            newPassword: '',
            status: 'error',
            error: `Auth: ${authError.message}`,
          })
          continue
        }

        // 2. Update hash in pre_registration_attempts
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        const { error: dbError } = await (supabase as any)
          .from('pre_registration_attempts')
          .update({
            temporary_password_hash: hashedPassword,
            password_generated_at: new Date().toISOString(),
            access_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', attempt.id)

        if (dbError) {
          console.error(`DB update error for ${member.full_name}:`, dbError)
          // Auth was updated, password works — just log the DB sync failure
        }

        results.push({
          memberId: attempt.member_id,
          memberName: member.full_name,
          phone: member.phone,
          newPassword,
          status: 'success',
        })
      } catch (err) {
        results.push({
          memberId: attempt.member_id,
          memberName: member.full_name,
          phone: member.phone,
          newPassword: '',
          status: 'error',
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `Senhas resetadas: ${successCount} sucesso, ${errorCount} erro(s)`,
      total: results.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error) {
    console.error('Error in reset-pending-passwords:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
