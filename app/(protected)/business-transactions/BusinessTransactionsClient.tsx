'use client'

import { useState } from 'react'
import { useBusinessTransactions } from '@/hooks/use-business-transactions'
import {
  BusinessTransactionForm,
  BusinessTransactionsList,
  DashboardStatsCards,
} from '@/components/business-transactions'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout'

interface BusinessTransactionsClientProps {
  members: Array<{ id: string; full_name: string; phone: string }>
  groups: Array<{ id: string; name: string }>
  currentUserId: string
  isAdmin: boolean
}

export default function BusinessTransactionsClient({
  members,
  groups,
  currentUserId,
  isAdmin,
}: BusinessTransactionsClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Fetch transactions (with optional filters)
  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useBusinessTransactions({
      limit: 100,
    })

  // Fetch dashboard stats (admin only)
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats()

  const transactions = transactionsData?.transactions || []

  // Filter transactions based on active tab
  const filteredTransactions =
    activeTab === 'all'
      ? transactions
      : transactions.filter((t) => t.transaction_type === activeTab)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações de Negócios"
        description="Gerencie negócios diretos, indicações e transações de consórcio"
        action={
          isAdmin && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Transação
                </>
              )}
            </Button>
          )
        }
      />

      {/* Dashboard Stats (Admin only) */}
      {isAdmin && (
        <DashboardStatsCards stats={stats} isLoading={isLoadingStats} />
      )}

      {/* New Transaction Form (Admin only) */}
      {isAdmin && showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nova Transação</CardTitle>
            <CardDescription>
              Preencha os dados da transação de negócio, indicação ou consórcio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessTransactionForm
              members={members}
              groups={groups}
              onSuccess={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Transactions List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            Visualize todas as transações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todas ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="direct_business">
                Negócios (
                {transactions.filter((t) => t.transaction_type === 'direct_business').length}
                )
              </TabsTrigger>
              <TabsTrigger value="referral">
                Indicações (
                {transactions.filter((t) => t.transaction_type === 'referral').length})
              </TabsTrigger>
              <TabsTrigger value="consortium">
                Consórcio (
                {transactions.filter((t) => t.transaction_type === 'consortium').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <BusinessTransactionsList
                transactions={filteredTransactions}
                currentUserId={currentUserId}
                isLoading={isLoadingTransactions}
                emptyMessage={
                  activeTab === 'all'
                    ? 'Nenhuma transação encontrada'
                    : `Nenhuma transação do tipo ${
                        activeTab === 'direct_business'
                          ? 'Negócio Direto'
                          : activeTab === 'referral'
                            ? 'Indicação'
                            : 'Consórcio'
                      } encontrada`
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
