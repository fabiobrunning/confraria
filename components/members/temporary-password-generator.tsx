'use client'

import { useState } from 'react'
import { Check, Copy, Key, Loader2, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'

interface TemporaryPasswordGeneratorProps {
  memberId: string
  memberName: string
  memberEmail: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Generate a secure random password
 * 16 characters with uppercase, lowercase, numbers, and special chars
 */
function generatePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?'
  const all = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining 12 characters randomly
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

export function TemporaryPasswordGenerator({
  memberId,
  memberName,
  memberEmail,
  open,
  onOpenChange,
}: TemporaryPasswordGeneratorProps) {
  const [password, setPassword] = useState('')
  const [sendEmail, setSendEmail] = useState(!!memberEmail)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const newPassword = generatePassword()
      setPassword(newPassword)
      setCopied(false)

      // Call API to update password
      const response = await fetch(`/api/members/${memberId}/generate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          sendEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar senha')
      }

      toast({
        title: 'Senha gerada com sucesso!',
        description: sendEmail && memberEmail
          ? `Email enviado para ${memberEmail}`
          : 'Copie a senha e envie manualmente',
      })
    } catch (error) {
      toast({
        title: 'Erro ao gerar senha',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Senha copiada!',
        description: 'Cole em um local seguro',
      })
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente copiar manualmente',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateNew = () => {
    setPassword('')
    handleGenerate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gerar Senha Temporária
          </DialogTitle>
          <DialogDescription>
            Gere uma senha temporária para <strong>{memberName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {password ? (
            <>
              {/* Password Display */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Senha Gerada
                </Label>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-lg font-mono font-semibold break-all">
                    {password}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email Checkbox */}
              {memberEmail && (
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked === true)}
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label
                      htmlFor="sendEmail"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Enviar por email ({memberEmail})
                    </Label>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  variant="default"
                  onClick={handleGenerateNew}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Gerar Nova
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Initial State */}
              <div className="text-center py-6">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no botão abaixo para gerar uma senha segura
                </p>
              </div>

              {/* Email Checkbox */}
              {memberEmail && (
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked === true)}
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label
                      htmlFor="sendEmail"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Enviar por email ({memberEmail})
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Gerar Senha
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
