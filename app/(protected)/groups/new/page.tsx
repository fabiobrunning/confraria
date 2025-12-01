'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function GroupNewPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_value: '',
    total_quotas: '',
    monthly_value: '',
    adjustment_type: 'none' as 'monthly' | 'annual' | 'none',
    adjustment_value: '',
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await (supabase
        .from('groups') as any)
        .insert({
          name: formData.name,
          description: formData.description || null,
          asset_value: parseFloat(formData.asset_value),
          total_quotas: parseInt(formData.total_quotas),
          monthly_value: parseFloat(formData.monthly_value),
          adjustment_type: formData.adjustment_type,
          adjustment_value: formData.adjustment_value ? parseFloat(formData.adjustment_value) : 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Grupo criado com sucesso!',
        description: 'Agora voce pode vincular cotas aos membros',
      })

      router.push(`/groups/${data.id}`)
    } catch (error) {
      toast({
        title: 'Erro ao criar grupo',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Novo Grupo de Consorcio
          </h1>
          <p className="text-muted-foreground">Cadastre um novo grupo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Ex: Grupo A, Grupo Florianopolis, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Informacoes adicionais sobre o grupo"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset_value">Valor do Bem *</Label>
                <Input
                  id="asset_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.asset_value}
                  onChange={(e) =>
                    setFormData({ ...formData, asset_value: e.target.value })
                  }
                  required
                  placeholder="Ex: 50000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_value">Valor Mensal *</Label>
                <Input
                  id="monthly_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_value}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_value: e.target.value })
                  }
                  required
                  placeholder="Ex: 500.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_quotas">Quantidade de Cotas *</Label>
              <Input
                id="total_quotas"
                type="number"
                min="1"
                value={formData.total_quotas}
                onChange={(e) =>
                  setFormData({ ...formData, total_quotas: e.target.value })
                }
                required
                placeholder="Ex: 100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adjustment_type">Tipo de Reajuste</Label>
                <Select
                  value={formData.adjustment_type}
                  onValueChange={(value: 'monthly' | 'annual' | 'none') =>
                    setFormData({ ...formData, adjustment_type: value, adjustment_value: value === 'none' ? '' : formData.adjustment_value })
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
                      setFormData({ ...formData, adjustment_value: e.target.value })
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

            <div className="flex gap-4">
              <Link href="/groups" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Grupo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
