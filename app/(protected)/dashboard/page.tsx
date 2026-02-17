import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Layers, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { DashboardBusinessStats } from './DashboardBusinessStats'
import { PageContainer, PageHeader } from '@/components/layout'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  href: string | null
}

function StatCard({ title, value, icon, color, href }: StatCardProps) {
  const content = (
    <Card
      className={`hover:shadow-lg transition-all ${
        href ? 'cursor-pointer hover:scale-105' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user - use getUser() for JWT validation (more secure than getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    isAdmin = (profileData as { role: string } | null)?.role === 'admin'
  }

  // Fetch stats in parallel with error handling
  let stats = { members: 0, companies: 0, groups: 0, activeQuotas: 0 }
  try {
    const [membersRes, companiesRes, groupsRes, quotasRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('groups').select('id', { count: 'exact', head: true }),
      supabase
        .from('quotas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
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

  const statCards = [
    {
      title: 'Total de Membros',
      value: stats.members,
      icon: <Users className="h-5 w-5" />,
      color: 'text-primary',
      href: '/members',
    },
    {
      title: 'Empresas Cadastradas',
      value: stats.companies,
      icon: <Building2 className="h-5 w-5" />,
      color: 'text-primary',
      href: '/companies',
    },
    {
      title: 'Grupos de Consorcio',
      value: stats.groups,
      icon: <Layers className="h-5 w-5" />,
      color: 'text-success',
      href: '/groups',
    },
    {
      title: 'Cotas Ativas',
      value: stats.activeQuotas,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-primary',
      href: null,
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de consórcios"
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            href={stat.href}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este e o sistema de gestao de consorcios da Confraria Pedra Branca.
            Use o menu lateral para navegar entre as diferentes secoes do
            sistema.
          </p>
        </CardContent>
      </Card>

      {/* Business Transactions Stats (Admin only) */}
      {isAdmin && <DashboardBusinessStats />}
    </PageContainer>
  )
}
