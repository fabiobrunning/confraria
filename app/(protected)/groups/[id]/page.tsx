import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupDetailClient from './GroupDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { id: groupId } = await params
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/groups')
  }

  // Get group
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) {
    notFound()
  }

  // Get quotas with member info
  const { data: quotas } = await supabase
    .from('quotas')
    .select(
      `
      id,
      quota_number,
      status,
      member_id,
      member:profiles(id, full_name)
    `
    )
    .eq('group_id', groupId)
    .order('quota_number')

  // Get all members for dropdown
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  // Get active quotas count for draw eligibility
  const activeQuotasCount = quotas?.filter((q) => q.status === 'active').length ?? 0

  return (
    <GroupDetailClient
      group={group}
      quotas={quotas ?? []}
      members={members ?? []}
      activeQuotasCount={activeQuotasCount}
    />
  )
}
