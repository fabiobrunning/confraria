// @ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  createPreRegistrationAttempt,
  listPendingPreRegistrations,
} from '@/lib/pre-registration/server-service';
import { createPreRegistrationSchema } from '@/lib/pre-registration/schemas';
import {
  getMessageTemplate,
  formatPhoneForWhatsApp,
} from '@/lib/pre-registration/message-templates';
import * as bcrypt from 'bcrypt';

/**
 * GET /api/admin/pre-registrations
 * List all pre-registration attempts (with pagination and filters)
 */
export async function GET(request: NextRequest) {
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

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch pending registrations
    const result = await listPendingPreRegistrations(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pre-registrations:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar pré-cadastros',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pre-registrations
 * Create new pre-registration attempt
 */
export async function POST(request: NextRequest) {
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
    const validation = createPreRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { member_id, send_method, notes } = validation.data;

    // Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Create pre-registration attempt
    const result = await createPreRegistrationAttempt(
      member_id,
      session.user.id,
      send_method,
      notes
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update password in Supabase Auth for the member
    // Hash the temporary password for auth
    const saltRounds = 12;
    const hashedForAuth = await bcrypt.hash(result.temporaryPassword!, saltRounds);

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      member_id,
      { password: hashedForAuth }
    );

    if (authUpdateError) {
      console.error('Error syncing password to auth:', authUpdateError);
      return NextResponse.json(
        {
          error: 'Erro ao sincronizar senha com o sistema de autenticação: ' + authUpdateError.message,
          details: 'A senha foi armazenada no banco mas falhou ao sincronizar com o sistema de autenticação'
        },
        { status: 500 }
      );
    }

    // Generate message for display (don't send yet - that's manual for security)
    const message = getMessageTemplate('whatsapp', 'initial', {
      recipientName: member.full_name,
      phone: member.phone,
      password: result.temporaryPassword!,
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
        preRegistrationId: result.attemptId,
        member: {
          id: member.id,
          name: member.full_name,
          phone: member.phone,
        },
        credentials: {
          temporaryPassword: result.temporaryPassword,
          username: member.phone,
          expiresIn: '30 dias',
        },
        message,
        whatsappLink,
        notes: 'Copie a senha acima e envie via WhatsApp ou SMS',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pre-registration:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao criar pré-cadastro',
      },
      { status: 500 }
    );
  }
}
