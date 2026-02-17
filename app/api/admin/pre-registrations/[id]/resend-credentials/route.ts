import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { resendCredentials } from '@/lib/pre-registration/server-service';
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password';
import {
  getMessageTemplate,
  formatPhoneForWhatsApp,
} from '@/lib/pre-registration/message-templates';
import { resendCredentialsSchema } from '@/lib/pre-registration/schemas';
import { apiError } from '@/lib/api-response';

/**
 * POST /api/admin/pre-registrations/[id]/resend-credentials
 * Resend the same temporary password to the member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = resendCredentialsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { send_method } = validation.data;
    const preRegistrationId = params.id;

    // Fetch pre-registration attempt
    const { data: attempt, error: fetchError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select(
        `
        id,
        member_id,
        temporary_password_hash,
        password_generated_at,
        expiration_date,
        first_accessed_at,
        profiles!member_id(id, full_name, phone)
      `
      )
      .eq('id', preRegistrationId)
      .single();

    if (fetchError || !attempt) {
      return NextResponse.json(
        { error: 'Pré-registro não encontrado' },
        { status: 404 }
      );
    }

    // Check if already accessed
    if (attempt.first_accessed_at) {
      return NextResponse.json(
        {
          error: 'Membro já fez o primeiro acesso. Use regenerar senha ao invés.',
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(attempt.expiration_date) < new Date()) {
      return NextResponse.json(
        { error: 'Pré-registro expirado. Gere um novo.' },
        { status: 400 }
      );
    }

    // Get member info for message
    const member = (Array.isArray(attempt.profiles)
      ? attempt.profiles[0]
      : attempt.profiles) as { id: string; full_name: string; phone: string } | null;

    if (!member) {
      return NextResponse.json(
        { error: 'Dados do membro não encontrados' },
        { status: 404 }
      );
    }

    // Generate new password and sync to Auth FIRST (avoid race condition)
    const newPassword = generateTemporaryPassword(12);
    const adminSupabase = createAdminClient();

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      attempt.member_id,
      { password: newPassword }
    );

    if (authUpdateError) {
      console.error('Error syncing password to auth:', authUpdateError);
      return apiError(500, 'Erro ao sincronizar senha com o sistema de autenticação');
    }

    // Auth synced — now update DB record
    const result = await resendCredentials(preRegistrationId, send_method, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Generate message for display
    const message = getMessageTemplate(send_method, 'reminder', {
      recipientName: member.full_name,
      phone: member.phone,
      password: newPassword,
      expiresIn: '30 dias',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://confraria.app',
    });

    // Create WhatsApp link for manual sending
    const whatsappLink =
      send_method === 'whatsapp'
        ? `https://wa.me/${formatPhoneForWhatsApp(member.phone)}?text=${encodeURIComponent(message)}`
        : null;

    return NextResponse.json(
      {
        success: true,
        preRegistrationId,
        member: {
          id: member.id,
          name: member.full_name,
          phone: member.phone,
        },
        credentials: {
          temporaryPassword: newPassword,
          username: member.phone,
          expiresIn: '30 dias',
        },
        message,
        whatsappLink,
        notes: 'Nova senha gerada e reenviada. Copie a mensagem acima e envie ao membro.',
      },
      { status: 200 }
    );
  } catch (error) {
    return apiError(500, 'Erro ao reenviar credenciais', error);
  }
}
