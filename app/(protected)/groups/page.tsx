import { createClient } from '@/lib/supabase/server'
import GroupsPageClient from './GroupsPageClient'

interface Group {
  id: string
  name: string
  description: string | null
  asset_value: number
  total_quotas: number
  monthly_value: number
  is_active: boolean
}

export default async function GroupsPage() {
  const supabase = await createClient()

  // Get user role
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user?.id ?? '')
    .single()

  const profile = profileData as { role: string } | null

  // Get groups
  const { data: groupsRaw } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  const groupsData = groupsRaw as Group[] | null

  // Get quota counts for each group
  const groupsWithQuotas = await Promise.all(
    (groupsData ?? []).map(async (group) => {
      const { data: quotasRaw } = await supabase
        .from('quotas')
        .select('status')
        .eq('group_id', group.id)

      const quotasData = quotasRaw as Array<{ status: string }> | null

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
