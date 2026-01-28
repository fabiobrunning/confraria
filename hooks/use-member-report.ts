import { useQuery } from '@tanstack/react-query'
import { BusinessTransaction } from './use-business-transactions'

/**
 * Types for member report
 */
export interface MemberInfo {
  id: string
  full_name: string
  phone: string
  role: 'admin' | 'member'
  instagram: string | null
}

export interface MemberStatistics {
  total_given: number
  total_received: number
  net_balance: number
  total_transactions: number
  referrals_given: number
  referrals_received: number
}

export interface MemberTransactionByType {
  type: 'direct_business' | 'referral' | 'consortium'
  total_given: number
  total_received: number
  count_given: number
  count_received: number
}

export interface MemberMonthlyTimeline {
  month: string // YYYY-MM
  total_given: number
  total_received: number
  count_given: number
  count_received: number
  net: number
}

export interface MemberReport {
  member: MemberInfo
  statistics: MemberStatistics
  transactions: BusinessTransaction[]
  by_type: MemberTransactionByType[]
  monthly_timeline: MemberMonthlyTimeline[]
}

/**
 * Hook: useMemberReport
 * Fetch detailed business report for a specific member
 *
 * Returns:
 * - member: Profile information
 * - statistics: Aggregated stats (given, received, balance, referrals)
 * - transactions: All transactions involving the member
 * - by_type: Breakdown by transaction type
 * - monthly_timeline: Monthly evolution (last 12 months)
 *
 * Authorization:
 * - Admins can view any member's report
 * - Members can only view their own report
 */
export function useMemberReport(memberId?: string) {
  return useQuery<MemberReport, Error>({
    queryKey: ['member-report', memberId],
    queryFn: async () => {
      if (!memberId) throw new Error('Member ID is required')

      const response = await fetch(`/api/reports/member/${memberId}`)

      if (!response.ok) {
        const error = await response.json()

        if (response.status === 403) {
          throw new Error('Você não tem permissão para visualizar este relatório')
        }

        if (response.status === 404) {
          throw new Error('Membro não encontrado')
        }

        throw new Error(error.message || 'Erro ao carregar relatório do membro')
      }

      return response.json()
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}

/**
 * Hook: useMyReport
 * Fetch business report for the current logged-in user
 *
 * This is a convenience hook that automatically uses the current user's ID
 * Usage: const { data: myReport } = useMyReport(session?.user?.id)
 */
export function useMyReport(currentUserId?: string) {
  return useMemberReport(currentUserId)
}
