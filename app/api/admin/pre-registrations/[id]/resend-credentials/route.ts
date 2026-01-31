import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { resendCredentials } from '@/lib/pre-registration/server-service';
import { getMessageTemplate } from '@/lib/pre-registration/message-templates';
import { resendCredentialsSchema } from '@/lib/pre-registration/schemas';

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

    if ((profile as any)?.role !== 'admin') {
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
    const { data: attempt, error: fetchError } = await supabase
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

    // Update attempt (increment send count, update timestamp)
    const result = await resendCredentials(preRegistrationId, send_method);

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

    // Note: We don't return the actual password (it's hashed)
    // But we can show the message template for reference
    const message = getMessageTemplate('whatsapp', 'reminder', {
      recipientName: (member as any).full_name,
      phone: (member as any).phone,
      password: '****' + (member as any).phone.slice(-4), // Masked for security
      expiresIn: '30 dias',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://confraria.app',
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Credenciais reenviadas com sucesso. Atualize send_count e last_sent_at no banco.',
        member: {
          id: (member as any).id,
          name: (member as any).full_name,
          phone: (member as any).phone,
        },
        notes:
          'A senha não é exibida por segurança. Verifique o banco de dados para o hash.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resending credentials:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao reenviar credenciais',
      },
      { status: 500 }
    );
  }
}
