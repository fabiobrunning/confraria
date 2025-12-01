'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Company {
  id: string
  name: string
  cnpj?: string | null
  phone?: string | null
  instagram?: string | null
}

export interface Member {
  id: string
  full_name: string
  phone: string
  instagram: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_cep: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
  companies: Company[]
}

export interface MembersResponse {
  data: Member[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useMembers(initialSearch = '') {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(initialSearch)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const fetchMembers = useCallback(async (searchTerm = search, page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      params.set('page', page.toString())
      params.set('limit', '50')

      const response = await fetch(`/api/members?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Falha ao carregar membros')
      }

      const data: MembersResponse = await response.json()
      setMembers(data.data)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching members:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchMembers(search)
  }, [search, fetchMembers])

  const refetch = useCallback(() => {
    fetchMembers(search, pagination.page)
  }, [fetchMembers, search, pagination.page])

  return {
    members,
    loading,
    error,
    search,
    setSearch,
    pagination,
    refetch
  }
}

export function useMember(id: string) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMember = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/members/${id}`)

      if (!response.ok) {
        throw new Error('Membro nao encontrado')
      }

      const data = await response.json()
      setMember(data.data)
    } catch (err) {
      console.error('Error fetching member:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar membro')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMember()
  }, [fetchMember])

  const updateMember = async (updateData: Partial<Member>) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar membro')
      }

      const data = await response.json()
      setMember(prev => prev ? { ...prev, ...data.data } : data.data)
      return { success: true, data: data.data }
    } catch (err) {
      console.error('Error updating member:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao atualizar membro'
      }
    }
  }

  return {
    member,
    loading,
    error,
    refetch: fetchMember,
    updateMember
  }
}
