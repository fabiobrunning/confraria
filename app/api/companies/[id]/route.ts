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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticacao
    if (!await isAuthenticated(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Buscar empresa com membros vinculados
    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Empresa nao encontrada' },
          { status: 404 }
        );
      }
      console.error('Erro ao buscar empresa:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    const company = data as unknown as CompanyWithMembers;

    // Formatar dados
    const memberCompanies = company.member_companies || [];
    const formattedCompany = {
      ...company,
      members_count: memberCompanies.length,
      members: memberCompanies
        .filter((mc) => mc.profiles !== null)
        .map((mc) => mc.profiles)
    };

    return NextResponse.json({
      success: true,
      data: formattedCompany
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

    // Verificar se eh admin
    if (!await isAdmin(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar campos obrigatorios
    if (body.name !== undefined && (!body.name || body.name.trim() === '')) {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa e obrigatorio' },
        { status: 400 }
      );
    }

    const companyData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    // Apenas incluir campos que foram enviados
    if (body.name !== undefined) companyData.name = body.name.trim();
    if (body.description !== undefined) companyData.description = body.description?.trim() || null;
    if (body.cnpj !== undefined) companyData.cnpj = body.cnpj?.trim() || null;
    if (body.phone !== undefined) companyData.phone = body.phone?.trim() || null;
    if (body.instagram !== undefined) companyData.instagram = body.instagram?.trim() || null;
    if (body.address_street !== undefined) companyData.address_street = body.address_street?.trim() || null;
    if (body.address_number !== undefined) companyData.address_number = body.address_number?.trim() || null;
    if (body.address_complement !== undefined) companyData.address_complement = body.address_complement?.trim() || null;
    if (body.address_neighborhood !== undefined) companyData.address_neighborhood = body.address_neighborhood?.trim() || null;
    if (body.address_city !== undefined) companyData.address_city = body.address_city?.trim() || null;
    if (body.address_state !== undefined) companyData.address_state = body.address_state?.trim() || null;
    if (body.address_cep !== undefined) companyData.address_cep = body.address_cep?.trim() || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedCompany, error } = await (supabase as any)
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Empresa nao encontrada' },
          { status: 404 }
        );
      }
      console.error('Erro ao atualizar empresa:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: 'Empresa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar se eh admin
    if (!await isAdmin(supabase)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Primeiro, deletar vinculos com membros
    await supabase
      .from('member_companies')
      .delete()
      .eq('company_id', id);

    // Depois, deletar a empresa
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar empresa:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
