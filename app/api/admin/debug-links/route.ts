import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar sessao e se eh admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Nao autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar todas as empresas
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name');

    if (compError) {
      return NextResponse.json({ success: false, error: compError.message }, { status: 500 });
    }

    // Buscar todos os membros
    const { data: members, error: membError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (membError) {
      return NextResponse.json({ success: false, error: membError.message }, { status: 500 });
    }

    // Buscar todos os vinculos
    const { data: links, error: linkError } = await supabase
      .from('member_companies')
      .select('id, member_id, company_id');

    if (linkError) {
      return NextResponse.json({ success: false, error: linkError.message }, { status: 500 });
    }

    // Tipos
    type CompanyData = { id: string; name: string };
    type MemberData = { id: string; full_name: string };
    type LinkData = { id: string; member_id: string; company_id: string };

    const companyList = (companies || []) as CompanyData[];
    const memberList = (members || []) as MemberData[];
    const linkList = (links || []) as LinkData[];

    // Mapear vinculos com nomes
    const linksWithNames = linkList.map((link) => {
      const member = memberList.find((m) => m.id === link.member_id);
      const company = companyList.find((c) => c.id === link.company_id);
      return {
        ...link,
        member_name: member?.full_name || 'Desconhecido',
        company_name: company?.name || 'Desconhecida'
      };
    });

    // Empresas sem vinculos
    const companiesWithoutLinks = companyList.filter(
      (c) => !linkList.some((l) => l.company_id === c.id)
    );

    return NextResponse.json({
      success: true,
      data: {
        companies,
        members,
        links: linksWithNames,
        companiesWithoutLinks
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar vinculo entre empresa e membro
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar sessao e se eh admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Nao autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { member_id, company_id } = body;

    if (!member_id || !company_id) {
      return NextResponse.json({
        success: false,
        error: 'member_id e company_id sao obrigatorios'
      }, { status: 400 });
    }

    // Verificar se vinculo ja existe
    const { data: existing } = await supabase
      .from('member_companies')
      .select('id')
      .eq('member_id', member_id)
      .eq('company_id', company_id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Vinculo ja existe'
      }, { status: 400 });
    }

    // Criar vinculo
    const { data: link, error } = await (supabase as any)
      .from('member_companies')
      .insert({ member_id, company_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: link,
      message: 'Vinculo criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
