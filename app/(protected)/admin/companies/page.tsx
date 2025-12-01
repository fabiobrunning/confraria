import { createClient } from '@/lib/supabase/server';
import { CompaniesClient } from '@/components/companies';
import type { Company, CompanyMember } from '@/components/companies';

interface MemberCompanyRow {
  id: string;
  member_id: string;
  profiles: {
    id: string;
    full_name: string;
    phone: string;
    instagram: string | null;
  } | null;
}

interface CompanyRow {
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
  member_companies: MemberCompanyRow[];
}

export default async function CompaniesPage() {
  const supabase = await createClient();

  // Verificar sessao
  const { data: { session } } = await supabase.auth.getSession();

  // Buscar perfil do usuario para verificar se e admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user.id || '')
    .single();

  const isAdmin = (profile as { role: string } | null)?.role === 'admin';

  // Buscar empresas com membros vinculados
  const { data: companiesData, error } = await supabase
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

  if (error) {
    console.error('Erro ao buscar empresas:', error);
  }

  // Formatar dados para o componente cliente
  const companies: Company[] = ((companiesData || []) as CompanyRow[]).map((company) => {
    const memberCompanies = company.member_companies || [];
    const members: CompanyMember[] = memberCompanies
      .filter((mc) => mc.profiles !== null)
      .map((mc) => ({
        id: mc.profiles!.id,
        full_name: mc.profiles!.full_name,
        phone: mc.profiles!.phone,
        instagram: mc.profiles!.instagram,
      }));

    return {
      id: company.id,
      name: company.name,
      description: company.description,
      cnpj: company.cnpj,
      phone: company.phone,
      instagram: company.instagram,
      address_street: company.address_street,
      address_number: company.address_number,
      address_complement: company.address_complement,
      address_neighborhood: company.address_neighborhood,
      address_city: company.address_city,
      address_state: company.address_state,
      address_cep: company.address_cep,
      created_at: company.created_at,
      updated_at: company.updated_at,
      members_count: members.length,
      members,
    };
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-900 min-h-screen">
      <CompaniesClient
        initialCompanies={companies}
        isAdmin={isAdmin}
      />
    </div>
  );
}
