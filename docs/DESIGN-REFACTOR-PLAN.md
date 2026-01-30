# Plano de Refatoração de Design - Confraria Pedra Branca

**Data:** 2026-01-30
**Responsável:** @ux-design-expert (Uma) → @dev (Dex)
**Objetivo:** Padronizar design system em todas as páginas

---

## ✅ FASE 1: COMPONENTES ATÔMICOS (COMPLETO)

### Criados:
- ✅ `components/layout/PageContainer.tsx` - Container padrão com padding responsivo
- ✅ `components/layout/PageHeader.tsx` - Cabeçalho com título, descrição, ícone e ação
- ✅ `components/layout/EmptyState.tsx` - Estado vazio consistente
- ✅ `components/layout/index.ts` - Exports centralizados
- ✅ `components/ui/badge.tsx` - Adicionado variant `warning`

---

## 🔄 FASE 2: REFATORAÇÃO DE PÁGINAS (PENDENTE - @dev)

### 2.1 Dashboard (`app/(protected)/dashboard/page.tsx`)

**Linha 106:**
```tsx
// ANTES:
<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
      Dashboard
    </h1>
    <p className="text-sm sm:text-base text-muted-foreground">
      Visao geral do sistema de consorcios
    </p>
  </div>

// DEPOIS:
import { PageContainer, PageHeader } from '@/components/layout'

<PageContainer>
  <PageHeader
    title="Dashboard"
    description="Visão geral do sistema de consórcios"
  />
```

---

### 2.2 Members (`app/(protected)/members/page.tsx`)

**Importar componentes (topo do arquivo):**
```tsx
import { PageContainer, PageHeader, EmptyState } from '@/components/layout'
```

**Linha 177:**
```tsx
// ANTES:
<div className="p-4 sm:p-6 space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">Membros</h1>
      <p className="text-muted-foreground">Gerencie os membros do sistema</p>
    </div>
    {isAdmin && (
      <Link href="/pre-register">
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Membro
        </Button>
      </Link>
    )}
  </div>

// DEPOIS:
<PageContainer>
  <PageHeader
    title="Membros"
    description="Gerencie os membros do sistema"
    action={
      isAdmin && (
        <Link href="/pre-register">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </Link>
      )
    }
  />
```

**Linha 203 (Empty State):**
```tsx
// ANTES:
<div className="text-center py-8">
  <p className="text-muted-foreground mb-4">Nenhum membro cadastrado</p>
  {isAdmin && (
    <Link href="/pre-register">
      <Button>
        <UserPlus className="mr-2 h-4 w-4" />
        Cadastrar Primeiro Membro
      </Button>
    </Link>
  )}
</div>

// DEPOIS:
<EmptyState
  message="Nenhum membro cadastrado"
  action={
    isAdmin && (
      <Link href="/pre-register">
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar Primeiro Membro
        </Button>
      </Link>
    )
  }
/>
```

**Linha 228 (Badge com cor hardcoded):**
```tsx
// ANTES:
<Badge
  variant="outline"
  className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
>
  Pré-Cadastro
</Badge>

// DEPOIS:
<Badge variant="warning">
  Pré-Cadastro
</Badge>
```

---

### 2.3 Groups (`app/(protected)/groups/GroupsPageClient.tsx`)

**Importar componentes (topo do arquivo):**
```tsx
import { PageContainer, PageHeader, EmptyState } from '@/components/layout'
```

**Linha 95:**
```tsx
// ANTES:
<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
  <div className="flex flex-col gap-3">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">Grupos de Consorcio</h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        Gerencie os grupos de consorcio
      </p>
    </div>
    {isAdmin && (
      <Link href="/groups/new" className="w-full sm:w-auto sm:self-start">
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </Link>
    )}
  </div>

// DEPOIS:
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
```

**Linha 121 (Empty State):**
```tsx
// ANTES:
<Card>
  <CardContent className="py-12 text-center">
    <p className="text-muted-foreground">Nenhum grupo cadastrado</p>
    {isAdmin && (
      <Link href="/groups/new">
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Criar Primeiro Grupo
        </Button>
      </Link>
    )}
  </CardContent>
</Card>

// DEPOIS:
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
```

---

### 2.4 Business Transactions (`app/(protected)/business-transactions/page.tsx`)

**Linha 46:**
```tsx
// ANTES:
<div className="p-8">
  <BusinessTransactionsClient ... />
</div>

// DEPOIS:
import { PageContainer } from '@/components/layout'

<PageContainer>
  <BusinessTransactionsClient ... />
</PageContainer>
```

**Em `BusinessTransactionsClient.tsx` linha 56:**
```tsx
// ANTES:
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Transações de Negócios</h1>
      <p className="text-muted-foreground">
        Gerencie negócios diretos, indicações e transações de consórcio
      </p>
    </div>
    {isAdmin && (
      <Button onClick={() => setShowForm(!showForm)}>
        ...
      </Button>
    )}
  </div>

// DEPOIS:
import { PageHeader } from '@/components/layout'

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
```

---

### 2.5 Prospects (`app/(protected)/admin/prospects/page.tsx`)

**Importar componentes (topo do arquivo):**
```tsx
import { PageContainer, PageHeader } from '@/components/layout'
```

**Linha 175:**
```tsx
// ANTES:
<div className="p-4 sm:p-6 space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
        <Users className="w-8 h-8 text-accent" />
        Interessados
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Gerencie os prospects que demonstraram interesse na Confraria
      </p>
    </div>
    <Button
      onClick={handleExportCSV}
      disabled={exporting || loading}
      variant="outline"
      className="gap-2"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Exportar CSV
    </Button>
  </div>

// DEPOIS:
<PageContainer>
  <PageHeader
    title="Interessados"
    description="Gerencie os prospects que demonstraram interesse na Confraria"
    icon={Users}
    action={
      <Button
        onClick={handleExportCSV}
        disabled={exporting || loading}
        variant="outline"
        className="gap-2"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Exportar CSV
      </Button>
    }
  />
```

---

## 🎨 FASE 3: SUBSTITUIR CORES HARDCODED (PENDENTE - @dev)

### 3.1 ProspectStatusBadge (`app/(protected)/admin/prospects/components/ProspectStatusBadge.tsx`)

**Linhas 11-37:**
```tsx
// ANTES:
const statusConfig: Record<ProspectStatus, { label: string; className: string; icon: string }> = {
  new: {
    label: 'Novo',
    className: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    icon: ''
  },
  contacted: {
    label: 'Contatado',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    icon: ''
  },
  in_progress: {
    label: 'Em Andamento',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
    icon: ''
  },
  converted: {
    label: 'Convertido',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
    icon: ''
  },
  rejected: {
    label: 'Rejeitado',
    className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    icon: ''
  },
}

// No JSX (linha 44):
<Badge
  variant="outline"
  className={`${config.className} ${className}`}
>
  {config.icon} {config.label}
</Badge>

// DEPOIS:
import type { BadgeProps } from '@/components/ui/badge'

const statusConfig: Record<
  ProspectStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  new: {
    label: 'Novo',
    variant: 'success',
  },
  contacted: {
    label: 'Contatado',
    variant: 'warning',
  },
  in_progress: {
    label: 'Em Andamento',
    variant: 'default',
  },
  converted: {
    label: 'Convertido',
    variant: 'success',
  },
  rejected: {
    label: 'Rejeitado',
    variant: 'destructive',
  },
}

// No JSX:
<Badge variant={config.variant} className={className}>
  {config.label}
</Badge>
```

---

### 3.2 DashboardStatsCards (`components/business-transactions/DashboardStatsCards.tsx`)

**Linhas 20-25:**
```tsx
// ANTES:
<div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
<div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
<div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
<div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

// DEPOIS:
<div className="h-4 w-24 bg-muted rounded animate-pulse" />
<div className="h-4 w-4 bg-muted rounded animate-pulse" />
<div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
<div className="h-3 w-24 bg-muted rounded animate-pulse" />
```

---

## 🔤 FASE 4: SIMPLIFICAR FONTES (PENDENTE - @dev)

### 4.1 tailwind.config.ts

**Linhas 17-27:**
```ts
// ANTES:
fontFamily: {
  'sans': ['Afacad Flux', 'Inter', 'system-ui', 'sans-serif'],
  'serif': ['Aleo', 'Cormorant Garamond', 'Georgia', 'serif'],
  'mono': ['Azeret Mono', 'ui-monospace', 'monospace'],
  'display': ['Archive', 'system-ui', 'sans-serif'],
  'inter': ['Inter', 'system-ui', 'sans-serif'],
  'archive': ['Archive', 'system-ui', 'sans-serif'],
  'cormorant': ['Cormorant Garamond', 'Georgia', 'serif'],
  'afacad': ['Afacad Flux', 'system-ui', 'sans-serif'],
  'aleo': ['Aleo', 'Georgia', 'serif'],
  'azeret': ['Azeret Mono', 'ui-monospace', 'monospace'],
},

// DEPOIS (apenas 3 famílias):
fontFamily: {
  'sans': ['Inter', 'system-ui', 'sans-serif'],
  'display': ['Cormorant Garamond', 'Georgia', 'serif'],
  'mono': ['ui-monospace', 'monospace'],
},
```

### 4.2 app/globals.css

**Linhas 1-2:**
```css
/* ANTES: */
@import url('https://fonts.googleapis.com/css2?family=Archive&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100;200;300;400;500;600;700;800;900&family=Aleo:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Azeret+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

/* DEPOIS (apenas 2 famílias): */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap');
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após implementar, validar:

- [ ] Todas as páginas usam `PageContainer`
- [ ] Todas as páginas usam `PageHeader` com padrão consistente
- [ ] Empty states usam componente `EmptyState`
- [ ] Nenhuma cor hardcoded (exceto CSS variables)
- [ ] ProspectStatusBadge usa variants do Badge
- [ ] DashboardStatsCards usa `bg-muted`
- [ ] Members page usa Badge variant="warning"
- [ ] Apenas 3 famílias de fonte no config
- [ ] Apenas 2 imports de Google Fonts
- [ ] Testar em mobile (p-4) e desktop (sm:p-6)
- [ ] Testar dark mode em todas as páginas

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Componentes de header | 5 versões | 1 componente | -80% |
| Cores hardcoded | 18 arquivos | 0 arquivos | -100% |
| Famílias de fonte | 10 | 3 | -70% |
| Peso Google Fonts | ~200KB | ~50KB | -75% |
| Linhas de código (total) | ~150 linhas repetidas | ~30 linhas (componente) | -80% |

---

**Próximo passo:** Ativar @dev para implementar as refatorações.
