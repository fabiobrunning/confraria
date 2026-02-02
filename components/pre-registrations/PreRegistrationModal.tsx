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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check, Eye, EyeOff, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PreRegistrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    member_id: string
    send_method: 'whatsapp' | 'sms'
    notes?: string
  }) => Promise<{
    success: boolean
    preRegistrationId?: string
    credentials?: {
      temporaryPassword: string
      username: string
    }
    message?: string
    whatsappLink?: string
    error?: string
  }>
  members?: Array<{ id: string; full_name: string; phone: string }>
  loading?: boolean
  mode?: 'create' | 'regenerate'
  regenerateId?: string
}

export function PreRegistrationModal({
  open,
  onOpenChange,
  onSubmit,
  members = [],
  mode = 'create',
  regenerateId,
}: PreRegistrationModalProps) {
  const { toast } = useToast()
  const [memberId, setMemberId] = useState('')
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'sms'>('whatsapp')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    preRegistrationId: string
    credentials: { temporaryPassword: string; username: string }
    message: string
    whatsappLink?: string
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset form quando abre
  useEffect(() => {
    if (open && !result) {
      setMemberId('')
      setSendMethod('whatsapp')
      setNotes('')
      setShowPassword(false)
      setCopied(false)
    }
  }, [open, result])

  const handleSubmit = async () => {
    if (!memberId && mode === 'create') {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um membro',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await onSubmit({
        member_id: memberId || regenerateId || '',
        send_method: sendMethod,
        notes: notes || undefined,
      })

      if (response.success && response.preRegistrationId && response.credentials) {
        setResult({
          preRegistrationId: response.preRegistrationId,
          credentials: response.credentials,
          message: response.message || '',
          whatsappLink: response.whatsappLink,
        })
        toast({
          title: 'Sucesso!',
          description: `Pré-cadastro ${mode === 'create' ? 'criado' : 'regenerado'} com sucesso!`,
        })
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Falha ao processar pré-cadastro',
          variant: 'destructive',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const copyPassword = async () => {
    if (result?.credentials.temporaryPassword) {
      await navigator.clipboard.writeText(result.credentials.temporaryPassword)
      setCopied(true)
      toast({
        title: 'Copiado!',
        description: 'Senha copiada para a área de transferência',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openWhatsApp = () => {
    if (result?.whatsappLink) {
      window.open(result.whatsappLink, '_blank')
    }
  }

  const handleClose = () => {
    if (result) {
      // Se há resultado, permite fechar e limpar
      setResult(null)
    } else {
      // Senão, apenas fecha o modal
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Zap className="w-5 h-5 text-blue-500" />
            {result
              ? `${mode === 'create' ? 'Novo' : 'Regenerar'} Pré-Cadastro`
              : `${mode === 'create' ? 'Criar' : 'Regenerar'} Pré-Cadastro`}
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'Credenciais geradas com sucesso. Copie e envie ao membro.'
              : `${mode === 'create' ? 'Crie um novo pré-cadastro para um membro.' : 'Gere uma nova senha para este pré-cadastro.'}`}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Tela de resultado
          <div className="space-y-6 py-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Pré-cadastro {mode === 'create' ? 'criado' : 'regenerado'} com sucesso!
              </AlertDescription>
            </Alert>

            {/* Credenciais */}
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Usuário</Label>
                <div className="flex gap-2">
                  <Input
                    value={result.credentials.username}
                    readOnly
                    className="bg-background"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(result.credentials.username)
                      toast({ title: 'Copiado!' })
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Senha Temporária</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={result.credentials.temporaryPassword}
                    readOnly
                    className="bg-background font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                    className={copied ? 'bg-green-50' : ''}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Válido por 30 dias. Membro pode fazer login com essas credenciais.
                </p>
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Mensagem para Enviar</Label>
              <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap font-mono text-foreground">
                  {result.message}
                </p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-2">
              {result.whatsappLink && (
                <Button
                  onClick={openWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Abrir WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(result.message)
                  toast({ title: 'Mensagem copiada!' })
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Mensagem
              </Button>
            </div>
          </div>
        ) : (
          // Formulário
          <div className="space-y-4 py-4">
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="member">Selecione um Membro</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger id="member" className="w-full">
                    <SelectValue placeholder="Escolha um membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} ({member.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="method">Método de Envio</Label>
              <Select value={sendMethod} onValueChange={(value: any) => setSendMethod(value)}>
                <SelectTrigger id="method" className="w-full">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre este pré-cadastro..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || (!memberId && mode === 'create')}>
                {submitting
                  ? 'Processando...'
                  : mode === 'create'
                    ? 'Criar Pré-Cadastro'
                    : 'Regenerar Senha'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
