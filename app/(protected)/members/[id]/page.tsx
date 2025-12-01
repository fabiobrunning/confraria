import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberDetails } from './components/MemberDetails'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Company {
  id: string
  name: string
  cnpj: string | null
  phone: string | null
  instagram: string | null
  description: string | null
}

interface MemberCompany {
  id: string
  company: Company | null
}

interface MemberFromDB {
  id: string
  full_name: string
  phone: string
  instagram: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_cep: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
  member_companies: MemberCompany[]
}

async function getMemberData(id: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return null
  }

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const profileData = currentUserProfile as { role: string } | null
  const isAdmin = profileData?.role === 'admin'
  const isOwnProfile = session.user.id === id

  const { data: member, error } = await supabase
    .from('profiles')
    .select(`
      *,
      member_companies (
        id,
        company:companies (
          id,
          name,
          cnpj,
          phone,
          instagram,
          description
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    return null
  }

  const memberData = member as unknown as MemberFromDB

  const formattedMember = {
    id: memberData.id,
    full_name: memberData.full_name,
    phone: memberData.phone,
    instagram: memberData.instagram,
    address_street: memberData.address_street,
    address_number: memberData.address_number,
    address_complement: memberData.address_complement,
    address_neighborhood: memberData.address_neighborhood,
    address_city: memberData.address_city,
    address_state: memberData.address_state,
    address_cep: memberData.address_cep,
    role: memberData.role,
    created_at: memberData.created_at,
    updated_at: memberData.updated_at,
    companies: memberData.member_companies
      ?.map((mc) => mc.company)
      .filter((c): c is Company => c !== null) || []
  }

  return {
    member: formattedMember,
    isAdmin,
    isOwnProfile,
    canEdit: isAdmin || isOwnProfile
  }
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params
  const data = await getMemberData(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="p-4 sm:p-6">
      <MemberDetails
        member={data.member}
        isOwnProfile={data.isOwnProfile}
        canEdit={data.canEdit}
      />
    </div>
  )
}
