import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DashboardBusinessStats } from './DashboardBusinessStats'
import { PageContainer } from '@/components/layout'
import { GlassCard } from '@/components/ui/glass-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let profileName = ''

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    isAdmin = (profileData as { role: string; full_name: string } | null)?.role === 'admin'
    profileName = (profileData as { role: string; full_name: string } | null)?.full_name || ''
  }

  let stats = { members: 0, companies: 0, groups: 0, activeQuotas: 0 }
  try {
    const [membersRes, companiesRes, groupsRes, quotasRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('groups').select('id', { count: 'exact', head: true }),
      supabase.from('quotas').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    stats = {
      members: membersRes.count ?? 0,
      companies: companiesRes.count ?? 0,
      groups: groupsRes.count ?? 0,
      activeQuotas: quotasRes.count ?? 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }

  const firstName = profileName.split(' ')[0] || 'Membro'

  return (
    <PageContainer>
      {/* Saudação */}
      <div className="mb-8">
        <p className="font-brand text-label uppercase tracking-[0.2em] text-muted-foreground text-xs mb-1">
          Bem-vindo de volta
        </p>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-foreground">
          {firstName}
        </h1>
      </div>

      {/* GlassCards de stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/members">
          <GlassCard
            label="Membros"
            value={String(stats.members)}
            sub="Total de membros"
          />
        </Link>
        <Link href="/companies">
          <GlassCard
            label="Empresas"
            value={String(stats.companies)}
            sub="Cadastradas"
          />
        </Link>
        <Link href="/groups">
          <GlassCard
            label="Grupos"
            value={String(stats.groups)}
            sub="de Consórcio"
          />
        </Link>
        <GlassCard
          label="Cotas Ativas"
          value={String(stats.activeQuotas)}
          sub="Em andamento"
          accent
        />
      </div>

      {/* Business Transactions Stats (Admin only) */}
      {isAdmin && <DashboardBusinessStats />}
    </PageContainer>
  )
}
