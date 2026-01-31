'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PreRegistrationStatusBadge, getPreRegistrationStatus } from './PreRegistrationStatusBadge'
import { Phone, Calendar, Send, RotateCw, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface PreRegistration {
  id: string
  member_id: string
  member_name: string
  member_phone: string
  created_at: string
  send_count: number
  last_sent_at: string | null
  first_accessed_at: string | null
  expiration_date: string
  locked_until: string | null
}

interface PreRegistrationsTableProps {
  preRegistrations: PreRegistration[]
  onRowClick: (preRegistration: PreRegistration) => void
  onResend: (id: string) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onViewDetails: (id: string) => void
  loading?: boolean
}

export function PreRegistrationsTable({
  preRegistrations,
  onRowClick,
  onResend,
  onRegenerate,
  onViewDetails,
  loading = false,
}: PreRegistrationsTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Telefone</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Enviado</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Data</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell colSpan={6}>
                  <div className="h-12 bg-muted/50 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (preRegistrations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nenhum pré-cadastro pendente encontrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
            <TableHead className="text-muted-foreground font-medium hidden md:table-cell">
              Telefone
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">
              Enviado
            </TableHead>
            <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">
              Data
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preRegistrations.map((preReg) => {
            const status = getPreRegistrationStatus({
              first_accessed_at: preReg.first_accessed_at,
              locked_until: preReg.locked_until,
              expiration_date: preReg.expiration_date,
            })

            return (
              <TableRow
                key={preReg.id}
                className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(preReg)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-foreground">{preReg.member_name}</span>
                    <span className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {preReg.member_phone}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{preReg.member_phone}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <PreRegistrationStatusBadge status={status} />
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    {preReg.send_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {preReg.send_count}x
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {preReg.last_sent_at ? formatDateTime(preReg.last_sent_at) : 'Nunca'}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(preReg.created_at)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onViewDetails(preReg.id)}>
                        <span>Ver Detalhes</span>
                      </DropdownMenuItem>

                      {status === 'pending' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onResend(preReg.id)}>
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar Credenciais
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRegenerate(preReg.id)}>
                            <RotateCw className="w-4 h-4 mr-2" />
                            Regenerar Senha
                          </DropdownMenuItem>
                        </>
                      )}

                      {status !== 'accessed' && status !== 'expired' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onRegenerate(preReg.id)}
                            className="text-orange-600"
                          >
                            <RotateCw className="w-4 h-4 mr-2" />
                            Gerar Nova Senha
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
