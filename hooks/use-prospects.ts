'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Prospect, ProspectStatus } from '@/lib/supabase/types'

interface ProspectListResponse {
  success: boolean
  data: Prospect[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseProspectsParams {
  search?: string
  status?: ProspectStatus | 'all'
  page?: number
  limit?: number
}

export function useProspects(params: UseProspectsParams = {}) {
  const { search = '', status = 'all', page = 1, limit = 10 } = params

  return useQuery<ProspectListResponse, Error>({
    queryKey: ['prospects', { search, status, page, limit }],
    queryFn: async () => {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (status && status !== 'all') urlParams.set('status', status)
      if (search) urlParams.set('search', search)

      const response = await fetch(`/api/admin/prospects?${urlParams.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar prospects')
      }
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateProspect() {
  const queryClient = useQueryClient()

  return useMutation<
    { success: boolean; data: Prospect },
    Error,
    { id: string; data: { status?: ProspectStatus; notes?: string } }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/admin/prospects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar prospect')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
  })
}
