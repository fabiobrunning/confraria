export interface CompanyMember {
  id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
}

export interface Company {
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
  members_count: number;
  members: CompanyMember[];
}

export interface CompanyFormData {
  name: string;
  description: string;
  cnpj: string;
  phone: string;
  instagram: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_cep: string;
}
