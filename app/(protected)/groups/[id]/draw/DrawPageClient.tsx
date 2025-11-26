'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DrawMachine } from '@/components/draw/DrawMachine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, AlertTriangle, Users, Dices } from 'lucide-react'

interface Quota {
  id: string
  quota_number: number
  status: string
  member: {
    id: string
    full_name: string
  } | null
}

interface Group {
  id: string
  name: string
  description: string | null
  asset_value: number
  total_quotas: number
  monthly_value: number
  is_active: boolean
}

interface Draw {
  id: string
  group_id: string
  winning_number: number
  drawn_numbers: number[]
  winner_position: number
  draw_date: string
}

interface DrawPageClientProps {
  group: Group
  quotas: Quota[]
  existingDraw: Draw | null
}

export default function DrawPageClient({
  group,
  quotas,
  existingDraw,
}: DrawPageClientProps) {
  const [saving, setSaving] = useState(false)
  const [savedDraw, setSavedDraw] = useState<Draw | null>(existingDraw)
  const router = useRouter()
  const { toast } = useToast()

  const availableNumbers = quotas.map((q) => q.quota_number)
  const quotaOwners = quotas.map((q) => ({
    number: q.quota_number,
    name: q.member?.full_name ?? null,
  }))

  const handleDrawComplete = async (
    drawnNumbers: number[],
    winningNumber: number,
    winnerPosition: number
  ) => {
    setSaving(true)

    try {
      const response = await fetch(`/api/draws/${group.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawnNumbers,
          winningNumber,
          winnerPosition,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar sorteio')
      }

      setSavedDraw(data.draw)

      toast({
        title: 'Sorteio realizado com sucesso!',
        description: `Cota #${winningNumber} foi contemplada.${
          data.groupClosed ? ' O grupo foi encerrado.' : ''
        }`,
      })

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Error saving draw:', error)
      toast({
        title: 'Erro ao salvar sorteio',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/groups/${group.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Dices className="h-7 w-7 text-accent" />
            Sorteio
          </h1>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
      </div>

      {/* Group Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Valor do Bem</p>
              <p className="font-semibold">{formatCurrency(group.asset_value)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="font-semibold">
                {formatCurrency(group.monthly_value)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Cotas</p>
              <p className="font-semibold">{group.total_quotas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponiveis</p>
              <p className="font-semibold text-green-600">
                {availableNumbers.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Draw Warning */}
      {existingDraw && !savedDraw?.id?.startsWith('new') && (
        <Card className="border-amber-500/50 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Sorteio Anterior Registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cota Ganhadora</p>
                <p className="font-bold text-lg">#{existingDraw.winning_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data</p>
                <p className="font-medium">
                  {new Date(existingDraw.draw_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm text-amber-700 mt-3">
              Um novo sorteio substituira o registro anterior.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Draw Machine */}
      {availableNumbers.length > 0 ? (
        <DrawMachine
          availableNumbers={availableNumbers}
          quotaOwners={quotaOwners}
          onDrawComplete={handleDrawComplete}
          minDraws={1}
          disabled={saving}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Dices className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  Nenhuma cota disponivel para sorteio
                </p>
                <p className="text-muted-foreground">
                  Todas as cotas deste grupo ja foram contempladas.
                </p>
              </div>
              <Link href={`/groups/${group.id}`}>
                <Button variant="outline">Voltar para o Grupo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participating Quotas */}
      {quotas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Cotas Participantes ({quotas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quotas.map((quota) => (
                <div
                  key={quota.id}
                  className="p-3 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-bold">
                      #{quota.quota_number}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {quota.member?.full_name ?? 'Sem membro'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
