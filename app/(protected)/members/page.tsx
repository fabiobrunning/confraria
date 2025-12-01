import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MembersList } from './components/MembersList'
import { MembersHeader } from './components/MembersHeader'
import { MembersLoading } from './components/MembersLoading'

export const dynamic = 'force-dynamic'

async function getMembersData() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  let isAdmin = false

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profileData = profile as { role: string } | null
    isAdmin = profileData?.role === 'admin'
  }

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  return {
    isAdmin,
    totalMembers: count || 0,
    currentUserId: session?.user.id || null
  }
}

export default async function MembersPage() {
  const { isAdmin, totalMembers, currentUserId } = await getMembersData()

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <MembersHeader isAdmin={isAdmin} totalMembers={totalMembers} />

      <Suspense fallback={<MembersLoading />}>
        <MembersList isAdmin={isAdmin} currentUserId={currentUserId} />
      </Suspense>
    </div>
  )
}
