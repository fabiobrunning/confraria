'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, UserPlus, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'

// Schema de validacao
const preRegisterSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email invalido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 digitos'),
  instagram: z.string().optional(),
  address_cep: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  send_invite: z.boolean().default(false),
})

type PreRegisterFormData = z.infer<typeof preRegisterSchema>

// Tipo para resposta da API ViaCEP
interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export default function PreRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreRegisterFormData>({
    resolver: zodResolver(preRegisterSchema),
    defaultValues: {
      send_invite: false,
    },
  })

  const cepValue = watch('address_cep')
  const sendInvite = watch('send_invite')

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
          toast.error('Acesso negado. Apenas administradores podem acessar esta pagina.')
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Erro ao verificar permissoes:', error)
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

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  // Buscar endereco pelo CEP
  const handleCepSearch = async () => {
    const cep = cepValue?.replace(/\D/g, '')

    if (!cep || cep.length !== 8) {
      toast.error('CEP deve ter 8 digitos')
      return
    }

    setIsLoadingCep(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data: ViaCepResponse = await response.json()

      if (data.erro) {
        toast.error('CEP nao encontrado')
        return
      }

      setValue('address_street', data.logradouro)
      setValue('address_neighborhood', data.bairro)
      setValue('address_city', data.localidade)
      setValue('address_state', data.uf)

      if (data.complemento) {
        setValue('address_complement', data.complemento)
      }

      toast.success('Endereco preenchido automaticamente')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP')
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Submeter formulario
  const onSubmit = async (data: PreRegisterFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/pre-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone: data.phone.replace(/\D/g, ''),
          address_cep: data.address_cep?.replace(/\D/g, ''),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar membro')
      }

      toast.success('Membro cadastrado com sucesso!')

      if (result.tempPassword) {
        toast.info(`Senha temporaria: ${result.tempPassword}`, {
          duration: 10000,
        })
      }

      router.push('/members')
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar membro')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state enquanto verifica permissoes
  if (isCheckingAuth || isAdmin === null) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verificando permissoes...</p>
        </div>
      </div>
    )
  }

  // Se nao for admin, nao renderiza nada (ja foi redirecionado)
  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-7 w-7" />
          Pre-Cadastro
        </h1>
        <p className="text-muted-foreground">Cadastre novos membros no sistema</p>
      </div>

      {/* Formulario */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Dados do Novo Membro</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para cadastrar um novo membro. Campos com * sao obrigatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                Dados Pessoais
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Nome Completo */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="full_name">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Digite o nome completo"
                    {...register('full_name')}
                    className={errors.full_name ? 'border-destructive' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
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
                    {...register('phone', {
                      onChange: (e) => {
                        e.target.value = formatPhone(e.target.value)
                      },
                    })}
                    maxLength={15}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Instagram */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="instagram"
                      placeholder="usuario"
                      className="pl-7"
                      {...register('instagram')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereco */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereco
              </h3>

              <div className="grid gap-4 sm:grid-cols-6">
                {/* CEP */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address_cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address_cep"
                      placeholder="00000-000"
                      {...register('address_cep', {
                        onChange: (e) => {
                          e.target.value = formatCep(e.target.value)
                        },
                      })}
                      maxLength={9}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCepSearch}
                      disabled={isLoadingCep}
                    >
                      {isLoadingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Rua */}
                <div className="sm:col-span-4 space-y-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    placeholder="Nome da rua"
                    {...register('address_street')}
                  />
                </div>

                {/* Numero */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address_number">Numero</Label>
                  <Input
                    id="address_number"
                    placeholder="123"
                    {...register('address_number')}
                  />
                </div>

                {/* Complemento */}
                <div className="sm:col-span-4 space-y-2">
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    placeholder="Apto, Bloco, etc."
                    {...register('address_complement')}
                  />
                </div>

                {/* Bairro */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input
                    id="address_neighborhood"
                    placeholder="Bairro"
                    {...register('address_neighborhood')}
                  />
                </div>

                {/* Cidade */}
                <div className="sm:col-span-3 space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    placeholder="Cidade"
                    {...register('address_city')}
                  />
                </div>

                {/* Estado */}
                <div className="sm:col-span-1 space-y-2">
                  <Label htmlFor="address_state">UF</Label>
                  <Input
                    id="address_state"
                    placeholder="UF"
                    maxLength={2}
                    {...register('address_state')}
                    className="uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Opcoes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send_invite"
                  checked={sendInvite}
                  onCheckedChange={(checked) => setValue('send_invite', checked === true)}
                />
                <Label htmlFor="send_invite" className="text-sm font-normal cursor-pointer">
                  Enviar email de convite ao novo membro
                </Label>
              </div>
              {sendInvite && (
                <p className="text-sm text-muted-foreground ml-6">
                  Um email sera enviado com instrucoes para o membro criar sua senha e acessar o sistema.
                </p>
              )}
            </div>

            {/* Botoes */}
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
                    Cadastrar Membro
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
