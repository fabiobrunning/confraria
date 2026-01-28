'use client'

import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { DashboardStatsCards } from '@/components/business-transactions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardBusinessStats() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (!stats || stats.summary.total_transactions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações de Negócios</CardTitle>
          <CardDescription>
            Ainda não há transações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Comece a registrar negócios diretos, indicações e transações de consórcio para
            visualizar estatísticas aqui.
          </p>
          <Button asChild>
            <Link href="/business-transactions">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para Transações
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { recent_transactions, monthly_evolution } = stats

  // Get last month's data for comparison
  const lastMonth = monthly_evolution[0]
  const previousMonth = monthly_evolution[1]

  const monthlyGrowth =
    lastMonth && previousMonth && previousMonth.total_value > 0
      ? ((lastMonth.total_value - previousMonth.total_value) / previousMonth.total_value) * 100
      : 0

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transações de Negócios</h2>
          <p className="text-muted-foreground">
            Visão geral dos negócios movimentados pela confraria
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/business-transactions">
            Ver Todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} isLoading={false} />

      {/* Recent Transactions & Growth */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Growth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crescimento Mensal
            </CardTitle>
            <CardDescription>
              Comparação com o mês anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastMonth ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Este mês</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(lastMonth.total_value)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastMonth.transaction_count} transações
                  </p>
                </div>
                {previousMonth && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mês anterior</p>
                    <p className="text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(previousMonth.total_value)}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-semibold ${
                      monthlyGrowth >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {monthlyGrowth >= 0 ? '+' : ''}
                    {monthlyGrowth.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">vs. mês anterior</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Dados insuficientes para comparação
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas 5 transações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.member_from?.full_name} →{' '}
                      {transaction.transaction_type === 'consortium'
                        ? transaction.consortium_group?.name
                        : transaction.member_to?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
