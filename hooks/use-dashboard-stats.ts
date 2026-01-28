import { useQuery } from '@tanstack/react-query'
import { BusinessTransaction } from './use-business-transactions'

/**
 * Types for dashboard statistics
 */
export interface DashboardSummary {
  total_value: number
  total_transactions: number
  average_transaction_value: number
}

export interface TransactionTypeStats {
  type: 'direct_business' | 'referral' | 'consortium'
  total_value: number
  transaction_count: number
  percentage: number
}

export interface MonthlyEvolution {
  month: string // YYYY-MM-DD
  total_value: number
  transaction_count: number
}

export interface TopMember {
  member_id: string
  member_name: string
  total_given: number
  transaction_count: number
}

export interface DashboardStats {
  summary: DashboardSummary
  by_type: TransactionTypeStats[]
  monthly_evolution: MonthlyEvolution[]
  recent_transactions: BusinessTransaction[]
  top_members: TopMember[]
}

/**
 * Hook: useDashboardStats
 * Fetch dashboard statistics for business transactions
 *
 * Returns:
 * - summary: Total value, count, average
 * - by_type: Breakdown by transaction type
 * - monthly_evolution: Last 12 months
 * - recent_transactions: Latest 10 transactions
 * - top_members: Top 5 members by value given
 */
export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao carregar estatísticas do dashboard')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    retry: 2,
  })
}

/**
 * Hook: useDashboardStatsRefresh
 * Same as useDashboardStats but with auto-refresh every 30 seconds
 * Use this on dashboard pages that need real-time updates
 */
export function useDashboardStatsRefresh() {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao carregar estatísticas do dashboard')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    retry: 2,
  })
}
