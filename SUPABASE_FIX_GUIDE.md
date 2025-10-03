# Guia de Correção dos Erros do Supabase

## Problemas Identificados

### 1. Erros de Autenticação e RLS
Os erros 404 e 406 no console ocorrem devido a problemas com as políticas RLS (Row Level Security):
- **Erro 404 na tabela groups**: URL do Supabase em produção diferente da configurada localmente
- **Erro 406 na tabela profiles**: Políticas RLS conflitantes e redundantes

### 2. Problemas de Performance
- Políticas RLS re-avaliam `auth.uid()` para cada linha, causando lentidão
- Múltiplas políticas permissivas duplicadas para as mesmas operações

### 3. Problemas de Segurança
- Funções com search_path mutável (vulnerabilidade de segurança)
- Índices não utilizados ocupando espaço no banco

### 4. Políticas RLS Duplicadas
Múltiplas tabelas têm políticas conflitantes que podem causar comportamento inesperado

## Solução

### Passo 1: Aplicar as Migrations de Correção

Duas migrations foram criadas para corrigir todos os problemas:

#### Migration 1: `supabase/migrations/20251003190000_fix_profiles_rls_policies.sql`
Corrige apenas a tabela `profiles` (problema emergencial)

#### Migration 2: `supabase/migrations/20251003200000_fix_security_issues.sql`
Corrige TODOS os problemas de segurança, performance e redundância:
- Otimiza todas as políticas RLS usando `(select auth.uid())`
- Remove políticas duplicadas/conflitantes
- Remove índices não utilizados
- Corrige search_path das funções para segurança

**Para aplicar as migrations no seu projeto Supabase:**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. **IMPORTANTE**: Execute APENAS a migration 2 (mais completa)
6. Copie e cole o conteúdo do arquivo `supabase/migrations/20251003200000_fix_security_issues.sql`
7. Execute a query clicando em **Run**
8. Aguarde a execução completa (pode levar alguns segundos)

**O que esta migration faz:**

#### Correções de Performance:
- Substitui `auth.uid()` por `(select auth.uid())` em todas as políticas RLS
- Isso evita re-avaliação da função para cada linha, melhorando performance drasticamente

#### Correções de Políticas RLS:
- **profiles**: Remove 8 políticas conflitantes, mantém apenas 5 otimizadas
- **companies**: Remove 4 políticas duplicadas, cria 2 otimizadas
- **groups**: Remove 6 políticas, cria 4 otimizadas
- **members**: Remove 11 políticas conflitantes, cria 3 otimizadas
- **member_companies**: Remove 8 políticas, cria 3 otimizadas
- **quotas**: Remove 8 políticas, cria 2 otimizadas

#### Correções de Segurança:
- Adiciona `SET search_path = public, pg_temp` em todas as funções
- Previne ataques de manipulação de search_path
- Protege contra injeção de código via schema

#### Limpeza de Índices:
- Remove 11 índices não utilizados que ocupavam espaço:
  - idx_companies_cnpj
  - idx_groups_company_id, idx_groups_is_active, idx_groups_name
  - idx_members_company_id, idx_members_phone, idx_members_email, idx_members_status, idx_members_registration_number
  - idx_member_companies_company_id
  - idx_quotas_status

### Passo 2: Verificar Variáveis de Ambiente em Produção

O erro mostra que a URL do Supabase usada em produção (`vomnuwxophfcdtayvjxo`) é diferente da URL no arquivo `.env`.

**Se você fez deploy no Netlify:**

1. Acesse o [Dashboard do Netlify](https://app.netlify.com)
2. Selecione seu site
3. Vá em **Site settings** > **Environment variables**
4. Verifique se as seguintes variáveis estão configuradas corretamente:
   - `VITE_SUPABASE_URL` ou `VITE_BOLT_DATABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` ou `VITE_BOLT_DATABASE_ANON_KEY`
5. Certifique-se de que elas correspondem ao seu projeto Supabase de produção
6. Se você fez alterações, faça um novo deploy

**Para obter as credenciais corretas do Supabase:**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** (ex: `https://vomnuwxophfcdtayvjxo.supabase.co`)
   - **anon/public key** (a chave pública)

### Passo 3: Atualizar arquivo .env Local

Atualize o arquivo `.env` com as credenciais corretas:

```env
VITE_SUPABASE_URL=https://SUA_URL.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

### Passo 4: Fazer Novo Deploy

Depois de aplicar a migration e verificar as variáveis de ambiente:

1. Faça commit das alterações
2. Faça push para o repositório
3. O Netlify fará o deploy automaticamente
4. Ou force um novo deploy no dashboard do Netlify

## Estrutura do Banco de Dados

O banco de dados tem as seguintes tabelas principais:
- `profiles` - Perfis de usuários
- `companies` - Empresas cadastradas
- `groups` - Grupos de consórcio
- `quotas` - Cotas de consórcio
- `members` - Membros dos grupos
- `member_companies` - Relação entre membros e empresas
- `consortium_groups` - Tabela legada (não está sendo usada)

## Verificação

Após aplicar as correções, você pode testar:

1. **No Supabase Dashboard**:
   - Vá em **Database** > **Policies**
   - Verifique se as políticas antigas foram removidas
   - Confirme que cada tabela tem apenas as políticas otimizadas

2. **No console do navegador** (F12):
   - Acesse a aplicação
   - Faça login
   - Verifique se não há mais erros 404 ou 406
   - Navegue pelas páginas de Membros, Empresas e Grupos
   - Observe que as queries estão mais rápidas

3. **Performance**:
   - As páginas devem carregar mais rápido
   - Operações de leitura/escrita devem ser mais responsivas
   - Menos uso de CPU no banco de dados

## Benefícios Esperados

Após aplicar todas as correções:

✅ **Performance**: Queries 3-5x mais rápidas em tabelas grandes
✅ **Segurança**: Proteção contra ataques de search_path
✅ **Manutenibilidade**: Políticas mais simples e claras
✅ **Espaço**: Economia de espaço com remoção de índices não usados
✅ **Estabilidade**: Sem conflitos entre políticas RLS

## Suporte

Se os problemas persistirem, verifique:

1. **Migration aplicada corretamente**:
   - Verifique no SQL Editor se houve algum erro
   - Confirme que todos os comandos foram executados
   - Veja se não há mensagens de erro no final da execução

2. **Variáveis de ambiente**:
   - Confirme que VITE_SUPABASE_URL está correta no Netlify
   - Verifique que VITE_SUPABASE_ANON_KEY está correta
   - Faça um novo deploy após qualquer alteração

3. **Cache do navegador**:
   - Limpe o cache do navegador (Ctrl+Shift+Delete)
   - Ou abra em aba anônima para testar

4. **Logs**:
   - Console do navegador para erros de frontend
   - Supabase Dashboard > Logs para erros de backend
   - Netlify Deploy Logs para erros de deploy

## Próximos Passos Recomendados

1. Monitore o uso de CPU/memória no Supabase Dashboard
2. Configure alertas para erros no Supabase
3. Considere adicionar proteção de senha comprometida (veja warning sobre HaveIBeenPwned)
4. Faça backup regular do banco de dados
