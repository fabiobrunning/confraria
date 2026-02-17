import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { regeneratePassword } from '@/lib/pre-registration/server-service';
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password';
import {
  getMessageTemplate,
  formatPhoneForWhatsApp,
} from '@/lib/pre-registration/message-templates';
import { regeneratePasswordSchema } from '@/lib/pre-registration/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { apiError } from '@/lib/api-response';

/**
 * POST /api/admin/pre-registrations/[id]/regenerate-password
 * Generate a new temporary password and update the pre-registration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit: 10 requests per hour
  const rateLimitResponse = rateLimit(request, 'regenerate-password', {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = regeneratePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { send_method } = validation.data;
    const preRegistrationId = params.id;

    // Fetch pre-registration attempt
    const { data: attemptData, error: fetchError } = await (supabase as any)
      .from('pre_registration_attempts')
      .select(
        `
        id,
        member_id,
        expiration_date,
        profiles!member_id(id, full_name, phone)
      `
      )
      .eq('id', preRegistrationId)
      .single();

    const attempt = attemptData as {
      id: string;
      member_id: string;
      expiration_date: string;
      profiles: { id: string; full_name: string; phone: string } | { id: string; full_name: string; phone: string }[];
    } | null;

    if (fetchError || !attempt) {
      return NextResponse.json(
        { error: 'Pré-registro não encontrado' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(attempt.expiration_date) < new Date()) {
      return NextResponse.json(
        { error: 'Pré-registro expirado. Crie um novo pré-cadastro.' },
        { status: 400 }
      );
    }

    // Generate password and sync to Auth FIRST (avoid race condition)
    const newPassword = generateTemporaryPassword(12);

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      attempt.member_id,
      { password: newPassword }
    );

    if (authUpdateError) {
      console.error('Error updating auth password:', authUpdateError);
      return apiError(500, 'Erro ao atualizar senha no sistema de autenticação');
    }

    // Auth synced — now update DB record with the same password
    const result = await regeneratePassword(
      preRegistrationId,
      user.id,
      send_method,
      newPassword
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
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

    // Generate message for display
    const message = getMessageTemplate('whatsapp', 'reset', {
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
        notes: 'Nova senha gerada com sucesso. Copie a mensagem acima e envie ao membro via WhatsApp ou SMS.',
      },
      { status: 200 }
    );
  } catch (error) {
    return apiError(500, 'Erro ao regenerar senha', error);
  }
}
