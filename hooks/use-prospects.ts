'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Prospect, ProspectStatus, ProspectListResponse } from '@/lib/supabase/types'

interface UseProspectsParams {
  initialPage?: number
  initialLimit?: number
  initialStatus?: ProspectStatus | 'all'
  initialSearch?: string
}

interface UseProspectsReturn {
  prospects: Prospect[]
  pagination: ProspectListResponse['pagination'] | null
  loading: boolean
  error: string | null
  // Filtros
  status: ProspectStatus | 'all'
  search: string
  page: number
  limit: number
  // Acoes
  setStatus: (status: ProspectStatus | 'all') => void
  setSearch: (search: string) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  refresh: () => Promise<void>
  updateProspect: (id: string, data: { status?: ProspectStatus; notes?: string }) => Promise<Prospect | null>
}

export function useProspects({
  initialPage = 1,
  initialLimit = 10,
  initialStatus = 'all',
  initialSearch = ''
}: UseProspectsParams = {}): UseProspectsReturn {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [pagination, setPagination] = useState<ProspectListResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<ProspectStatus | 'all'>(initialStatus)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const fetchProspects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (status && status !== 'all') {
        params.set('status', status)
      }

      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/admin/prospects?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar prospects')
      }

      setProspects(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setProspects([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, status, search])

  const updateProspect = useCallback(async (
    id: string,
    updateData: { status?: ProspectStatus; notes?: string }
  ): Promise<Prospect | null> => {
    try {
      const response = await fetch(`/api/admin/prospects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar prospect')
      }

      // Atualizar o prospect na lista local
      setProspects(prev =>
        prev.map(p => p.id === id ? data.data : p)
      )

      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return null
    }
  }, [])

  // Fetch quando os filtros mudam
  useEffect(() => {
    fetchProspects()
  }, [fetchProspects])

  // Reset page quando status ou search muda
  useEffect(() => {
    setPage(1)
  }, [status, search])

  return {
    prospects,
    pagination,
    loading,
    error,
    status,
    search,
    page,
    limit,
    setStatus,
    setSearch,
    setPage,
    setLimit,
    refresh: fetchProspects,
    updateProspect,
  }
}
