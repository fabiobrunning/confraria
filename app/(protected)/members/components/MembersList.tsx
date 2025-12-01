'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Phone,
  Instagram,
  Building2,
  User,
  AlertCircle,
  Crown,
  Coins
} from 'lucide-react'
import { useMembers, Member } from '@/hooks/use-members'

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

              {member.quotas && member.quotas.length > 0 && (
                <div className="mt-2 space-y-1">
                  {member.quotas.map((quota) => (
                    <div key={quota.id} className="flex items-center gap-2 text-sm">
                      <Coins className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                      <span className="text-muted-foreground">
                        {quota.group?.name} - Cota #{quota.quota_number}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${quota.status === 'contemplated' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}
                      >
                        {quota.status === 'contemplated' ? 'Contemplada' : 'Ativa'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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

export function MembersList({ currentUserId }: MembersListProps) {
  const { members, loading, error, search, setSearch, pagination, refetch } = useMembers()
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, setSearch])

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
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={debouncedSearch}
          onChange={(e) => setDebouncedSearch(e.target.value)}
          className="pl-10"
        />
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
              <MemberCard
                key={member.id}
                member={member}
                currentUserId={currentUserId}
              />
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
