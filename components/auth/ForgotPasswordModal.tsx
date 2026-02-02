'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { maskPhone } from '@/lib/utils/phone'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    name?: string
    phone?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite seu telefone',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\D/g, '')

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      setResult({
        success: true,
        message: data.message,
        name: data.name,
        phone: data.phone,
      })

      toast({
        title: 'Sucesso!',
        description: 'Nova senha foi enviada para seu WhatsApp',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      setResult({
        success: false,
        message: errorMessage,
      })

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (result?.success) {
      setResult(null)
      setPhone('')
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Esqueci a Senha</DialogTitle>
          <DialogDescription>
            {result?.success
              ? 'Sua nova senha foi enviada!'
              : 'Digite seu telefone para receber uma nova senha temporária'}
          </DialogDescription>
        </DialogHeader>

        {result?.success ? (
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Nova senha temporária foi enviada para o WhatsApp de {result.name}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Número de telefone:</p>
              <p className="text-base font-mono font-semibold text-foreground">
                {result.phone}
              </p>
            </div>

            <div className="space-y-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">💡 Dicas:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Verifique seu WhatsApp para a mensagem</li>
                <li>A senha expira em 30 dias</li>
                <li>Se não recebeu, tente novamente</li>
              </ul>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-phone" className="text-sm font-medium">
                Telefone
              </Label>
              <Input
                id="forgot-phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                disabled={loading}
                className="bg-white text-gray-900 placeholder:text-gray-500"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                Digite o mesmo telefone usado no pré-cadastro
              </p>
            </div>

            {result?.success === false && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </form>
        )}

        <DialogFooter>
          {result?.success ? (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !phone}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
