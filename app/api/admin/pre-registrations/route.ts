import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  createPreRegistrationAttempt,
  listPendingPreRegistrations,
} from '@/lib/pre-registration/server-service';
import { createPreRegistrationSchema } from '@/lib/pre-registration/schemas';
import { generateTemporaryPassword } from '@/lib/pre-registration/generate-password';
import {
  getMessageTemplate,
  formatPhoneForWhatsApp,
} from '@/lib/pre-registration/message-templates';
import { rateLimit } from '@/lib/rate-limit';
import { apiError } from '@/lib/api-response';

/**
 * GET /api/admin/pre-registrations
 * List all pre-registration attempts (with pagination and filters)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch pending registrations
    const result = await listPendingPreRegistrations(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    return apiError(500, 'Erro ao buscar pré-cadastros', error);
  }
}

/**
 * POST /api/admin/pre-registrations
 * Create new pre-registration attempt
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per hour
  const rateLimitResponse = rateLimit(request, 'pre-register', {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();

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
    const validation = createPreRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { member_id, send_method, notes } = validation.data;

    // Verify member exists
    const { data: memberData, error: memberError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', member_id)
      .single();

    const member = memberData as { id: string; full_name: string; phone: string } | null;

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Generate password and sync to Auth FIRST (avoid race condition)
    // If Auth fails, no orphan record is left in the DB
    const temporaryPassword = generateTemporaryPassword(12);
    const adminSupabase = createAdminClient();

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      member_id,
      { password: temporaryPassword }
    );

    if (authUpdateError) {
      console.error('Error syncing password to auth:', authUpdateError);
      return apiError(500, 'Erro ao sincronizar senha com o sistema de autenticação');
    }

    // Auth synced — now create pre-registration record with the same password
    const result = await createPreRegistrationAttempt(
      member_id,
      user.id,
      send_method,
      notes,
      temporaryPassword
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Generate message for display (don't send yet - that's manual for security)
    const message = getMessageTemplate('whatsapp', 'initial', {
      recipientName: member.full_name,
      phone: member.phone,
      password: temporaryPassword,
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
          temporaryPassword,
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
    return apiError(500, 'Erro ao criar pré-cadastro', error);
  }
}
