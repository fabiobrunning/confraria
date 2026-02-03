import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { SidebarStateSync } from '@/components/SidebarStateSync'

// Prevent static generation for protected routes - they require auth
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
    <div className="member-area dark min-h-screen flex w-full" data-sidebar-state="expanded">
      <SidebarStateSync />
      <Sidebar role={profile?.role ?? null} />
      <main className="flex-1 lg:ml-64 mt-12 lg:mt-0 transition-all duration-300 main-content">
        {children}
      </main>
    </div>
  )
}
