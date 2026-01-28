'use client'

import { BusinessTransaction } from '@/hooks/use-business-transactions'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDownRight, ArrowUpRight, Repeat } from 'lucide-react'

interface BusinessTransactionsListProps {
  transactions: BusinessTransaction[]
  currentUserId?: string
  isLoading?: boolean
  emptyMessage?: string
}

const transactionTypeLabels = {
  direct_business: 'Negócio Direto',
  referral: 'Indicação',
  consortium: 'Consórcio',
}

const transactionTypeVariants = {
  direct_business: 'default',
  referral: 'success',
  consortium: 'secondary',
} as const

export function BusinessTransactionsList({
  transactions,
  currentUserId,
  isLoading,
  emptyMessage = 'Nenhuma transação encontrada',
}: BusinessTransactionsListProps) {
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Carregando transações...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableCaption>
          Total de {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>De</TableHead>
            <TableHead>Para</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px]">Direção</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isGiver = transaction.member_from_id === currentUserId
            const isReceiver = transaction.member_to_id === currentUserId
            const direction = isGiver ? 'given' : isReceiver ? 'received' : 'other'

            return (
              <TableRow key={transaction.id}>
                {/* Date */}
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Badge variant={transactionTypeVariants[transaction.transaction_type]}>
                    {transactionTypeLabels[transaction.transaction_type]}
                  </Badge>
                </TableCell>

                {/* From */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {transaction.member_from?.full_name || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {transaction.member_from?.phone}
                    </span>
                  </div>
                </TableCell>

                {/* To */}
                <TableCell>
                  {transaction.transaction_type === 'consortium' ? (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {transaction.consortium_group?.name || 'Consórcio'}
                      </span>
                      <span className="text-xs text-muted-foreground">Grupo</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {transaction.member_to?.full_name || 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.member_to?.phone}
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right font-semibold">
                  <span
                    className={
                      direction === 'given'
                        ? 'text-destructive'
                        : direction === 'received'
                          ? 'text-success'
                          : ''
                    }
                  >
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(transaction.amount)}
                  </span>
                </TableCell>

                {/* Description */}
                <TableCell className="max-w-[200px]">
                  <p className="truncate" title={transaction.description}>
                    {transaction.description}
                  </p>
                  {transaction.notes && (
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={transaction.notes}
                    >
                      {transaction.notes}
                    </p>
                  )}
                </TableCell>

                {/* Direction */}
                <TableCell>
                  {direction === 'given' && (
                    <div className="flex items-center gap-1 text-destructive">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="text-xs font-medium">Dado</span>
                    </div>
                  )}
                  {direction === 'received' && (
                    <div className="flex items-center gap-1 text-success">
                      <ArrowDownRight className="h-4 w-4" />
                      <span className="text-xs font-medium">Recebido</span>
                    </div>
                  )}
                  {direction === 'other' && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Repeat className="h-4 w-4" />
                      <span className="text-xs font-medium">Outro</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
