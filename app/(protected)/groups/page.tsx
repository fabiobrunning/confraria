import { createClient } from '@/lib/supabase/server'
import GroupsPageClient from './GroupsPageClient'

export default async function GroupsPage() {
  const supabase = await createClient()

  // Get user role
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user?.id ?? '')
    .single()

  // Get groups
  const { data: groupsData } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  // Get quota counts for each group
  const groupsWithQuotas = await Promise.all(
    (groupsData ?? []).map(async (group) => {
      const { data: quotasData } = await supabase
        .from('quotas')
        .select('status')
        .eq('group_id', group.id)

      return {
        ...group,
        active_quotas:
          quotasData?.filter((q) => q.status === 'active').length ?? 0,
        contemplated_quotas:
          quotasData?.filter((q) => q.status === 'contemplated').length ?? 0,
      }
    })
  )

  return (
    <GroupsPageClient
      groups={groupsWithQuotas}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
