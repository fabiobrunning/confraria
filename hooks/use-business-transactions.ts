import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Types for business transactions
 */
export interface BusinessTransaction {
  id: string
  transaction_type: 'direct_business' | 'referral' | 'consortium'
  member_from_id: string
  member_to_id: string | null
  amount: number
  description: string
  transaction_date: string
  consortium_group_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  member_from?: {
    id: string
    full_name: string
    phone: string
  }
  member_to?: {
    id: string
    full_name: string
    phone: string
  } | null
  consortium_group?: {
    id: string
    name: string
  } | null
  direction?: 'given' | 'received'
}

export interface BusinessTransactionFilters {
  member_id?: string
  transaction_type?: 'direct_business' | 'referral' | 'consortium'
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface BusinessTransactionResponse {
  transactions: BusinessTransaction[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export interface CreateBusinessTransactionData {
  transaction_type: 'direct_business' | 'referral' | 'consortium'
  member_from_id: string
  member_to_id?: string | null
  amount: number
  description: string
  transaction_date?: string
  consortium_group_id?: string | null
  notes?: string | null
}

/**
 * Hook: useBusinessTransactions
 * Fetch business transactions with optional filters
 */
export function useBusinessTransactions(filters?: BusinessTransactionFilters) {
  return useQuery<BusinessTransactionResponse, Error>({
    queryKey: ['business-transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.member_id) params.append('member_id', filters.member_id)
      if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/business-transactions?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao carregar transações')
      }

      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  })
}

/**
 * Hook: useCreateBusinessTransaction
 * Create a new business transaction
 */
export function useCreateBusinessTransaction() {
  const queryClient = useQueryClient()

  return useMutation<
    { success: boolean; transaction: BusinessTransaction; message: string },
    Error,
    CreateBusinessTransactionData
  >({
    mutationFn: async (data) => {
      const response = await fetch('/api/business-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Erro ao criar transação')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and refetch business transactions
      queryClient.invalidateQueries({ queryKey: ['business-transactions'] })

      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      // Invalidate member reports
      queryClient.invalidateQueries({ queryKey: ['member-report'] })

      toast.success(data.message || 'Transação registrada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao registrar transação')
    },
  })
}

/**
 * Hook: useBusinessTransaction
 * Fetch a single business transaction by ID
 */
export function useBusinessTransaction(transactionId?: string) {
  return useQuery<BusinessTransaction, Error>({
    queryKey: ['business-transaction', transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error('Transaction ID is required')

      const response = await fetch(`/api/business-transactions/${transactionId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao carregar transação')
      }

      return response.json()
    },
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
