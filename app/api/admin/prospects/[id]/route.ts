import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ProspectStatus, Database } from '@/lib/supabase/types';

type ProspectUpdate = Database['public']['Tables']['prospects']['Update'];

// Verificar se usuario eh admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, userId: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    isAdmin: (profile as { role: string } | null)?.role === 'admin',
    userId: user.id
  };
}

// Schema de validacao para update
const updateProspectSchema = z.object({
  status: z.enum(['new', 'contacted', 'in_progress', 'converted', 'rejected']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticacao e permissao
    const adminCheck = await isAdmin(supabase);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Buscar prospect por ID
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar prospect:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Prospect nao encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prospect
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Verificar autenticacao e permissao
    const adminCheck = await isAdmin(supabase);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Validar dados
    const validationResult = updateProspectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados invalidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Buscar prospect atual para verificar mudanca de status
    const { data: currentProspectData } = await supabase
      .from('prospects')
      .select('status')
      .eq('id', id)
      .single();

    const currentProspect = currentProspectData as unknown as { status: ProspectStatus } | null;

    // Preparar dados de atualizacao
    const dataToUpdate: ProspectUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Se mudou para 'contacted' e nao estava antes, registrar data e quem contactou
    if (
      updateData.status === 'contacted' &&
      currentProspect &&
      currentProspect.status === 'new'
    ) {
      dataToUpdate.contacted_at = new Date().toISOString();
      dataToUpdate.contacted_by = adminCheck.userId;
    }

    // Se mudou para 'converted', registrar data de conversao
    if (
      updateData.status === 'converted' &&
      currentProspect &&
      currentProspect.status !== 'converted'
    ) {
      dataToUpdate.converted_at = new Date().toISOString();
    }

    // Atualizar prospect usando type assertion
    const { data: updatedProspect, error } = await (supabase
      .from('prospects') as ReturnType<typeof supabase.from>)
      .update(dataToUpdate as never)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar prospect:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Prospect nao encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProspect,
      message: 'Prospect atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
