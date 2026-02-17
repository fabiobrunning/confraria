import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProspectStatus } from '@/lib/supabase/types';

// Verificar se usuario eh admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as { role: string } | null)?.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticacao e permissao
    if (!await isAdmin(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Obter parametros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as ProspectStatus | 'all' | null;
    const search = searchParams.get('search') || '';

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' });

    // Aplicar filtro de status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Aplicar filtro de busca (sanitize PostgREST special chars)
    if (search) {
      const sanitized = search.replace(/[%_().,\\]/g, '');
      if (sanitized) {
        query = query.or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,company_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
      }
    }

    // Ordenar e paginar
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: prospectsRaw, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar prospects:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    const prospects = prospectsRaw || [];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: prospects,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
