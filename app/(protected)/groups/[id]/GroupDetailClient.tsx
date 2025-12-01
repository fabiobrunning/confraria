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
import { ArrowLeft, Dices, Save, Loader2, TrendingUp } from 'lucide-react'

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
  quotas: initialQuotas,
  members,
  activeQuotasCount,
}: GroupDetailClientProps) {
  const [saving, setSaving] = useState(false)
  const [applyingAdjustment, setApplyingAdjustment] = useState(false)
  const [quotas, setQuotas] = useState(initialQuotas)
  const [savingQuota, setSavingQuota] = useState<string | null>(null)
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

  // Calcula o valor do bem baseado no valor mensal x total de cotas
  const calculateAssetValue = (monthlyValue: number) => {
    return monthlyValue * group.total_quotas
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const monthlyValue = parseFloat(formData.monthly_value)
      const calculatedAssetValue = calculateAssetValue(monthlyValue)

      const { error } = await supabase
        .from('groups' as never)
        .update({
          name: formData.name,
          description: formData.description || null,
          asset_value: calculatedAssetValue,
          monthly_value: monthlyValue,
          adjustment_type: formData.adjustment_type,
          adjustment_value: formData.adjustment_value ? parseFloat(formData.adjustment_value) : 0,
        } as never)
        .eq('id', group.id)

      if (error) throw error

      // Atualiza o formData com o valor calculado
      setFormData(prev => ({ ...prev, asset_value: calculatedAssetValue.toString() }))

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

  // Aplica o reajuste ao valor mensal e recalcula o valor do bem
  const handleApplyAdjustment = async () => {
    if (formData.adjustment_type === 'none' || parseFloat(formData.adjustment_value) === 0) {
      toast({
        title: 'Nenhum reajuste configurado',
        description: 'Configure o tipo e valor do reajuste primeiro.',
        variant: 'destructive',
      })
      return
    }

    setApplyingAdjustment(true)
    try {
      const currentMonthlyValue = parseFloat(formData.monthly_value)
      const adjustmentValue = parseFloat(formData.adjustment_value)
      const newMonthlyValue = currentMonthlyValue + adjustmentValue
      const newAssetValue = calculateAssetValue(newMonthlyValue)

      const { error } = await supabase
        .from('groups' as never)
        .update({
          monthly_value: newMonthlyValue,
          asset_value: newAssetValue,
        } as never)
        .eq('id', group.id)

      if (error) throw error

      // Atualiza o formData com os novos valores
      setFormData(prev => ({
        ...prev,
        monthly_value: newMonthlyValue.toString(),
        asset_value: newAssetValue.toString(),
      }))

      toast({
        title: 'Reajuste aplicado',
        description: `Valor mensal atualizado de ${formatCurrency(currentMonthlyValue)} para ${formatCurrency(newMonthlyValue)}`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro ao aplicar reajuste',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setApplyingAdjustment(false)
    }
  }

  const handleQuotaUpdate = async (quotaId: string, field: 'member_id' | 'status', value: string | null) => {
    setSavingQuota(quotaId)
    try {
      const updateData = field === 'member_id'
        ? { member_id: value === 'none' ? null : value }
        : { status: value }

      const { error } = await supabase
        .from('quotas' as never)
        .update(updateData as never)
        .eq('id', quotaId)

      if (error) throw error

      // Update local state
      setQuotas(prev => prev.map(q => {
        if (q.id === quotaId) {
          if (field === 'member_id') {
            const selectedMember = value === 'none' ? null : members.find(m => m.id === value)
            return { ...q, member_id: value === 'none' ? null : value, member: selectedMember || null }
          } else {
            return { ...q, status: value as string }
          }
        }
        return q
      }))

      toast({
        title: 'Cota atualizada',
        description: field === 'member_id' ? 'Proprietario alterado' : 'Status alterado',
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cota',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSavingQuota(null)
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
              <Label htmlFor="asset_value">Valor do Bem (calculado automaticamente)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="asset_value"
                  type="text"
                  value={formatCurrency(calculateAssetValue(parseFloat(formData.monthly_value) || 0))}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                = Valor Mensal x {group.total_quotas} cotas
              </p>
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
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 space-y-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {formData.adjustment_type === 'monthly'
                  ? 'Reajuste Mensal Configurado'
                  : 'Reajuste Anual Configurado'}
              </p>
              <p className="text-xs text-muted-foreground">
                Ao aplicar o reajuste, o valor de {formatCurrency(parseFloat(formData.adjustment_value) || 0)} sera somado ao valor mensal atual.
              </p>
              <p className="text-xs text-muted-foreground">
                Novo valor mensal: {formatCurrency((parseFloat(formData.monthly_value) || 0) + (parseFloat(formData.adjustment_value) || 0))}
              </p>
              <p className="text-xs text-muted-foreground">
                Novo valor do bem: {formatCurrency(calculateAssetValue((parseFloat(formData.monthly_value) || 0) + (parseFloat(formData.adjustment_value) || 0)))}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            {formData.adjustment_type !== 'none' && parseFloat(formData.adjustment_value) > 0 && (
              <Button
                variant="outline"
                onClick={handleApplyAdjustment}
                disabled={applyingAdjustment || saving}
                className="border-amber-500 text-amber-600 hover:bg-amber-500/10"
              >
                {applyingAdjustment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <TrendingUp className="mr-2 h-4 w-4" />
                Aplicar Reajuste
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || applyingAdjustment}>
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
                      <Select
                        value={quota.member_id || 'none'}
                        onValueChange={(value) => handleQuotaUpdate(quota.id, 'member_id', value)}
                        disabled={savingQuota === quota.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o proprietario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem proprietario</SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={quota.status}
                        onValueChange={(value) => handleQuotaUpdate(quota.id, 'status', value)}
                        disabled={savingQuota === quota.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="contemplated">Contemplada</SelectItem>
                        </SelectContent>
                      </Select>
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
