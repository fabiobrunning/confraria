'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Company {
  id: string
  name: string
  cnpj?: string | null
  phone?: string | null
  instagram?: string | null
}

export interface MemberQuota {
  id: string
  quota_number: number
  status: string
  group: {
    id: string
    name: string
  } | null
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
  pre_registered: boolean
  created_at: string
  updated_at: string
  companies: Company[]
  quotas: MemberQuota[]
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

interface UseMembersParams {
  search?: string
  preRegistered?: boolean
  page?: number
  limit?: number
}

export function useMembers(params: UseMembersParams = {}) {
  const { search = '', preRegistered, page = 1, limit = 50 } = params

  return useQuery<MembersResponse, Error>({
    queryKey: ['members', { search, preRegistered, page, limit }],
    queryFn: async () => {
      const urlParams = new URLSearchParams()
      if (search) urlParams.set('search', search)
      urlParams.set('page', page.toString())
      urlParams.set('limit', limit.toString())
      if (preRegistered !== undefined) urlParams.set('pre_registered', preRegistered.toString())

      const response = await fetch(`/api/members?${urlParams.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar membros')
      }
      return response.json()
    },
    staleTime: 60 * 1000,
  })
}

export function useMember(id: string) {
  return useQuery<{ data: Member }, Error>({
    queryKey: ['member', id],
    queryFn: async () => {
      const response = await fetch(`/api/members/${id}`)
      if (!response.ok) {
        throw new Error('Membro não encontrado')
      }
      return response.json()
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ data: Member }, Error, Partial<Member>>({
    mutationFn: async (updateData) => {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar membro')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
