'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Search,
  Phone,
  Instagram,
  Building2,
  User,
  AlertCircle,
  Crown,
  UserPlus,
  KeyRound,
  Loader2,
  Copy,
  Check
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMembers, Member } from '@/hooks/use-members'
import { useToast } from '@/hooks/use-toast'

// Re-export Member for components that import it from here
export type { Member }

interface MembersListProps {
  isAdmin: boolean
  currentUserId: string | null
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

function getWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const fullNumber = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${fullNumber}`
}

function getInstagramLink(instagram: string): string {
  const handle = instagram.replace('@', '').trim()
  return `https://instagram.com/${handle}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function MemberCard({ member, currentUserId }: { member: Member; currentUserId: string | null }) {
  const isCurrentUser = member.id === currentUserId
  const isAdmin = member.role === 'admin'

  return (
    <Link href={isCurrentUser ? '/profile' : `/members/${member.id}`}>
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer bg-card ${isCurrentUser ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-border'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {getInitials(member.full_name)}
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {member.full_name}
                </h3>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    Voce
                  </Badge>
                )}
              </div>

              <div className="mt-2 space-y-1">
                {member.phone && (
                  <a
                    href={getWhatsAppLink(member.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{formatPhone(member.phone)}</span>
                  </a>
                )}

                {member.instagram && (
                  <a
                    href={getInstagramLink(member.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-500 transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    <span>@{member.instagram.replace('@', '')}</span>
                  </a>
                )}
              </div>

              {member.companies && member.companies.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {member.companies.map(c => c.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PreRegisteredCard({ member }: { member: Member }) {
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleResendPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/resend-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar senha')
      }

      setTempPassword(data.tempPassword)
      toast({
        title: 'Senha gerada!',
        description: 'Copie a senha e envie para o membro',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar senha',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copiado!',
        description: 'Senha copiada para a area de transferencia',
      })
    }
  }

  return (
    <Card className="overflow-hidden bg-card border-amber-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-semibold">
              {getInitials(member.full_name)}
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
              <UserPlus className="h-3 w-3 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">
                {member.full_name}
              </h3>
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                Pre-cadastro
              </Badge>
            </div>

            <div className="mt-2 space-y-1">
              {member.phone && (
                <a
                  href={getWhatsAppLink(member.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{formatPhone(member.phone)}</span>
                </a>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {tempPassword ? (
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {tempPassword}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPassword}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendPassword}
                  disabled={loading}
                  className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                  Gerar Senha Temporaria
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          {search ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {search
            ? `Nao encontramos membros com "${search}"`
            : 'Comece adicionando o primeiro membro'}
        </p>
      </CardContent>
    </Card>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Erro ao carregar membros
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Tentar novamente
        </button>
      </CardContent>
    </Card>
  )
}

export function MembersList({ isAdmin, currentUserId }: MembersListProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [preRegistered, setPreRegistered] = useState<boolean | undefined>(undefined)

  const { data: membersData, isLoading: loading, error: queryError, refetch } = useMembers({
    search: debouncedSearch,
    preRegistered,
  })

  const members = membersData?.data ?? []
  const pagination = membersData?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 }
  const error = queryError?.message ?? null

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'all') {
      setPreRegistered(undefined)
    } else if (value === 'members') {
      setPreRegistered(false)
    } else if (value === 'pre-registered') {
      setPreRegistered(true)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Ordena para mostrar o usuário atual primeiro
  const displayMembers = useMemo(() => {
    if (!currentUserId) return members

    const currentUser = members.find(m => m.id === currentUserId)
    const otherMembers = members.filter(m => m.id !== currentUserId)

    return currentUser ? [currentUser, ...otherMembers] : members
  }, [members, currentUserId])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="members">Membros</TabsTrigger>
              <TabsTrigger value="pre-registered" className="gap-1">
                <UserPlus className="h-3 w-3" />
                Pre-cadastro
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && displayMembers.length === 0 && (
        <EmptyState search={search} />
      )}

      {!loading && displayMembers.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayMembers.map((member) => (
              activeTab === 'pre-registered' ? (
                <PreRegisteredCard
                  key={member.id}
                  member={member}
                />
              ) : (
                <MemberCard
                  key={member.id}
                  member={member}
                  currentUserId={currentUserId}
                />
              )
            ))}
          </div>

          {pagination.total > pagination.limit && (
            <p className="text-sm text-muted-foreground text-center">
              Mostrando {displayMembers.length} de {pagination.total} membros
            </p>
          )}
        </>
      )}
    </div>
  )
}
