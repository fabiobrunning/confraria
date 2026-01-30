'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Dices } from 'lucide-react'
import { PageContainer, PageHeader, EmptyState } from '@/components/layout'

interface Group {
  id: string
  name: string
  description: string | null
  asset_value: number
  total_quotas: number
  monthly_value: number
  is_active: boolean
  active_quotas: number
  contemplated_quotas: number
}

interface GroupsPageClientProps {
  groups: Group[]
  isAdmin: boolean
}

function GroupCard({
  group,
  isAdmin,
}: {
  group: Group
  isAdmin: boolean
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Link href={isAdmin ? `/groups/${group.id}` : '#'}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription>{group.total_quotas} cotas no total</CardDescription>
            </div>
            {isAdmin && group.active_quotas > 0 && (
              <Link href={`/groups/${group.id}/draw`} onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Dices className="h-4 w-4" />
                  Sortear
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor do Bem:</span>
              <span className="font-semibold">{formatCurrency(group.asset_value)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Mensal:</span>
              <span className="font-semibold">{formatCurrency(group.monthly_value)}</span>
            </div>
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="bg-success/10 flex-1 justify-center">
                {group.active_quotas} Ativas
              </Badge>
              <Badge variant="outline" className="bg-accent/10 flex-1 justify-center">
                {group.contemplated_quotas} Contempladas
              </Badge>
            </div>
            <Badge
              variant={group.is_active ? 'default' : 'secondary'}
              className="w-full justify-center"
            >
              {group.is_active ? 'Grupo Ativo' : 'Grupo Encerrado'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function GroupsPageClient({ groups, isAdmin }: GroupsPageClientProps) {
  return (
    <PageContainer>
      <PageHeader
        title="Grupos de Consórcio"
        description="Gerencie os grupos de consórcio"
        action={
          isAdmin && (
            <Link href="/groups/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Grupo
              </Button>
            </Link>
          )
        }
      />

      {groups.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        <EmptyState
          message="Nenhum grupo cadastrado"
          action={
            isAdmin && (
              <Link href="/groups/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Grupo
                </Button>
              </Link>
            )
          }
        />
      )}
    </PageContainer>
  )
}
