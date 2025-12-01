import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilePageClient from './ProfilePageClient'

interface Quota {
  id: string
  quota_number: number
  status: string
  group: {
    id: string
    name: string
  } | null
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Se o perfil nao existir, redirecionar para pre-registro
    redirect('/pre-register')
  }

  // Buscar cotas do usuario
  const { data: quotasData } = await supabase
    .from('quotas')
    .select(`
      id,
      quota_number,
      status,
      group:groups (
        id,
        name
      )
    `)
    .eq('member_id', user.id)

  const quotas = (quotasData || []) as unknown as Quota[]

  return (
    <ProfilePageClient
      initialProfile={profile}
      email={user.email || ''}
      quotas={quotas}
    />
  )
}
