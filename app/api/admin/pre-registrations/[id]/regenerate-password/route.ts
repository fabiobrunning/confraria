import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { regeneratePassword } from '@/lib/pre-registration/server-service';
import {
  getMessageTemplate,
  formatPhoneForWhatsApp,
} from '@/lib/pre-registration/message-templates';
import { regeneratePasswordSchema } from '@/lib/pre-registration/schemas';

/**
 * POST /api/admin/pre-registrations/[id]/regenerate-password
 * Generate a new temporary password and update the pre-registration
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

    if ((profile as any)?.role !== 'admin') {
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
    const { data: attempt, error: fetchError } = await supabase
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

    // Regenerate password
    const result = await regeneratePassword(
      preRegistrationId,
      session.user.id,
      send_method
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Get member info for message
    const member = Array.isArray(attempt.profiles)
      ? attempt.profiles[0]
      : attempt.profiles;

    if (!member) {
      return NextResponse.json(
        { error: 'Dados do membro não encontrados' },
        { status: 404 }
      );
    }

    // Generate message for display
    const message = getMessageTemplate('whatsapp', 'reset', {
      recipientName: (member as any).full_name,
      phone: (member as any).phone,
      password: result.newPassword!,
      expiresIn: '30 dias',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://confraria.app',
    });

    // Create WhatsApp link for manual sending
    const whatsappLink =
      send_method === 'whatsapp'
        ? `https://wa.me/${formatPhoneForWhatsApp((member as any).phone)}?text=${encodeURIComponent(message)}`
        : null;

    return NextResponse.json(
      {
        success: true,
        preRegistrationId,
        member: {
          id: (member as any).id,
          name: (member as any).full_name,
          phone: (member as any).phone,
        },
        credentials: {
          newTemporaryPassword: result.newPassword,
          username: (member as any).phone,
          expiresIn: '30 dias',
        },
        message,
        whatsappLink,
        notes: 'Nova senha gerada com sucesso. Envie ao membro via WhatsApp ou SMS.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error regenerating password:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao regenerar senha',
      },
      { status: 500 }
    );
  }
}
