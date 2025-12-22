# ✅ Checklist de Testes - Confraria Pedra Branca

🚀 **Servidor rodando em:** http://localhost:3000

---

## 🔍 1. ÁREA PÚBLICA (Antes do Login)

### ✅ Página de Login (`/auth`)
- [ ] Acessar http://localhost:3000/auth
- [ ] **VERIFICAR:** Tema preto/branco/dourado ORIGINAL está mantido
- [ ] **VERIFICAR:** Fontes Inter/Archive/Cormorant (antigas) sendo usadas
- [ ] **VERIFICAR:** Logo "Confraria Pedra Branca" aparece
- [ ] **VERIFICAR:** Campos de telefone e senha estão visíveis
- [ ] Tentar fazer login com credenciais válidas

**Resultado esperado:** Página de login mantém o tema ORIGINAL (sem mudanças de cores)

---

## 🎨 2. ÁREA DE MEMBROS (Após Login) - NOVA PALETA

### ✅ Verificar Nova Paleta de Cores

#### A. Dashboard (`/dashboard`)
- [ ] Fazer login e acessar dashboard
- [ ] **VERIFICAR:** Background claro (#fdfdfd) ou escuro (#202023)
- [ ] **VERIFICAR:** Cards com nova paleta (roxo/azul suave)
- [ ] **VERIFICAR:** Sidebar com novas cores
- [ ] **VERIFICAR:** Fontes Afacad Flux, Aleo, Azeret Mono sendo usadas

#### B. Verificar Tema Claro vs Escuro
- [ ] Alternar tema (se tiver toggle de dark mode)
- [ ] **Tema Claro:** Background #fdfdfd, Primary roxo #a284e8
- [ ] **Tema Escuro:** Background #202023, Cards #292a2d

#### C. Inspecionar Elemento (F12)
- [ ] Abrir DevTools → Elements
- [ ] Verificar que a tag `<div>` do layout tem classe `member-area`
- [ ] Inspecionar variáveis CSS: `--background`, `--primary`, `--accent`
- [ ] Confirmar que cores HSL da nova paleta estão sendo aplicadas

---

## 👥 3. PRÉ-CADASTRO DE MEMBROS

### ✅ Criar Novo Membro (`/pre-register`)
- [ ] Acessar http://localhost:3000/pre-register (como admin)
- [ ] Preencher formulário:
  - Nome: "João Teste"
  - Telefone: "(48) 99999-9999"
  - Tipo: Membro
- [ ] Clicar em "Criar Pré-Cadastro"
- [ ] **VERIFICAR:** Diálogo com senha temporária de 6 dígitos aparece
- [ ] **VERIFICAR:** Botão de copiar senha funciona
- [ ] Copiar a senha e anotar

### ✅ Verificar Lista de Pré-Cadastros
- [ ] **VERIFICAR:** "João Teste" aparece na lista de pré-cadastrados
- [ ] **VERIFICAR:** Badge "Pré-Cadastro" está visível
- [ ] **VERIFICAR:** Telefone está correto

### ✅ Excluir Pré-Cadastro
- [ ] Clicar no botão de "Excluir" (lixeira)
- [ ] **VERIFICAR:** Diálogo de confirmação aparece
- [ ] Confirmar exclusão
- [ ] **VERIFICAR:** Membro removido da lista
- [ ] **VERIFICAR:** Toast de sucesso aparece

---

## 📋 4. GERENCIAMENTO DE MEMBROS

### ✅ Listar Membros (`/members`)
- [ ] Acessar http://localhost:3000/members
- [ ] **VERIFICAR:** Todos os membros aparecem na lista
- [ ] **VERIFICAR:** Badge "Admin" ou "Membro" está visível
- [ ] **VERIFICAR:** Badge "Pré-Cadastro" em membros não finalizados
- [ ] **VERIFICAR:** Informações: telefone, instagram, cidade/estado

### ✅ Editar Membro
- [ ] Clicar no botão "Editar" de qualquer membro
- [ ] **VERIFICAR:** Diálogo modal abre com formulário completo
- [ ] Alterar algum campo (ex: nome, instagram)
- [ ] Clicar em "Salvar Alterações"
- [ ] **VERIFICAR:** Toast de sucesso
- [ ] **VERIFICAR:** Alteração refletida na lista

### ✅ Tentar Excluir Membro
- [ ] Clicar no botão "Excluir"
- [ ] **VERIFICAR:** Diálogo de confirmação aparece
- [ ] **VERIFICAR:** Se membro tem cotas, erro deve aparecer
- [ ] **VERIFICAR:** Se não tem cotas, exclusão ocorre com sucesso

---

## 🏢 5. PÁGINA DE EMPRESAS

### ✅ Visualizar Cards de Empresas (`/companies`)
- [ ] Acessar http://localhost:3000/companies
- [ ] **VERIFICAR:** Cards de empresas aparecem em grid (3 colunas desktop)
- [ ] **VERIFICAR:** Cada card mostra:
  - ✓ Nome da empresa
  - ✓ Descrição (limitada a 3 linhas)
  - ✓ CNPJ (se houver)
  - ✓ Endereço completo
  - ✓ Instagram/site com ícone
  - ✓ Telefone (APENAS se diferente do telefone do membro)
  - ✓ Badge com nome do membro dono

### ✅ Verificar Regra de Privacidade do Telefone
- [ ] Verificar uma empresa onde telefone = telefone do membro
- [ ] **VERIFICAR:** Telefone NÃO aparece no card
- [ ] Verificar uma empresa onde telefone ≠ telefone do membro
- [ ] **VERIFICAR:** Telefone APARECE no card

---

## 🎲 6. SISTEMA DE SORTEIO

### ✅ Página de Sorteio (`/groups/[id]/draw`)
- [ ] Acessar um grupo com cotas ativas
- [ ] Clicar no botão "Sortear"

### ✅ Verificar Animação do Sorteio
- [ ] Clicar em "SORTEAR"
- [ ] **VERIFICAR:** Números aleatórios aparecem rapidamente
- [ ] **VERIFICAR:** Animação dura ~3 segundos
- [ ] **VERIFICAR:** Números alternam visualmente (não trava)
- [ ] **VERIFICAR:** Após animação, número final é exibido
- [ ] **VERIFICAR:** Nome do dono da cota aparece

### ✅ Salvar Ganhador
- [ ] Clicar em "SALVAR GANHADOR"
- [ ] **VERIFICAR:** Animação de celebração com troféu
- [ ] **VERIFICAR:** Mensagem "GANHADOR!" aparece
- [ ] **VERIFICAR:** Cota é marcada como contemplada

---

## 🎯 7. VERIFICAÇÕES TÉCNICAS

### ✅ Fontes
- [ ] Abrir DevTools → Network → Filter por "font"
- [ ] **VERIFICAR:** Fontes sendo carregadas:
  - Afacad Flux
  - Aleo
  - Azeret Mono
- [ ] Inspecionar texto na área de membros
- [ ] **VERIFICAR:** `font-family` mostra Afacad Flux como principal

### ✅ Cores e CSS
- [ ] Inspecionar elemento na área de membros (F12)
- [ ] Verificar computed styles
- [ ] **VERIFICAR:** Variáveis CSS corretas:
  ```
  --background: 253 253 253 (claro) ou 218 3% 13% (escuro)
  --primary: 256 66% 71%
  --accent: 0 0% 100%
  ```

### ✅ Console do Navegador
- [ ] Abrir DevTools → Console (F12)
- [ ] **VERIFICAR:** Sem erros vermelhos críticos
- [ ] **VERIFICAR:** Sem warnings de recursos não carregados

---

## 🎨 8. SISTEMA DE ÍCONES (Opcional - Futuro)

### ℹ️ Nota sobre Ícones
O sistema de ícones Gradient está **preparado** mas ainda não implementado.

**Para testar no futuro:**
1. Exporte ícones do Figma: https://www.figma.com/community/file/1250041133606945841
2. Salve em `/public/icons/gradient/`
3. Use: `<Icon name="user" size={24} />`

**Atualmente:** Sistema ainda usa Lucide React (normal)

---

## 📊 9. RESPONSIVIDADE

### ✅ Mobile (< 768px)
- [ ] Redimensionar janela para mobile
- [ ] **VERIFICAR:** Sidebar vira menu hambúrguer
- [ ] **VERIFICAR:** Cards empilham em coluna única
- [ ] **VERIFICAR:** Fontes e espaçamentos responsivos

### ✅ Tablet (768px - 1024px)
- [ ] Redimensionar para tablet
- [ ] **VERIFICAR:** Grid de empresas em 2 colunas
- [ ] **VERIFICAR:** Layout se adapta

### ✅ Desktop (> 1024px)
- [ ] Visualizar em desktop
- [ ] **VERIFICAR:** Grid de empresas em 3 colunas
- [ ] **VERIFICAR:** Sidebar fixa na lateral

---

## ✅ CHECKLIST FINAL

Antes de publicar, confirme:

### Funcionalidades
- [ ] ✅ Pré-cadastro cria membro com senha temporária visível
- [ ] ✅ Senha temporária pode ser copiada
- [ ] ✅ Admin pode editar membros
- [ ] ✅ Admin pode excluir pré-cadastros
- [ ] ✅ Admin pode excluir membros (sem cotas)
- [ ] ✅ Animação de sorteio funciona suavemente (~3s)
- [ ] ✅ Cards de empresas aparecem
- [ ] ✅ Regra de privacidade de telefone funciona

### Visual
- [ ] ✅ Área pública mantém tema original (preto/branco/dourado)
- [ ] ✅ Área de membros usa nova paleta (roxo/azul suave)
- [ ] ✅ Fontes Afacad Flux, Aleo, Azeret Mono carregadas
- [ ] ✅ Tema claro e escuro funcionam
- [ ] ✅ Cards mantêm shapes e sombras customizadas
- [ ] ✅ Responsividade funciona em todos os tamanhos

### Performance
- [ ] ✅ Sem erros no console
- [ ] ✅ Páginas carregam rapidamente
- [ ] ✅ Animações são suaves

---

## 🐛 Problemas Encontrados?

Se encontrar algum problema, anote aqui:

**Problema 1:**
- Página: _______
- Descrição: _______
- Screenshot/Print: _______

**Problema 2:**
- Página: _______
- Descrição: _______

---

## 🚀 Pronto para Publicar?

Se todos os itens acima estão ✅, você está pronto para fazer deploy!

### Comandos para Deploy

```bash
# 1. Commit das alterações
git add .
git commit -m "feat: nova paleta de cores e funcionalidades de membros

- Implementa nova paleta (roxo/azul) apenas na área de membros
- Adiciona fontes Afacad Flux, Aleo, Azeret Mono
- Implementa CRUD completo de membros
- Adiciona senha temporária visível no pré-cadastro
- Corrige animação de sorteio (3s suave)
- Implementa página de empresas com regra de privacidade
- Prepara sistema de ícones Gradient
- Mantém tema original na área pública

🤖 Generated with Claude Code"

# 2. Push para repositório
git push origin dev

# 3. Deploy (Netlify, Vercel, etc)
npm run build
# ou comando específico da sua plataforma
```

---

**Data do teste:** ___/___/___
**Testado por:** ___________
**Status:** ⬜ Pendente | ⬜ Aprovado | ⬜ Requer ajustes
