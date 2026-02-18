'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Event {
  id: string
  name: string
  description: string
  date: string
  time: string
  deadline: string
  confirmation_limit: number
  status: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  total_confirmed: number
}

interface EventsResponse {
  events: Event[]
  pagination: { page: number; limit: number; total: number }
}

interface Confirmation {
  id: string
  user_phone: string
  confirmed_count: number
  confirmed_at: string
  created_at: string
}

interface UseEventsParams {
  page?: number
  limit?: number
  status?: string
}

export function useEvents({ page = 1, limit = 20, status }: UseEventsParams = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)

  return useQuery<EventsResponse>({
    queryKey: ['events', page, limit, status],
    queryFn: async () => {
      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
  })
}

export function useEvent(id: string) {
  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`)
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useEventConfirmations(eventId: string) {
  return useQuery<{ confirmations: Confirmation[] }>({
    queryKey: ['event-confirmations', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/confirmations`)
      if (!res.ok) throw new Error('Failed to fetch confirmations')
      return res.json()
    },
    enabled: !!eventId,
    staleTime: 5_000,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description: string
      date: string
      time: string
      deadline: string
      confirmation_limit: number
    }) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create event')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update event')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
    },
  })
}

export function useCancelEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel event')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
