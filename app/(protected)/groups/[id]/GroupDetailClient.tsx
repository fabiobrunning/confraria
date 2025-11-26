'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Dices, Save, Loader2 } from 'lucide-react'

interface Quota {
  id: string
  quota_number: number
  status: string
  member_id: string | null
  member: { id: string; full_name: string } | null
}

interface Group {
  id: string
  name: string
  description: string | null
  asset_value: number
  total_quotas: number
  monthly_value: number
  adjustment_type: 'monthly' | 'annual' | 'none' | null
  adjustment_value: number | null
  is_active: boolean
}

interface Member {
  id: string
  full_name: string
}

interface GroupDetailClientProps {
  group: Group
  quotas: Quota[]
  members: Member[]
  activeQuotasCount: number
}

export default function GroupDetailClient({
  group,
  quotas,
  members,
  activeQuotasCount,
}: GroupDetailClientProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description ?? '',
    asset_value: group.asset_value.toString(),
    monthly_value: group.monthly_value.toString(),
    adjustment_type: (group.adjustment_type ?? 'none') as 'monthly' | 'annual' | 'none',
    adjustment_value: (group.adjustment_value ?? 0).toString(),
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description || null,
          asset_value: parseFloat(formData.asset_value),
          monthly_value: parseFloat(formData.monthly_value),
          adjustment_type: formData.adjustment_type,
          adjustment_value: formData.adjustment_value ? parseFloat(formData.adjustment_value) : 0,
        })
        .eq('id', group.id)

      if (error) throw error

      toast({
        title: 'Grupo atualizado',
        description: 'As informacoes do grupo foram salvas.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">Editar grupo de consorcio</p>
        </div>
        {activeQuotasCount > 0 && (
          <Link href={`/groups/${group.id}/draw`}>
            <Button className="gap-2 bg-accent hover:bg-accent/90">
              <Dices className="h-5 w-5" />
              Realizar Sorteio
            </Button>
          </Link>
        )}
      </div>

      {/* Group Info Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes do Grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset_value">Valor do Bem</Label>
              <Input
                id="asset_value"
                type="number"
                step="0.01"
                value={formData.asset_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    asset_value: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_value">Valor Mensal</Label>
              <Input
                id="monthly_value"
                type="number"
                step="0.01"
                value={formData.monthly_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    monthly_value: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adjustment_type">Tipo de Reajuste</Label>
              <Select
                value={formData.adjustment_type}
                onValueChange={(value: 'monthly' | 'annual' | 'none') =>
                  setFormData((prev) => ({ ...prev, adjustment_type: value, adjustment_value: value === 'none' ? '0' : prev.adjustment_value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de reajuste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem reajuste</SelectItem>
                  <SelectItem value="monthly">Reajuste Mensal</SelectItem>
                  <SelectItem value="annual">Reajuste Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.adjustment_type !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="adjustment_value">Valor do Reajuste (R$)</Label>
                <Input
                  id="adjustment_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.adjustment_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, adjustment_value: e.target.value }))
                  }
                  placeholder="Ex: 10.00"
                />
              </div>
            )}
          </div>
          {formData.adjustment_type !== 'none' && (
            <p className="text-xs text-muted-foreground">
              {formData.adjustment_type === 'monthly'
                ? 'O valor sera acrescido a parcela e ao bem todo mes'
                : 'O valor sera acrescido a parcela e ao bem uma vez por ano'}
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Alteracoes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{group.total_quotas}</p>
            <p className="text-sm text-muted-foreground">Total de Cotas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              {activeQuotasCount}
            </p>
            <p className="text-sm text-muted-foreground">Cotas Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-accent">
              {quotas.filter((q) => q.status === 'contemplated').length}
            </p>
            <p className="text-sm text-muted-foreground">Contempladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quotas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cotas do Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Cota</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotas.map((quota) => (
                  <TableRow key={quota.id}>
                    <TableCell>
                      <Badge variant="outline">#{quota.quota_number}</Badge>
                    </TableCell>
                    <TableCell>
                      {quota.member?.full_name ?? (
                        <span className="text-muted-foreground italic">
                          Sem membro
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          quota.status === 'contemplated'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          quota.status === 'contemplated'
                            ? 'bg-accent'
                            : 'bg-green-500/20 text-green-700'
                        }
                      >
                        {quota.status === 'contemplated'
                          ? 'Contemplada'
                          : 'Ativa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {quotas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhuma cota cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
