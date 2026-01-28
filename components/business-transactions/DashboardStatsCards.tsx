'use client'

import { DashboardStats } from '@/hooks/use-dashboard-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

interface DashboardStatsCardsProps {
  stats: DashboardStats | undefined
  isLoading?: boolean
}

export function DashboardStatsCards({ stats, isLoading }: DashboardStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const { summary, by_type } = stats

  // Calculate percentages for each type
  const directBusinessPercent =
    by_type.find((t) => t.type === 'direct_business')?.percentage || 0
  const referralPercent = by_type.find((t) => t.type === 'referral')?.percentage || 0
  const consortiumPercent = by_type.find((t) => t.type === 'consortium')?.percentage || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Value Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total Movimentado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(summary.total_value)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Todas as transações registradas
          </p>
        </CardContent>
      </Card>

      {/* Total Transactions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_transactions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ticket médio:{' '}
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(summary.average_transaction_value)}
          </p>
        </CardContent>
      </Card>

      {/* Direct Business Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Negócios Diretos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short',
            }).format(by_type.find((t) => t.type === 'direct_business')?.total_value || 0)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {directBusinessPercent.toFixed(1)}%
            </Badge>
            <p className="text-xs text-muted-foreground">
              {by_type.find((t) => t.type === 'direct_business')?.transaction_count || 0}{' '}
              transações
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Indicações</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short',
            }).format(by_type.find((t) => t.type === 'referral')?.total_value || 0)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {referralPercent.toFixed(1)}%
            </Badge>
            <p className="text-xs text-muted-foreground">
              {by_type.find((t) => t.type === 'referral')?.transaction_count || 0} indicações
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
