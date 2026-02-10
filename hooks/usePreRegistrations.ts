'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface PreRegistration {
  id: string
  member_id: string
  member_name: string
  member_phone: string
  created_at: string
  send_count: number
  last_sent_at: string | null
  first_accessed_at: string | null
  expiration_date: string
  locked_until: string | null
}

interface PreRegistrationsResponse {
  data: PreRegistration[]
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UsePreRegistrationsParams {
  page?: number
  limit?: number
}

export function usePreRegistrations(params: UsePreRegistrationsParams = {}) {
  const { page = 1, limit = 20 } = params

  return useQuery<PreRegistrationsResponse, Error>({
    queryKey: ['pre-registrations', { page, limit }],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/pre-registrations?page=${page}&limit=${limit}`
      )
      if (!response.ok) {
        throw new Error('Falha ao buscar pré-cadastros')
      }
      return response.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useCreatePreRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      member_id: string
      send_method: 'whatsapp' | 'sms'
      notes?: string
    }) => {
      const response = await fetch('/api/admin/pre-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao criar pré-cadastro')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useResendCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      preRegistrationId,
      sendMethod,
    }: {
      preRegistrationId: string
      sendMethod: 'whatsapp' | 'sms'
    }) => {
      const response = await fetch(
        `/api/admin/pre-registrations/${preRegistrationId}/resend-credentials`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ send_method: sendMethod }),
        }
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao reenviar credenciais')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-registrations'] })
      toast.success('Credenciais reenviadas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRegeneratePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      preRegistrationId,
      sendMethod,
    }: {
      preRegistrationId: string
      sendMethod: 'whatsapp' | 'sms'
    }) => {
      const response = await fetch(
        `/api/admin/pre-registrations/${preRegistrationId}/regenerate-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ send_method: sendMethod }),
        }
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao regenerar senha')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-registrations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function usePreRegistrationDetails(preRegistrationId?: string) {
  return useQuery({
    queryKey: ['pre-registration', preRegistrationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/pre-registrations/${preRegistrationId}`
      )
      if (!response.ok) {
        throw new Error('Falha ao buscar detalhes')
      }
      return response.json()
    },
    enabled: !!preRegistrationId,
    staleTime: 30 * 1000,
  })
}
