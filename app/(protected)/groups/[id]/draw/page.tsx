import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrawPageClient from './DrawPageClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DrawPage({ params }: Props) {
  const { id: groupId } = await params
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
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

  // Get available quotas (active, not contemplated)
  const { data: quotas } = await supabase
    .from('quotas')
    .select(
      `
      id,
      quota_number,
      status,
      member:profiles(id, full_name)
    `
    )
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('quota_number')

  // Get existing active draw
  const { data: existingDraw } = await supabase
    .from('draws')
    .select('*')
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .single()

  return (
    <DrawPageClient
      group={group}
      quotas={quotas ?? []}
      existingDraw={existingDraw}
    />
  )
}
