import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as { role: string } | null

  return (
    <div className="min-h-screen flex w-full bg-gray-900">
      <Sidebar role={profile?.role ?? null} />
      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0 bg-gray-900 min-h-screen">{children}</main>
    </div>
  )
}
