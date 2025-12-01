import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilePageClient from './ProfilePageClient'

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

  return (
    <ProfilePageClient
      initialProfile={profile}
      email={user.email || ''}
    />
  )
}
