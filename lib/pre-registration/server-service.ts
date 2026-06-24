/**
 * Server-side pre-registration service
 * Handles database operations, password hashing, and secure credential generation
 * USE THIS ONLY IN SERVER COMPONENTS, API ROUTES, AND SERVER ACTIONS
 */

import { createClient } from '@/lib/supabase/server';
import { generateTemporaryPassword } from './generate-password';
import bcrypt from 'bcryptjs';

// pre_registration_attempts table is not in generated types yet
type PreRegistrationAttempt = Record<string, unknown>;

/**
 * Create a new pre-registration attempt
 * Generates password, hashes it, and stores in DB
 */
export async function createPreRegistrationAttempt(
  memberId: string,
  createdByAdminId: string,
  sendMethod: 'whatsapp' | 'sms' = 'whatsapp',
  notes?: string,
  preGeneratedPassword?: string
): Promise<{
  success: boolean;
  error?: string;
  attemptId?: string;
  temporaryPassword?: string; // Plain text - return ONLY for immediate sending
}> {
  try {
    const supabase = await createClient();

    // Use pre-generated password (when Auth was synced first) or generate new one
    const plainPassword = preGeneratedPassword || generateTemporaryPassword();

    // Hash password with bcrypt (salt: 12)
    const hashedPassword = await hashPassword(plainPassword);

    // Create attempt record
    // pre_registration_attempts is not in generated types
    const { data, error } = await (supabase as any)
      .from('pre_registration_attempts')
      .insert({
        member_id: memberId,
        created_by_admin_id: createdByAdminId,
        temporary_password_hash: hashedPassword,
        send_method: sendMethod,
        notes: notes || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating pre-registration attempt:', error);
      return {
        success: false,
        error: 'Falha ao criar pré-cadastro: ' + error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Falha ao criar pré-cadastro: resposta vazia',
      };
    }

    return {
      success: true,
      attemptId: data.id,
      temporaryPassword: plainPassword, // Return plain text ONLY here, for immediate use
    };
  } catch (error) {
    console.error('Unexpected error in createPreRegistrationAttempt:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao criar pré-cadastro',
    };
  }
}

/**
 * Get active pre-registration attempt for a member
 * Returns null if expired or not found
 */
export async function getActivePreRegistrationAttempt(
  memberId: string
): Promise<PreRegistrationAttempt | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from('pre_registration_attempts')
      .select('*')
      .eq('member_id', memberId)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected, not an error)
      console.error('Error fetching pre-registration:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Unexpected error in getActivePreRegistrationAttempt:', error);
    return null;
  }
}

/**
 * Resend credentials with a new password
 * Regenerates password, updates hash, increments send_count
 * Returns the new plain password for immediate delivery
 */
export async function resendCredentials(
  preRegistrationId: string,
  sendMethod: 'whatsapp' | 'sms',
  preGeneratedPassword?: string
): Promise<{
  success: boolean;
  error?: string;
  newPassword?: string;
}> {
  try {
    const supabase = await createClient();

    // First, fetch current send_count to increment it
    const { data: current, error: fetchError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select('send_count')
      .eq('id', preRegistrationId)
      .single();

    if (fetchError || !current) {
      return {
        success: false,
        error: 'Pré-registro não encontrado',
      };
    }

    // Use pre-generated password (when Auth was synced first) or generate new one
    const newPassword = preGeneratedPassword || generateTemporaryPassword();
    const hashedPassword = await hashPassword(newPassword);
    const newSendCount = (current.send_count || 0) + 1;

    // Update with new password hash and incremented count
    const { error } = await (supabase as any)
      .from('pre_registration_attempts')
      .update({
        temporary_password_hash: hashedPassword,
        password_generated_at: new Date().toISOString(),
        send_count: newSendCount,
        last_sent_at: new Date().toISOString(),
        send_method: sendMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', preRegistrationId);

    if (error) {
      console.error('Error resending credentials:', error);
      return {
        success: false,
        error: 'Falha ao atualizar envio: ' + error.message,
      };
    }

    return { success: true, newPassword };
  } catch (error) {
    console.error('Unexpected error in resendCredentials:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao reenviar credenciais',
    };
  }
}

/**
 * Regenerate password (create new one)
 */
export async function regeneratePassword(
  preRegistrationId: string,
  _adminId: string,
  sendMethod: 'whatsapp' | 'sms' = 'whatsapp',
  preGeneratedPassword?: string
): Promise<{
  success: boolean;
  error?: string;
  newPassword?: string;
}> {
  try {
    const supabase = await createClient();

    // Use pre-generated password (when Auth was synced first) or generate new one
    const newPassword = preGeneratedPassword || generateTemporaryPassword();
    const hashedPassword = await hashPassword(newPassword);

    // Update record
    const { error } = await (supabase as any)
      .from('pre_registration_attempts')
      .update({
        temporary_password_hash: hashedPassword,
        password_generated_at: new Date().toISOString(),
        send_method: sendMethod,
        send_count: 1, // Reset count for new password
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', preRegistrationId);

    if (error) {
      console.error('Error regenerating password:', error);
      return {
        success: false,
        error: 'Falha ao regenerar senha: ' + error.message,
      };
    }

    return {
      success: true,
      newPassword,
    };
  } catch (error) {
    console.error('Unexpected error in regeneratePassword:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao regenerar senha',
    };
  }
}

/**
 * List pending pre-registrations (not yet completed first access)
 * Includes group name via quotas → groups JOIN
 */
export async function listPendingPreRegistrations(
  page: number = 1,
  limit: number = 20
): Promise<{
  data: (PreRegistrationAttempt & {
    member_name: string;
    member_phone: string;
    group_name: string | null;
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const supabase = await createClient();

    const offset = (page - 1) * limit;

    const { data, count, error } = await (supabase as any)
      .from('pre_registration_attempts')
      .select(
        `*,
        profiles!member_id(
          id,
          full_name,
          phone,
          quotas(group_id, groups(name))
        )`,
        { count: 'exact' }
      )
      .is('first_accessed_at', null)
      .gt('expiration_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing pending registrations:', error);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const results = (data || []).map((item: Record<string, any>) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const quotas: any[] = Array.isArray(profile?.quotas) ? profile.quotas : [];
      const group = quotas[0]?.groups;
      return {
        ...item,
        member_name: profile?.full_name || 'Desconhecido',
        member_phone: profile?.phone || '',
        group_name: group?.name || null,
      };
    });

    const total = count || 0;
    return { data: results, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Unexpected error in listPendingPreRegistrations:', error);
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }
}

/**
 * List ALL members who have never signed in (regardless of pre-registration attempt).
 * Used by the "Membros Pendentes" admin view.
 */
export async function listAllPendingMembers(
  page: number = 1,
  limit: number = 50
): Promise<{
  data: {
    id: string;
    full_name: string;
    phone: string;
    created_at: string;
    group_name: string | null;
    has_pre_registration: boolean;
    pre_reg_id: string | null;
    pre_reg_expires: string | null;
    pre_reg_send_count: number;
    pre_reg_last_sent: string | null;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Fetch profiles with pre_registered=true, joining groups and latest pre_reg attempt
    const { data, count, error } = await (supabase as any)
      .from('profiles')
      .select(
        `id, full_name, phone, created_at,
        quotas(group_id, groups(name)),
        pre_registration_attempts(
          id, expiration_date, send_count, last_sent_at, first_accessed_at
        )`,
        { count: 'exact' }
      )
      .eq('pre_registered', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing all pending members:', error);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const results = (data || [])
      .map((p: Record<string, any>) => {
        const quotas: any[] = Array.isArray(p.quotas) ? p.quotas : [];
        const group = quotas[0]?.groups;

        // Pick the most recent pre-registration attempt
        const attempts: any[] = Array.isArray(p.pre_registration_attempts)
          ? p.pre_registration_attempts
          : [];
        const latestAttempt = attempts
          .filter((a: any) => !a.first_accessed_at)
          .sort((a: any, b: any) =>
            new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()
          )[0] || null;

        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          created_at: p.created_at,
          group_name: group?.name || null,
          has_pre_registration: !!latestAttempt,
          pre_reg_id: latestAttempt?.id || null,
          pre_reg_expires: latestAttempt?.expiration_date || null,
          pre_reg_send_count: latestAttempt?.send_count || 0,
          pre_reg_last_sent: latestAttempt?.last_sent_at || null,
        };
      })
      // Only members who haven't signed in (no completed first access)
      // Incluir todos: sem pré-cadastro (pendente de envio) e com pré-cadastro não acessado
      .filter((m: any) => m !== null);

    const total = count || 0;
    return { data: results, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Unexpected error in listAllPendingMembers:', error);
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }
}

/**
 * Mark first access
 */
export async function markFirstAccess(
  preRegistrationId: string,
  ipAddress?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from('pre_registration_attempts')
      .update({
        first_accessed_at: new Date().toISOString(),
        first_access_from_ip: ipAddress || null,
        access_attempts: 0, // Reset attempts on successful login
        updated_at: new Date().toISOString(),
      })
      .eq('id', preRegistrationId);

    if (error) {
      console.error('Error marking first access:', error);
      return {
        success: false,
        error: 'Falha ao registrar primeiro acesso: ' + error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in markFirstAccess:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao registrar primeiro acesso',
    };
  }
}

/**
 * Increment failed access attempts
 */
export async function incrementFailedAttempts(
  preRegistrationId: string
): Promise<{
  success: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
}> {
  try {
    const supabase = await createClient();

    // Get current attempt count
    const { data: current, error: fetchError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select('access_attempts, max_access_attempts, locked_until')
      .eq('id', preRegistrationId)
      .single();

    if (fetchError || !current) {
      return { success: false, isLocked: false, attemptsRemaining: 0 };
    }

    const newAttempts = (current.access_attempts || 0) + 1;
    const maxAttempts = current.max_access_attempts || 5;
    const isLocked = newAttempts >= maxAttempts;

    // Update with increment
    const updateData: any = {
      access_attempts: newAttempts,
      updated_at: new Date().toISOString(),
    };

    if (isLocked) {
      // Lock for 15 minutes
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.locked_until = lockedUntil.toISOString();
    }

    const { error: updateError } = await (supabase as any)
      .from('pre_registration_attempts')
      .update(updateData)
      .eq('id', preRegistrationId);

    if (updateError) {
      return { success: false, isLocked, attemptsRemaining: 0 };
    }

    return {
      success: true,
      isLocked,
      attemptsRemaining: Math.max(0, maxAttempts - newAttempts),
    };
  } catch (error) {
    console.error('Unexpected error in incrementFailedAttempts:', error);
    return { success: false, isLocked: false, attemptsRemaining: 0 };
  }
}

/**
 * Hash password using bcrypt
 * Secure hashing for production use
 * Cost factor: 12 (balances security and performance)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12;
    const hashed = await bcrypt.hash(password, saltRounds);
    return hashed;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Falha ao processar senha');
  }
}

/**
 * Verify password hash using bcrypt
 * Compares plain text password with bcrypt hash
 */
export async function verifyTemporaryPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
