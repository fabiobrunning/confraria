'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCreateEvent, useUpdateEvent } from '@/hooks/useEvents'

interface EventFormProps {
  event?: {
    id: string
    name: string
    description: string
    date: string
    time: string
    deadline: string
    confirmation_limit: number
  }
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const isEditing = !!event

  const [form, setForm] = useState({
    name: event?.name || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time?.slice(0, 5) || '',
    deadline: event?.deadline?.slice(0, 16) || '',
    confirmation_limit: event?.confirmation_limit || 50,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!form.description.trim()) errs.description = 'Descrição é obrigatória'
    if (!form.date) errs.date = 'Data é obrigatória'
    if (!form.time) errs.time = 'Hora é obrigatória'
    if (!form.deadline) errs.deadline = 'Deadline é obrigatório'
    if (form.confirmation_limit < 1) errs.confirmation_limit = 'Limite deve ser pelo menos 1'
    if (form.date && form.deadline) {
      const eventDate = new Date(form.date)
      const deadlineDate = new Date(form.deadline)
      if (deadlineDate < eventDate) {
        errs.deadline = 'Deadline deve ser igual ou posterior à data do evento'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      ...form,
      deadline: new Date(form.deadline).toISOString(),
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: event.id, ...payload })
        toast({ title: 'Evento atualizado com sucesso' })
        router.push(`/admin/events/${event.id}`)
      } else {
        const result = await createMutation.mutateAsync(payload)
        toast({ title: 'Evento criado com sucesso' })
        router.push(`/admin/events/${result.id}`)
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do evento</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Jantar de Confraternização"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descreva o evento..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline para confirmação</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Limite de pessoas</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={form.confirmation_limit}
                onChange={(e) => setForm(f => ({ ...f, confirmation_limit: parseInt(e.target.value) || 0 }))}
              />
              {errors.confirmation_limit && <p className="text-sm text-destructive">{errors.confirmation_limit}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
