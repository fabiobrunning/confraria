'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => undefined)

      await registerFirstLogin(ipAddress)

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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md shadow-2xl border-accent/20 bg-white">
        <CardHeader className="space-y-4 text-center pt-8">
          <div className="flex justify-center mb-2">
            <Image
              src="/confraria-pedra-branca.svg"
              alt="Confraria Pedra Branca"
              width={80}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>
          <CardTitle className="text-3xl font-display tracking-wide text-black">
            CONFRARIA PEDRA BRANCA
          </CardTitle>
          <CardDescription className="font-serif text-base text-gray-600">
            Sistema de Gestao de Consorcios
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="font-sans text-sm font-medium text-gray-700"
              >
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: maskPhone(e.target.value),
                  }))
                }
                disabled={loading}
                className={`font-sans bg-white text-gray-900 placeholder:text-gray-500 ${
                  validationErrors.phone ? 'border-destructive' : ''
                }`}
                maxLength={15}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive font-sans">
                  {validationErrors.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-sans text-sm font-medium text-gray-700"
              >
                Senha
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  disabled={loading}
                  className={`font-sans pr-10 bg-white text-gray-900 placeholder:text-gray-500 ${
                    validationErrors.password ? 'border-destructive' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive font-sans">
                  {validationErrors.password}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white font-sans font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-accent hover:underline font-medium"
              >
                Esqueci a senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  )
}
