import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/pre-registrations/[id]
 * Get details of a specific pre-registration attempt
 */
export async function GET(
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

    // Fetch pre-registration attempt with member details
    const { data: attempt, error } = await supabase
      .from('pre_registration_attempts')
      .select(
        `
        id,
        member_id,
        created_by_admin_id,
        password_generated_at,
        send_method,
        send_count,
        last_sent_at,
        first_accessed_at,
        first_access_from_ip,
        access_attempts,
        max_access_attempts,
        locked_until,
        expiration_date,
        notes,
        created_at,
        updated_at,
        profiles!member_id(id, full_name, phone, role, created_at),
        created_by_profile:profiles!created_by_admin_id(id, full_name)
      `
      )
      .eq('id', params.id)
      .single();

    if (error || !attempt) {
      return NextResponse.json(
        { error: 'Pré-registro não encontrado' },
        { status: 404 }
      );
    }

    // Transform and return
    return NextResponse.json({
      success: true,
      data: {
        id: attempt.id,
        member: Array.isArray(attempt.profiles)
          ? attempt.profiles[0]
          : attempt.profiles,
        createdByAdmin: Array.isArray(attempt.created_by_profile)
          ? attempt.created_by_profile[0]
          : attempt.created_by_profile,
        credentials: {
          sendMethod: attempt.send_method,
          passwordGeneratedAt: attempt.password_generated_at,
          expirationDate: attempt.expiration_date,
          isExpired: new Date(attempt.expiration_date) < new Date(),
        },
        sendHistory: {
          sendCount: attempt.send_count,
          lastSentAt: attempt.last_sent_at,
        },
        accessStatus: {
          firstAccessedAt: attempt.first_accessed_at,
          firstAccessFromIp: attempt.first_access_from_ip,
          hasAccessed: !!attempt.first_accessed_at,
          accessAttempts: attempt.access_attempts,
          maxAccessAttempts: attempt.max_access_attempts,
          isLocked: !!attempt.locked_until,
          lockedUntil: attempt.locked_until,
        },
        metadata: {
          notes: attempt.notes,
          createdAt: attempt.created_at,
          updatedAt: attempt.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching pre-registration details:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar detalhes do pré-registro',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pre-registrations/[id]
 * Update pre-registration (notes, status, etc)
 */
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { notes } = body;

    // Update only notes (other fields shouldn't be updatable)
    const { data: updated, error } = await supabase
      .from('pre_registration_attempts')
      .update({
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: 'Falha ao atualizar pré-registro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating pre-registration:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar pré-registro',
      },
      { status: 500 }
    );
  }
}
