# Sistema de Ícones - 10,000 Free Icons (Gradient)

Este projeto usa a biblioteca **10,000 Free Icons - Open Source Icon Set** no estilo **Gradient**.

## 📦 Fonte

- **Figma:** https://www.figma.com/community/file/1250041133606945841
- **Grid:** 14px
- **Estilo:** Gradient
- **Total de ícones:** 1.250 ícones no estilo Gradient

## 🎨 Como adicionar novos ícones

### 1. Exportar do Figma

1. Abra o arquivo no Figma
2. Navegue até a página **"Gradient"**
3. Selecione o ícone desejado
4. Clique com botão direito → **Export** → **SVG**
5. Salve o arquivo

### 2. Preparar o SVG

Certifique-se de que o SVG tem esta estrutura:

```xml
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <g id="icon">
    <!-- Conteúdo do ícone aqui -->
  </g>
</svg>
```

**Importante:** Adicione `id="icon"` no grupo principal para que o componente funcione corretamente.

### 3. Adicionar ao projeto

Salve o arquivo SVG em:
```
/public/icons/gradient/[nome-do-icone].svg
```

Exemplo:
- `/public/icons/gradient/user.svg`
- `/public/icons/gradient/heart.svg`
- `/public/icons/gradient/settings.svg`

## 🚀 Como usar

### Importação

```tsx
import { Icon, IconVariants } from '@/components/icons/Icon';
```

### Exemplos básicos

```tsx
// Ícone básico (24px, cor herdada)
<Icon name="user" />

// Ícone com tamanho customizado
<Icon name="heart" size={32} />

// Ícone com cor específica
<Icon name="star" color="#FFD700" />

// Ícone com classe CSS
<Icon name="settings" className="hover:scale-110 transition-transform" />
```

### Variantes pré-configuradas

```tsx
// Navegação (24px)
<IconVariants.Navigation name="home" />

// Botões (20px)
<IconVariants.Button name="plus" />

// Cards (16px)
<IconVariants.Card name="info" />

// Grande (32px)
<IconVariants.Large name="trophy" />

// Pequeno (12px)
<IconVariants.Small name="dot" />
```

### Em componentes

```tsx
// Em um botão
<Button>
  <Icon name="plus" size={20} />
  Adicionar
</Button>

// Em um card
<Card>
  <Icon name="building" size={24} className="text-primary" />
  <h3>Título</h3>
</Card>

// Com Tailwind CSS
<Icon
  name="heart"
  size={28}
  className="text-red-500 hover:text-red-600 cursor-pointer"
  onClick={() => handleLike()}
/>
```

## 📏 Tamanhos padrão

| Uso | Tamanho | Variante |
|-----|---------|----------|
| Navegação | 24px | `IconVariants.Navigation` |
| Botões | 20px | `IconVariants.Button` |
| Cards | 16-24px | `IconVariants.Card` |
| Ícones grandes | 32px | `IconVariants.Large` |
| Ícones pequenos | 12px | `IconVariants.Small` |

## 🎨 Cores

Por padrão, os ícones usam `currentColor`, o que significa que herdam a cor do texto do elemento pai.

### Usar cor do tema

```tsx
<Icon name="user" className="text-primary" />
<Icon name="alert" className="text-destructive" />
<Icon name="success" className="text-success" />
```

### Usar cor customizada

```tsx
<Icon name="star" color="#FFD700" />
<Icon name="heart" color="rgb(255, 0, 0)" />
```

## 🔄 Migração do Lucide React

Se você está migrando de Lucide React:

### Antes (Lucide)
```tsx
import { User, Heart, Settings } from 'lucide-react';

<User size={24} />
<Heart size={20} color="red" />
```

### Depois (10,000 Icons)
```tsx
import { Icon } from '@/components/icons/Icon';

<Icon name="user" size={24} />
<Icon name="heart" size={20} color="red" />
```

## 📋 Lista de ícones disponíveis

Para ver todos os ícones disponíveis, verifique a pasta:
```
/public/icons/gradient/
```

Ou consulte o arquivo Figma: https://www.figma.com/community/file/1250041133606945841

## ⚡ Performance

- Os ícones são carregados como SVG inline para melhor performance
- Não há JavaScript adicional sendo carregado
- Cache do navegador otimizado para ícones estáticos
- Tamanho mínimo de arquivo

## 🎯 Boas práticas

1. ✅ Use `currentColor` sempre que possível (herda do pai)
2. ✅ Use as variantes pré-configuradas para consistência
3. ✅ Adicione `aria-label` para acessibilidade quando o ícone não tem texto
4. ✅ Use tamanhos múltiplos de 4 para melhor renderização
5. ❌ Evite tamanhos muito pequenos (< 12px) para ícones Gradient

## 🔍 Troubleshooting

### Ícone não aparece

1. Verifique se o arquivo SVG existe em `/public/icons/gradient/`
2. Confirme que o SVG tem `id="icon"` no grupo principal
3. Verifique o console do navegador por erros

### Ícone sem cor/gradiente

1. Certifique-se de que o SVG original do Figma foi exportado corretamente
2. Verifique se os gradientes estão definidos no SVG
3. Não use `fill="currentColor"` em ícones Gradient (eles têm gradientes próprios)
