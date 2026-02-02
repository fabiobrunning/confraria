// @ts-nocheck
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProspectStatus, ProspectListResponse, Database } from '@/lib/supabase/types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];

// Verificar se usuario eh admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
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

    // Aplicar filtro de busca
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
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

    // Mapear prospects para incluir full_name
    const prospects = ((prospectsRaw || []) as ProspectRow[]).map(p => ({
      ...p,
      full_name: `${p.first_name} ${p.last_name}`
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: ProspectListResponse = {
      data: prospects,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

    return NextResponse.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
