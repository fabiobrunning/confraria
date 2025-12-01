import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MemberProfile {
  id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
}

interface MemberCompanyWithProfile {
  id: string;
  member_id: string;
  profiles: MemberProfile | null;
}

interface CompanyWithMembers {
  id: string;
  name: string;
  description: string | null;
  cnpj: string | null;
  phone: string | null;
  instagram: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_cep: string | null;
  created_at: string;
  updated_at: string;
  member_companies: MemberCompanyWithProfile[];
}

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

// Verificar se usuario esta autenticado
async function isAuthenticated(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticacao
    if (!await isAuthenticated(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Obter parametros de query
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Buscar empresas com contagem de membros
    let query = supabase
      .from('companies')
      .select(`
        *,
        member_companies (
          id,
          member_id,
          profiles:member_id (
            id,
            full_name,
            phone,
            instagram
          )
        )
      `)
      .order('name', { ascending: true });

    // Aplicar filtro de busca
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    const companies = (data || []) as unknown as CompanyWithMembers[];

    // Formatar dados para incluir contagem de membros
    const formattedCompanies = companies.map(company => {
      const memberCompanies = company.member_companies || [];
      return {
        ...company,
        members_count: memberCompanies.length,
        members: memberCompanies
          .filter((mc) => mc.profiles !== null)
          .map((mc) => mc.profiles)
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedCompanies,
      total: formattedCompanies.length
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar se eh admin
    if (!await isAdmin(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar campos obrigatorios
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa e obrigatorio' },
        { status: 400 }
      );
    }

    const companyData = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      cnpj: body.cnpj?.trim() || null,
      phone: body.phone?.trim() || null,
      instagram: body.instagram?.trim() || null,
      address_street: body.address_street?.trim() || null,
      address_number: body.address_number?.trim() || null,
      address_complement: body.address_complement?.trim() || null,
      address_neighborhood: body.address_neighborhood?.trim() || null,
      address_city: body.address_city?.trim() || null,
      address_state: body.address_state?.trim() || null,
      address_cep: body.address_cep?.trim() || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: company, error } = await (supabase as any)
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar empresa:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Empresa criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
