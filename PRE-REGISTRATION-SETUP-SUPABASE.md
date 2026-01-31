# ⚠️ SETUP OBRIGATÓRIO: Aplicar Migration ao Supabase

**IMPORTANTE**: Os arquivos de código foram commitados, mas a migration do banco de dados AINDA NÃO foi aplicada ao Supabase.

## 🔧 Passo 1: Aplicar Migration ao Supabase

A migration está em:
```
supabase/migrations/20260131120000_create_pre_registration_attempts_table.sql
```

### Opção A: Via Supabase CLI (Recomendado)

```bash
cd confraria
npx supabase link  # Se não estiver linkedado
npx supabase db push
```

### Opção B: Via Dashboard Supabase (Manual)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: SQL Editor → New Query
4. Cole o conteúdo de: `supabase/migrations/20260131120000_create_pre_registration_attempts_table.sql`
5. Clique em "Run"

## 🔄 Passo 2: Regenerar Tipos TypeScript

Após aplicar a migration:

```bash
npm run db:generate-types
# Ou manualmente:
npx supabase gen types typescript --project-id=seu-project-id > lib/supabase/types.ts
```

## ✅ Verificar se Funcionou

Após regenerar os tipos:

```bash
# TypeScript deve passar sem erros
npx tsc --noEmit

# Lint também
npm run lint

# Tudo ok!
npm run dev
```

## 📍 Status Atual

```
✅ Código commitado
❌ Migration não aplicada (Supabase em read-only)
❌ Tipos TypeScript desatualizados
⏳ Aguardando aplicação da migration
```

## 🚀 Próximo Passo

Aplique a migration ao seu Supabase projeto seguindo um dos métodos acima.

---

**CRÍTICO**: Sem aplicar a migration, você terá erros de TypeScript ao tentar usar o sistema. Todos os erros desaparecem após este setup.
