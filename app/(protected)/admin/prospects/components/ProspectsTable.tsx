'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import { WhatsAppLink } from './WhatsAppLink'
import type { Prospect } from '@/lib/supabase/types'
import { Building2, Calendar } from 'lucide-react'

interface ProspectsTableProps {
  prospects: Prospect[]
  onRowClick: (prospect: Prospect) => void
  loading?: boolean
}

export function ProspectsTable({ prospects, onRowClick, loading = false }: ProspectsTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Empresa</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">WhatsApp</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell colSpan={5}>
                  <div className="h-12 bg-muted/50 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (prospects.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nenhum prospect encontrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
            <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Empresa</TableHead>
            <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">WhatsApp</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => (
            <TableRow
              key={prospect.id}
              className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(prospect)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-foreground">{prospect.full_name}</span>
                  <span className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {prospect.company_name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{prospect.company_name}</span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                <WhatsAppLink phone={prospect.phone} variant="text" />
              </TableCell>
              <TableCell>
                <ProspectStatusBadge status={prospect.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(prospect.created_at)}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
