'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WhatsAppLink } from './WhatsAppLink'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import type { Prospect, ProspectStatus } from '@/lib/supabase/types'
import { Copy, Mail, Building2, Briefcase, Calendar, User, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProspectModalProps {
  prospect: Prospect | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: { status?: ProspectStatus; notes?: string }) => Promise<Prospect | null>
}

const howFoundUsLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  referral: 'Indicacao',
  google: 'Google',
  event: 'Evento',
  other: 'Outro',
}

const statusOptions: { value: ProspectStatus; label: string }[] = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'converted', label: 'Convertido' },
  { value: 'rejected', label: 'Rejeitado' },
]

export function ProspectModal({
  prospect,
  open,
  onOpenChange,
  onSave,
}: ProspectModalProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<ProspectStatus>('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset state quando o prospect muda
  useEffect(() => {
    if (prospect) {
      setStatus(prospect.status as ProspectStatus)
      setNotes(prospect.notes || '')
    }
  }, [prospect])

  const handleSave = async () => {
    if (!prospect) return

    setSaving(true)
    try {
      const result = await onSave(prospect.id, { status, notes })
      if (result) {
        toast({
          title: 'Sucesso',
          description: 'Prospect atualizado com sucesso!',
        })
        onOpenChange(false)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar prospect',
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const copyEmail = async () => {
    if (prospect?.email) {
      await navigator.clipboard.writeText(prospect.email)
      setCopied(true)
      toast({
        title: 'Copiado!',
        description: 'E-mail copiado para a area de transferencia',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!prospect) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <User className="w-5 h-5 text-muted-foreground" />
            {prospect.full_name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do prospect {prospect.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status atual */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status atual:</span>
            <ProspectStatusBadge status={prospect.status as ProspectStatus} />
          </div>

          {/* Informacoes de contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">E-mail:</span>
                <span className="text-foreground">{prospect.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Empresa:</span>
                <span className="text-foreground">{prospect.company_name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Setor:</span>
                <span className="text-foreground">{prospect.business_sector}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cadastro:</span>
                <span className="text-foreground">{formatDate(prospect.created_at)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground ml-6">Como conheceu:</span>
                <span className="text-foreground">{howFoundUsLabels[prospect.how_found_us] || prospect.how_found_us}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground ml-6">Experiencia:</span>
                <span className="text-foreground">
                  {prospect.has_networking_experience ? 'Sim' : 'Nao'}
                </span>
              </div>
            </div>
          </div>

          {/* Experiencia de networking (se houver) */}
          {prospect.has_networking_experience && prospect.networking_experience && (
            <div className="bg-muted/50 rounded-lg p-3">
              <span className="text-sm text-muted-foreground block mb-1">Experiencia com Networking:</span>
              <p className="text-sm text-foreground">{prospect.networking_experience}</p>
            </div>
          )}

          {/* Acoes rapidas */}
          <div className="flex flex-wrap gap-2">
            <WhatsAppLink
              phone={prospect.phone}
              message={`Ola ${prospect.full_name.split(' ')[0]}, tudo bem? Sou da Confraria Pedra Branca e vi que voce demonstrou interesse em conhecer nosso grupo.`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyEmail}
              className="gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copiar E-mail
            </Button>
          </div>

          {/* Formulario de edicao */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="status">Alterar Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProspectStatus)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observacoes sobre este prospect..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* Informacoes de acompanhamento */}
          {(prospect.contacted_at || prospect.converted_at) && (
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              {prospect.contacted_at && (
                <p>Contatado em: {formatDate(prospect.contacted_at)}</p>
              )}
              {prospect.converted_at && (
                <p>Convertido em: {formatDate(prospect.converted_at)}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
