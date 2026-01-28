'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessTransactionSchema, type BusinessTransactionFormData } from '@/lib/schemas'
import { useCreateBusinessTransaction } from '@/hooks/use-business-transactions'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface BusinessTransactionFormProps {
  members: Array<{ id: string; full_name: string; phone: string }>
  groups: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function BusinessTransactionForm({
  members,
  groups,
  onSuccess,
}: BusinessTransactionFormProps) {
  const { mutate: createTransaction, isPending } = useCreateBusinessTransaction()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const form = useForm<BusinessTransactionFormData>({
    resolver: zodResolver(businessTransactionSchema),
    defaultValues: {
      transaction_type: 'direct_business',
      member_from_id: '',
      member_to_id: null,
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      consortium_group_id: null,
      notes: null,
    },
  })

  const transactionType = form.watch('transaction_type')

  const onSubmit = (data: BusinessTransactionFormData) => {
    // Format amount to number
    const formattedData = {
      ...data,
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      transaction_date: date ? format(date, 'yyyy-MM-dd') : undefined,
    }

    createTransaction(formattedData, {
      onSuccess: () => {
        form.reset()
        setDate(new Date())
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Transaction Type */}
        <FormField
          control={form.control}
          name="transaction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Transação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="direct_business">Negócio Direto</SelectItem>
                  <SelectItem value="referral">Indicação/Referral</SelectItem>
                  <SelectItem value="consortium">Consórcio</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {transactionType === 'direct_business' &&
                  'Negócio realizado diretamente entre membros'}
                {transactionType === 'referral' && 'Indicação de um membro para outro'}
                {transactionType === 'consortium' && 'Transação relacionada a consórcio'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Member From */}
        <FormField
          control={form.control}
          name="member_from_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membro de Origem (Quem deu/indicou)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o membro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Member To (only for direct_business and referral) */}
        {transactionType !== 'consortium' && (
          <FormField
            control={form.control}
            name="member_to_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membro de Destino (Quem recebeu)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o membro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} ({member.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Consortium Group (only for consortium) */}
        {transactionType === 'consortium' && (
          <FormField
            control={form.control}
            name="consortium_group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo de Consórcio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>Valor da transação em reais</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a transação..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detalhe o que foi negociado ou indicado
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transaction Date */}
        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Transação</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      {date ? (
                        format(date, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      field.onChange(newDate ? format(newDate, 'yyyy-MM-dd') : '')
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date('2000-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Data em que a transação ocorreu</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais..."
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Registrando...' : 'Registrar Transação'}
        </Button>
      </form>
    </Form>
  )
}
