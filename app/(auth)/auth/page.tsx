'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { authSchema, type AuthFormData } from '@/lib/schemas'
import { maskPhone } from '@/lib/utils/phone'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'
import { registerFirstLogin, trackFailedLogin } from '@/app/actions/auth'

export default function AuthPage() {
  const [formData, setFormData] = useState<AuthFormData>({
    phone: '',
    password: '',
  })
  const [validationErrors, setValidationErrors] = useState<
    Partial<AuthFormData>
  >({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const validateForm = (): boolean => {
    try {
      authSchema.parse(formData)
      setValidationErrors({})
      return true
    } catch (error: unknown) {
      const errors: Partial<AuthFormData> = {}
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>
        }
        zodError.errors?.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof AuthFormData] = err.message
          }
        })
      }
      setValidationErrors(errors)
      return false
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '')
      const email = `${cleanPhone}@confraria.local`

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      })

      if (error) {
        // Track failed login attempt
        await trackFailedLogin(cleanPhone)

        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Telefone ou senha incorretos.')
        } else {
          throw new Error(error.message)
        }
      }

      // Register first login (mark pre-registration as accessed)
      // Fire-and-forget: don't block login if this fails
      // IP is resolved server-side via x-forwarded-for
      registerFirstLogin().catch(() => {})

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Blob dourado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] animate-fade-up">
        <div className="bg-card border border-white/[0.08] rounded-2xl p-8 space-y-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logo-confraria.svg"
              alt="Confraria Pedra Branca"
              width={160}
              height={48}
              className="h-12 w-auto"
              priority
            />
            <div className="text-center space-y-1">
              <h1 className="font-serif italic text-xl text-foreground/90">Área do Membro</h1>
              <p className="font-brand text-label uppercase tracking-[0.2em] text-primary/60 text-xs">
                Acesso exclusivo
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-brand text-xs uppercase tracking-wide text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))}
                disabled={loading}
                className={`h-12 bg-input border-white/[0.08] focus:border-primary/60 placeholder:text-muted-foreground/40 ${
                  validationErrors.phone ? 'border-destructive' : ''
                }`}
                maxLength={15}
              />
              {validationErrors.phone && (
                <p className="text-xs text-destructive">{validationErrors.phone}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-brand text-xs uppercase tracking-wide text-muted-foreground">
                Senha
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  className={`h-12 bg-input border-white/[0.08] focus:border-primary/60 pr-10 placeholder:text-muted-foreground/40 ${
                    validationErrors.password ? 'border-destructive' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-brand text-xs uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  )
}
