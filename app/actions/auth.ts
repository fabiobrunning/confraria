'use server'

import { createClient } from '@/lib/supabase/server'
import { markFirstAccess, incrementFailedAttempts } from '@/lib/pre-registration/server-service'

/**
 * Mark member's first login after pre-registration
 * Called from client after successful Supabase auth
 */
export async function registerFirstLogin(ipAddress?: string) {
  try {
    const supabase = await createClient()

    // Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }

    // Find the pre-registration attempt for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Perfil não encontrado',
      }
    }

    const profileId = (profile as any).id

    // Find active pre-registration
    const { data: preReg } = await supabase
      .from('pre_registration_attempts')
      .select('id')
      .eq('member_id', profileId)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!preReg) {
      // No active pre-registration, but that's okay - user may have been created another way
      return {
        success: true,
        message: 'Login registrado (sem pré-cadastro ativo)',
      }
    }

    // Mark first access
    const preRegId = (preReg as any).id
    const result = await markFirstAccess(preRegId, ipAddress)

    return result
  } catch (error) {
    console.error('Error registering first login:', error)
    return {
      success: false,
      error: 'Erro ao registrar primeiro acesso',
    }
  }
}

/**
 * Track failed login attempt
 * Called from client when login fails
 */
export async function trackFailedLogin(phone: string) {
  try {
    const supabase = await createClient()

    // Find profile by phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone.replace(/\D/g, ''))
      .maybeSingle()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Perfil não encontrado',
      }
    }

    const profileId = (profile as any).id

    // Find active pre-registration
    const { data: preReg } = await supabase
      .from('pre_registration_attempts')
      .select('id, max_access_attempts, locked_until')
      .eq('member_id', profileId)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!preReg) {
      return {
        success: false,
        error: 'Pré-registro não encontrado',
      }
    }

    const preRegData = preReg as any

    // Check if already locked
    if (preRegData.locked_until && new Date(preRegData.locked_until) > new Date()) {
      return {
        success: false,
        isLocked: true,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      }
    }

    // Increment failed attempts
    const result = await incrementFailedAttempts(preRegData.id)

    return result
  } catch (error) {
    console.error('Error tracking failed login:', error)
    return {
      success: false,
      error: 'Erro ao registrar tentativa',
    }
  }
}
