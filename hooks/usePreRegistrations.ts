/**
 * Hook customizado para gerenciar operações de pré-cadastro
 * Fornece funções para criar, listar, reenviar e regenerar pré-cadastros
 */

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

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

export interface UsePreRegistrationsResult {
  preRegistrations: PreRegistration[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }

  // Actions
  fetchPreRegistrations: (page?: number, limit?: number) => Promise<void>
  createPreRegistration: (data: {
    member_id: string
    send_method: 'whatsapp' | 'sms'
    notes?: string
  }) => Promise<any>
  resendCredentials: (preRegistrationId: string, sendMethod: 'whatsapp' | 'sms') => Promise<void>
  regeneratePassword: (
    preRegistrationId: string,
    sendMethod: 'whatsapp' | 'sms'
  ) => Promise<any>
  getPreRegistrationDetails: (preRegistrationId: string) => Promise<any>
}

export function usePreRegistrations(): UsePreRegistrationsResult {
  const { toast } = useToast()
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  /**
   * Busca pré-registros pendentes com paginação
   */
  const fetchPreRegistrations = useCallback(
    async (page = 1, limit = 20) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/admin/pre-registrations?page=${page}&limit=${limit}`
        )

        if (!response.ok) {
          throw new Error('Falha ao buscar pré-cadastros')
        }

        const data = await response.json()

        setPreRegistrations(data.data || [])
        setPagination({
          page: data.page,
          limit: data.limit || limit,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(message)
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  /**
   * Cria novo pré-cadastro
   */
  const createPreRegistration = useCallback(
    async (data: { member_id: string; send_method: 'whatsapp' | 'sms'; notes?: string }) => {
      try {
        const response = await fetch('/api/admin/pre-registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Falha ao criar pré-cadastro')
        }

        const result = await response.json()

        // Atualiza lista
        await fetchPreRegistrations(pagination.page, pagination.limit)

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar pré-cadastro'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast, fetchPreRegistrations, pagination]
  )

  /**
   * Reenvia credenciais (mesma senha)
   */
  const resendCredentials = useCallback(
    async (preRegistrationId: string, sendMethod: 'whatsapp' | 'sms') => {
      try {
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

        // Atualiza lista
        await fetchPreRegistrations(pagination.page, pagination.limit)

        toast({
          title: 'Sucesso!',
          description: 'Credenciais reenviadas com sucesso!',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao reenviar credenciais'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast, fetchPreRegistrations, pagination]
  )

  /**
   * Regenera senha (nova senha)
   */
  const regeneratePassword = useCallback(
    async (preRegistrationId: string, sendMethod: 'whatsapp' | 'sms') => {
      try {
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

        const result = await response.json()

        // Atualiza lista
        await fetchPreRegistrations(pagination.page, pagination.limit)

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao regenerar senha'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast, fetchPreRegistrations, pagination]
  )

  /**
   * Obtém detalhes completos de um pré-registro
   */
  const getPreRegistrationDetails = useCallback(
    async (preRegistrationId: string) => {
      try {
        const response = await fetch(`/api/admin/pre-registrations/${preRegistrationId}`)

        if (!response.ok) {
          throw new Error('Falha ao buscar detalhes')
        }

        return await response.json()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar detalhes'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast]
  )

  return {
    preRegistrations,
    loading,
    error,
    pagination,
    fetchPreRegistrations,
    createPreRegistration,
    resendCredentials,
    regeneratePassword,
    getPreRegistrationDetails,
  }
}
