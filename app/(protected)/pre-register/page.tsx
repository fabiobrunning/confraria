'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function PreRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({})

  // Verificar se usuario eh admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const profileData = profile as { role: string } | null

        if (profileData?.role !== 'admin') {
          toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Erro ao verificar permissões:', error)
        router.push('/dashboard')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAdmin()
  }, [supabase, router])

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  // Validar formulário
  const validate = () => {
    const newErrors: { fullName?: string; phone?: string } = {}

    if (!fullName || fullName.length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres'
    }

    const phoneNumbers = phone.replace(/\D/g, '')
    if (!phoneNumbers || phoneNumbers.length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/pre-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone.replace(/\D/g, ''),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar membro')
      }

      toast.success('Membro pré-cadastrado com sucesso!')
      router.push('/members')
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar membro')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state enquanto verifica permissões
  if (isCheckingAuth || isAdmin === null) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se não for admin, não renderiza nada (já foi redirecionado)
  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-7 w-7" />
          Pré-Cadastro
        </h1>
        <p className="text-muted-foreground">Cadastre novos membros no sistema</p>
      </div>

      {/* Formulário */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Dados do Novo Membro</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para pré-cadastrar um novo membro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Digite o nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/members')}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
