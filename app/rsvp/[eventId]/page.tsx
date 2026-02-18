'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Users, Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface EventData {
  id: string
  name: string
  description: string
  date: string
  time: string
  deadline: string
  confirmation_limit: number
  status: string
  total_confirmed: number
}

interface ValidationResult {
  valid: boolean
  name?: string
  phone?: string
  existing_confirmation?: {
    confirmed_count: number
    confirmed_at: string
  } | null
}

type PageState = 'loading' | 'event_info' | 'validating' | 'validated' | 'confirming' | 'confirmed' | 'error' | 'expired' | 'cancelled' | 'not_found'

export default function RSVPPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [eventId, setEventId] = useState<string>('')
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [selectedCount, setSelectedCount] = useState<number>(0)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [validatedUser, setValidatedUser] = useState<{ name: string; phone: string } | null>(null)
  const [existingConfirmation, setExistingConfirmation] = useState<{ confirmed_count: number; confirmed_at: string } | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  // Fetch event details
  const { data: event, refetch: refetchEvent } = useQuery<EventData>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`)
      if (res.status === 404) throw new Error('not_found')
      if (!res.ok) throw new Error('fetch_error')
      return res.json()
    },
    enabled: !!eventId,
    staleTime: 10_000,
  })

  // Set page state based on event data
  useEffect(() => {
    if (!event) return
    if (event.status === 'cancelled') {
      setPageState('cancelled')
    } else if (new Date(event.deadline) < new Date()) {
      setPageState('expired')
    } else {
      setPageState('event_info')
    }
  }, [event])

  // Phone mask: (00) 00000-0000
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 0) formatted = `(${digits.slice(0, 2)}`
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}`
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
    setPhoneInput(formatted)
    setPhoneError('')
  }

  // Validate phone
  const validateMutation = useMutation<ValidationResult>({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventId}/validate-phone?phone=${encodeURIComponent(phoneInput)}`)
      if (res.status === 429) throw new Error('rate_limit')
      if (!res.ok) throw new Error('validate_error')
      return res.json()
    },
    onSuccess: (data) => {
      if (data.valid && data.name && data.phone) {
        setValidatedUser({ name: data.name, phone: data.phone })
        if (data.existing_confirmation) {
          setExistingConfirmation(data.existing_confirmation)
          setSelectedCount(data.existing_confirmation.confirmed_count)
          setPageState('confirmed')
        } else {
          setPageState('validated')
        }
      } else {
        setPhoneError('Número não encontrado. Verifique se está cadastrado.')
        setPageState('event_info')
      }
    },
    onError: (error: Error) => {
      if (error.message === 'rate_limit') {
        setPhoneError('Muitas tentativas. Tente novamente em 1 minuto.')
      } else {
        setPhoneError('Erro ao validar. Tente novamente.')
      }
      setPageState('event_info')
    },
  })

  const handleValidatePhone = () => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    if (!phoneRegex.test(phoneInput)) {
      setPhoneError('Formato inválido. Use: (00) 00000-0000')
      return
    }
    setPageState('validating')
    validateMutation.mutate()
  }

  // Confirm attendance
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_phone: validatedUser?.phone || phoneInput,
          confirmed_count: selectedCount,
        }),
      })
      if (res.status === 429) throw new Error('rate_limit')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'confirm_error')
      }
      return res.json()
    },
    onSuccess: () => {
      setExistingConfirmation({
        confirmed_count: selectedCount,
        confirmed_at: new Date().toISOString(),
      })
      setConfirmationMessage(`Você confirmou para ${selectedCount} pessoa${selectedCount > 1 ? 's' : ''}!`)
      setPageState('confirmed')
      refetchEvent()
    },
    onError: (error: Error) => {
      if (error.message === 'rate_limit') {
        setErrorMessage('Muitas tentativas. Tente novamente em 1 minuto.')
      } else {
        setErrorMessage(error.message || 'Erro ao confirmar. Tente novamente.')
      }
    },
  })

  const handleConfirm = () => {
    if (selectedCount < 1) return
    setErrorMessage('')
    setPageState('confirming')
    confirmMutation.mutate()
  }

  const handleAlterConfirmation = () => {
    setConfirmationMessage('')
    setPageState('validated')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => timeStr.slice(0, 5)

  const getDeadlineText = useCallback(() => {
    if (!event) return ''
    const deadline = new Date(event.deadline)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    if (diff <= 0) return 'Encerrado'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes} minuto${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`
  }, [event])

  // --- RENDER ---

  if (pageState === 'loading' || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento não encontrado</h2>
            <p className="text-muted-foreground">O link pode estar incorreto ou o evento foi removido.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pageState === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento cancelado</h2>
            <p className="text-muted-foreground">Este evento foi cancelado pelo organizador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Prazo encerrado</h2>
            <p className="text-muted-foreground">O prazo para confirmação deste evento já expirou.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Event Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-display">{event.name}</CardTitle>
            <p className="text-muted-foreground text-sm">{event.description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(event.time)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.total_confirmed} / {event.confirmation_limit} confirmações</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchEvent()}
                aria-label="Atualizar contagem"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              {getDeadlineText()}
            </Badge>
          </CardContent>
        </Card>

        {/* Phone Validation */}
        {(pageState === 'event_info' || pageState === 'validating') && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Digite seu número de WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  value={phoneInput}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidatePhone()}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                  disabled={pageState === 'validating'}
                />
                {phoneError && (
                  <p id="phone-error" className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {phoneError}
                  </p>
                )}
              </div>
              <Button
                onClick={handleValidatePhone}
                disabled={pageState === 'validating' || phoneInput.length < 14}
                className="w-full"
              >
                {pageState === 'validating' ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Validando...</>
                ) : (
                  'Validar'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Validated — Greeting + Count Selection */}
        {(pageState === 'validated' || pageState === 'confirming') && validatedUser && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Número reconhecido! Olá, <strong>{validatedUser.name}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="font-medium text-center">Quantas pessoas vão?</p>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Quantidade de pessoas">
                  {[1, 2, 3, 4].map((count) => (
                    <Button
                      key={count}
                      variant={selectedCount === count ? 'default' : 'outline'}
                      className={cn(
                        'h-14 text-lg font-bold',
                        selectedCount === count && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedCount(count)}
                      role="radio"
                      aria-checked={selectedCount === count}
                      disabled={pageState === 'confirming'}
                    >
                      +{count}
                    </Button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleConfirm}
                disabled={selectedCount < 1 || pageState === 'confirming'}
                className="w-full h-12 text-base"
              >
                {pageState === 'confirming' ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Confirmando...</>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmed State */}
        {pageState === 'confirmed' && validatedUser && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  {confirmationMessage || (
                    <>
                      Você já confirmou para <strong>{existingConfirmation?.confirmed_count}</strong> pessoa{(existingConfirmation?.confirmed_count || 0) > 1 ? 's' : ''} em{' '}
                      {existingConfirmation?.confirmed_at
                        ? new Date(existingConfirmation.confirmed_at).toLocaleDateString('pt-BR')
                        : ''}
                    </>
                  )}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={handleAlterConfirmation}
                className="w-full"
              >
                Alterar confirmação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
