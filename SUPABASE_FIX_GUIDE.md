# Guia de Correção dos Erros do Supabase

## Problema Identificado

Os erros 404 e 406 que você está vendo no console ocorrem devido a problemas com as políticas RLS (Row Level Security) da tabela `profiles` no Supabase.

### Erros observados:
1. **Erro 404 na tabela groups**: A URL mostrada no erro (`vomnuwxophfcdtayvjxo.supabase.co`) é diferente da URL no arquivo `.env` (`0ec90b57d6e95fcbda19832f.supabase.co`)
2. **Erro 406 na tabela profiles**: As políticas RLS têm conflitos e redundâncias que causam problemas de autorização

## Solução

### Passo 1: Aplicar a Migration de Correção RLS

Uma nova migration foi criada em: `supabase/migrations/20251003190000_fix_profiles_rls_policies.sql`

**Para aplicar esta migration no seu projeto Supabase:**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase/migrations/20251003190000_fix_profiles_rls_policies.sql`
6. Execute a query clicando em **Run**

Esta migration irá:
- Remover todas as políticas RLS conflitantes da tabela `profiles`
- Criar políticas simples e sem recursão:
  - Usuários autenticados podem visualizar todos os perfis
  - Usuários podem atualizar apenas seu próprio perfil
  - Usuários podem inserir seu próprio perfil no signup
  - Admins podem inserir qualquer perfil
  - Admins podem deletar perfis

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

1. Abra o console do navegador (F12)
2. Acesse a aplicação
3. Faça login
4. Verifique se não há mais erros 404 ou 406
5. Navegue pelas páginas de Membros, Empresas e Grupos

## Suporte

Se os problemas persistirem, verifique:
- Se a migration foi aplicada corretamente no banco de dados
- Se as variáveis de ambiente estão corretas em produção
- Se o novo deploy foi feito com sucesso
- Logs de erro no console do navegador e no Supabase Dashboard
