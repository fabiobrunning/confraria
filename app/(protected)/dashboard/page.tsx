import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DashboardBusinessStats } from './DashboardBusinessStats'
import { PageContainer } from '@/components/layout'
import { GlassCard } from '@/components/ui/glass-card'
import { DrawHistoryRow } from '@/components/ui/draw-history-row'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let profileName = ''
  let memberData: {
    groupName: string | null
    quotaNumber: number | null
    monthlyValue: string | null
    totalValue: string | null
    nextDrawDate: string | null
  } = { groupName: null, quotaNumber: null, monthlyValue: null, totalValue: null, nextDrawDate: null }
  let draws: { id: string; reference_month: string; winning_number: number; winner_name: string; contemplation_type?: string }[] = []
  let adminStats = { members: 0, companies: 0, groups: 0, activeQuotas: 0 }

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    isAdmin = (profileData as any)?.role === 'admin'
    profileName = (profileData as any)?.full_name || ''

    // Buscar quota + grupo do membro
    const { data: quotaData } = await supabase
      .from('quotas')
      .select('quota_number, status, groups(id, name, monthly_value, asset_value)')
      .eq('member_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (quotaData) {
      const group = (quotaData as any)?.groups

      // Buscar próximo sorteio do grupo
      const { data: nextDraw } = await supabase
        .from('draws')
        .select('draw_date')
        .eq('group_id', group?.id)
        .eq('status', 'scheduled')
        .order('draw_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      memberData = {
        groupName: group?.name || null,
        quotaNumber: (quotaData as any)?.quota_number || null,
        monthlyValue: group?.monthly_value ? `R$ ${Number(group.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
        totalValue: group?.asset_value ? `R$ ${Number(group.asset_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
        nextDrawDate: (nextDraw as any)?.draw_date
          ? new Date((nextDraw as any).draw_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          : null,
      }

      if (group?.id) {
        const { data: drawData } = await supabase
          .from('draws')
          .select('id, reference_month, winning_number, winner_name, contemplation_type')
          .eq('group_id', group.id)
          .eq('status', 'completed')
          .order('reference_month', { ascending: false })
          .limit(12)
        draws = (drawData as any[]) || []
      }
    }

    if (isAdmin) {
      const [membersRes, companiesRes, groupsRes, quotasRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('quotas').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      adminStats = {
        members: membersRes.count ?? 0,
        companies: companiesRes.count ?? 0,
        groups: groupsRes.count ?? 0,
        activeQuotas: quotasRes.count ?? 0,
      }
    }
  }

  const firstName = profileName.split(' ')[0] || 'Membro'

  return (
    <PageContainer>
      {/* Saudação */}
      <div className="mb-10">
        <p className="font-brand text-label uppercase tracking-[0.2em] text-muted-foreground text-xs mb-1">
          Bem-vindo de volta
        </p>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-foreground">
          {firstName}
        </h1>
      </div>

      {/* Cards do membro */}
      {(memberData.groupName || memberData.nextDrawDate || memberData.monthlyValue) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {memberData.groupName && (
            <Link href="/groups">
              <GlassCard
                label="Meu Grupo"
                value={memberData.groupName}
                sub={memberData.quotaNumber ? `Cota #${memberData.quotaNumber}` : undefined}
              />
            </Link>
          )}
          {memberData.nextDrawDate ? (
            <GlassCard
              label="Próximo Sorteio"
              value={memberData.nextDrawDate}
              sub="Data prevista"
            />
          ) : (
            <GlassCard
              label="Próximo Sorteio"
              value="A definir"
              sub="Acompanhe as novidades"
            />
          )}
          {memberData.monthlyValue && (
            <GlassCard
              label="Parcela Atual"
              value={memberData.monthlyValue}
              sub={memberData.totalValue ? `Bem: ${memberData.totalValue}` : undefined}
              accent
            />
          )}
        </div>
      )}

      {/* Admin stats (admin only) */}
      {isAdmin && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
          <Link href="/members">
            <GlassCard label="Membros" value={String(adminStats.members)} sub="Total cadastrados" />
          </Link>
          <Link href="/companies">
            <GlassCard label="Empresas" value={String(adminStats.companies)} sub="Cadastradas" />
          </Link>
          <Link href="/groups">
            <GlassCard label="Grupos" value={String(adminStats.groups)} sub="de Consórcio" />
          </Link>
          <GlassCard label="Cotas Ativas" value={String(adminStats.activeQuotas)} sub="Em andamento" accent />
        </div>
      )}

      {/* Histórico de sorteios */}
      {draws.length > 0 && (
        <section>
          <h2 className="font-brand text-label uppercase tracking-[0.2em] text-muted-foreground text-xs mb-4">
            Histórico — {memberData.groupName}
          </h2>
          <div className="space-y-0 border border-white/[0.06] rounded-xl overflow-hidden">
            {draws.map((draw) => (
              <DrawHistoryRow
                key={draw.id}
                referenceMonth={new Date(draw.reference_month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()}
                winningNumber={draw.winning_number}
                winnerName={draw.winner_name}
                contemplationType={draw.contemplation_type === 'transfer' ? 'transfer' : 'normal'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Business Transactions Stats (Admin only) */}
      {isAdmin && <DashboardBusinessStats />}
    </PageContainer>
  )
}
