import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessTransactionsClient from './BusinessTransactionsClient'

export const metadata = {
  title: 'Transações de Negócios | Confraria Pedra Branca',
  description: 'Gerencie negócios diretos, indicações e transações de consórcio',
}

export default async function BusinessTransactionsPage() {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as { role: string } | null
  const isAdmin = profile?.role === 'admin'

  // Fetch members (for form select)
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .order('full_name', { ascending: true })

  // Fetch groups (for form select)
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="p-8">
      <BusinessTransactionsClient
        members={members || []}
        groups={groups || []}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
