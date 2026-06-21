---
version: "1.0.0"
name: "Confraria Pedra Branca Design System"
description: "Dark-only design system for Confraria Pedra Branca — a premium business networking group from Grande Florianópolis. Gold as authority. Near-black as exclusivity. Warm beige as warmth."

colors:
  # Gold scale — assinatura da marca
  gold_300: "#d4c9b8"
  gold_400: "#cdb98a"
  gold_500: "#bda970"
  gold_600: "#a8945c"
  gold_700: "#8a7a4c"
  # Stone scale — superfícies escuras
  stone_950: "#0c0a09"
  stone_900: "#1d1d20"
  stone_850: "#161618"
  stone_800: "#262626"
  stone_750: "#292a2d"
  stone_700: "#34353b"
  stone_600: "#3e4044"
  stone_500: "#545659"
  stone_300: "#b3b3b3"
  # Accents
  blue_900: "#293241"
  blue_300: "#a4bde8"
  lilac_300: "#c1adf0"
  # Semantic pastels
  green_300: "#8ad6a6"
  red_300: "#f0bebe"
  beige_50: "#e5ddd5"
  # Aliases semânticas
  primary: "#bda970"
  primary_foreground: "#0c0a09"
  primary_hover: "#cdb98a"
  secondary: "#ffffff"
  secondary_foreground: "#1a1a1a"
  accent: "#293241"
  accent_foreground: "#ffffff"
  success: "#8ad6a6"
  success_foreground: "#1a1a1a"
  destructive: "#f0bebe"
  destructive_foreground: "#1a1a1a"
  foreground: "#f5f5f5"
  text_muted: "#d4c9b8"
  text_faint: "#b3b3b3"
  border: "#545659"
  border_subtle: "#2c2c2e"
  input: "#3e4044"
  ring: "#c1adf0"
  surface_card: "rgba(255,255,255,0.025)"
  surface_popover: "#292a2d"
  surface_sidebar: "#1d1d20"
  muted: "#34353b"

typography:
  families:
    display: "Archive, Inter, system-ui, sans-serif"
    sans: "Inter, system-ui, -apple-system, sans-serif"
    serif: "Cormorant Garamond, Georgia, serif"
    mono: "ui-monospace, SF Mono, Menlo, monospace"
  scale:
    hero_mobile: { size: "2.5rem", line_height: "0.95", letter_spacing: "-0.02em", family: "display" }
    hero_desktop: { size: "5rem", line_height: "0.95", letter_spacing: "-0.02em", family: "display" }
    h1: { size: "2.25rem", family: "display" }
    h2: { size: "1.875rem", family: "display" }
    h3: { size: "1.5rem", family: "sans" }
    h4: { size: "1.25rem", family: "sans" }
    body_l: { size: "1.125rem", family: "sans" }
    body: { size: "1rem", family: "sans" }
    body_s: { size: "0.875rem", family: "sans" }
    caption: { size: "0.75rem", family: "sans" }

spacing:
  "0": "0"
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
  container_padding: "2rem"
  container_max: "1400px"

rounded:
  none: "0"
  sm: "calc(1rem - 4px)"
  md: "calc(1rem - 2px)"
  lg: "1rem"
  full: "9999px"

components:
  button-primary:
    background: "#bda970"
    color: "#0c0a09"
    border: "1px solid transparent"
    border_radius: "10px"
    font_family: "Inter"
    font_size: "0.875rem"
    font_weight: "500"
    height: "40px"
    padding: "0 18px"
  button-primary-hover:
    background: "#cdb98a"
    color: "#0c0a09"
  button-secondary:
    background: "rgba(255,255,255,0.06)"
    color: "#f5f5f5"
    border: "1px solid rgba(255,255,255,0.10)"
    border_radius: "10px"
    font_size: "0.875rem"
  button-ghost:
    background: "transparent"
    color: "#b3b3b3"
    border: "1px solid transparent"
    border_radius: "10px"
    font_size: "0.875rem"
  button-ghost-hover:
    background: "rgba(255,255,255,0.05)"
    color: "#f5f5f5"
  card:
    background: "rgba(255,255,255,0.025)"
    color: "#f5f5f5"
    border: "1px solid rgba(255,255,255,0.08)"
    border_radius: "14px"
    box_shadow: "0 1px 0 rgba(255,255,255,0.03) inset"
    padding: "1.5rem"
  input-text:
    background: "#3e4044"
    color: "#f5f5f5"
    border: "1px solid #545659"
    border_radius: "calc(1rem - 2px)"
    placeholder_color: "#d4c9b8"
    focus_ring: "#c1adf0"
  badge-default:
    background: "#34353b"
    color: "#f5f5f5"
    border_radius: "9999px"
    font_size: "0.75rem"
    font_weight: "500"
    padding: "0.125rem 0.5rem"
  badge-success:
    background: "#8ad6a6"
    color: "#1a1a1a"
    border_radius: "9999px"
    font_size: "0.75rem"
  badge-warning:
    background: "#f0bebe"
    color: "#1a1a1a"
    border_radius: "9999px"
    font_size: "0.75rem"
  nav-header:
    background: "#1d1d20"
    color: "#f5f5f5"
    border_bottom: "1px solid #545659"
    height: "3.5rem"
  sidebar:
    background: "#1d1d20"
    color: "#f5f5f5"
    border_right: "1px solid #545659"
    active_color: "#c1adf0"
    active_background: "#34353b"
---

# Confraria Pedra Branca — Design System

> *"Pessoas com visão geram negócios com propósito"*

Dark-only. Gold as authority. Near-black as exclusivity. Informal but premium.

---

## 1. Visual Theme & Atmosphere

A Confraria Pedra Branca não é uma empresa — é uma comunidade de empresários da Grande Florianópolis que se encontram mensalmente para construir conexões reais. O design system reflete esse caráter: **exclusivo mas acolhedor, premium mas humano**.

O tema é dark-only por escolha deliberada. O preto quente (`#0c0a09`) não é um background técnico — é o ambiente de um jantar de negócios, de uma reunião de confiança. O dourado (`#bda970`) não é decorativo — é a cor da autoridade que não precisa gritar.

A atmosfera geral é de **clube privado horizontal**: não há hierarquia visual entre membros, mas há qualidade inconfundível na apresentação. Cada tela deve parecer que foi cuidada, não gerada em massa.

---

## 2. Color Palette & Roles

### Primary — Dourado `#bda970`
O ouro envelhecido é a cor de ação da Confraria. Aparece em CTAs principais, links ativos, destaques e elementos de identidade. Não é o amarelo brilhante de alerta — é o dourado patinado de algo que durou.

### Background — Preto quente `#0c0a09`
Não é preto puro. O tom levemente quente (temperatura de cor ~2700K implícita) evita a frieza estéril. Toda a UI respira neste fundo — é o espaço onde as conversas acontecem.

### Surface — Cinza escuro `#262626` / `#1d1d20`
Cards e sidebar vivem nesses tons. A separação entre fundo e superfície é intencional: `#262626` para conteúdo principal, `#1d1d20` para navegação/sidebar.

### Muted foreground — Bege `#d4c9b8`
O texto secundário usa bege quente, não cinza neutro. Esse detalhe pequeno é o que faz a UI sentir humana e não corporativa. Labels, metadados, placeholders vivem aqui.

### Accent — Azul escuro `#293241`
Reservado para estados selecionados e accent interactions. Complementa o dourado sem competir.

### Feedback
- **Sucesso:** `#8ad6a6` — verde suave, nunca gritante
- **Erro/Warning:** `#f0bebe` — rosa suave, não vermelho alarme
- **Ring/Focus:** `#c1adf0` — lavanda, visible sem ser disruptiva

### Princípio de escassez
O dourado é raro. Uma tela não deve ter mais de 2–3 elementos dourados. Se tudo é dourado, nada é dourado.

---

## 3. Typography Rules

Três famílias com papéis distintos — nunca intercambiáveis:

### Archive (display)
Fonte proprietária local (`public/fonts/Archive.otf`). Usada em heroes, títulos de seção de impacto e elementos de wordmark em texto. **Nunca em corpo de texto.** Tracking positivo (`0.04em`) em uppercase — condensada mas arejada. O logotipo da Confraria é sempre a imagem SVG/PNG — Archive aparece em texto de display, não no wordmark tipográfico.

### Inter (sans — corpo)
A fonte do sistema para todo conteúdo operacional: tabelas, formulários, labels, parágrafos, navegação. Legível, moderna, sem personalidade excessiva — deixa o conteúdo falar.

### Cormorant Garamond (serif — editorial)
Para uso editorial: taglines, citações, depoimentos, momentos onde o tom precisa de elegância. Não usada na UI operacional (membros, grupos, consórcio).

### Escala
- **Hero mobile:** 2.5rem / line-height 0.95 — Archive, tracking `0.04em`
- **Hero desktop:** 5rem / line-height 0.95 — Archive, tracking `0.04em`
- **H1–H2:** Archive, uppercase, tracking `0.04em`
- **H3–H4:** Inter, weight 600
- **Body:** Inter 1rem, line-height 1.5
- **Caption:** Inter 0.75rem, `--text-faint` (#b3b3b3)

---

## 4. Components

### Ações
**Button primary** — dourado sólido, fundo `#bda970`, **texto escuro `#0c0a09`** (não branco — contraste de leitura sobre dourado). Hover clareia para `#cdb98a` (gold-400). Border-radius `10px`. Um CTA primário por viewport.

**Button secondary** — fundo `rgba(255,255,255,.06)` (glass sutil), borda `rgba(255,255,255,.10)` hairline. Para ações secundárias paralelas ao CTA.

**Button ghost** — sem fundo, texto `#b3b3b3` (`--text-faint`). Hover revela `rgba(255,255,255,.05)`. Para ações de menor prioridade em contextos densos.

### Superfícies
**Card** — fundo `rgba(255,255,255,.025)` (glass translúcido), borda `rgba(255,255,255,.08)` hairline, `border-radius: 14px`, inset highlight `0 1px 0 rgba(255,255,255,.03)`. Padding `1.5rem`. Padrão para Membros, Empresas e Grupos em grid.

**Sidebar** — `#1d1d20`, borda direita `#545659`. Item ativo: texto `#c1adf0`, fundo `#34353b`.

### Formulários
**Input** — fundo `#3e4044`, borda `#545659`, placeholder bege `#d4c9b8`. Focus ring lavanda `#c1adf0`. Border-radius `md`.

### Feedback
**Badge default** — `#34353b`, texto `#f5f5f5`, pill completo.
**Badge success** — `#8ad6a6`, texto `#1a1a1a` — para status "Ativo".
**Badge warning** — `#f0bebe`, texto `#1a1a1a` — para status "Pré-Cadastro".

### Layout
**PageContainer** — wrapper com padding responsivo (`p-4 sm:p-6`).
**PageHeader** — título + descrição + slot de ação direita.
**EmptyState** — estado sem dados, centralizado, com CTA quando aplicável.

---

## 5. Layout Principles

Container máximo `1400px`, centrado, padding `2rem`. Layout responsivo mobile-first.

Três padrões de listagem no sistema:
- **Grid de cards** — Empresas e Grupos: 2–3 colunas em desktop, 1 em mobile
- **Lista linear com busca** — Membros: scroll vertical, filtro de status
- **Tabela paginada** — áreas admin com muitos registros

Sidebar fixa no desktop, drawer em mobile. A navegação nunca compete com o conteúdo.

---

## 6. Depth & Elevation

**Background de assinatura:** `--bg-radial` (gradiente elíptico top → preto) + `--bg-mesh` (manchas gold sutis) compõem a profundidade de tela inteira.

**Camadas tonais:**
- `--bg-radial` / `#000` → fundo de tela (aplicado no `<body>`)
- `stone-900` `#1d1d20` → sidebar / nav
- Card surface → `rgba(255,255,255,.025)` (translúcido, não `#262626`)
- `stone-750` `#292a2d` → popovers / dropdowns

**Sombras disponíveis:**
- `--shadow-sm: 0 1px 2px rgba(0,0,0,.4)` — separadores sutis
- `--shadow-md: 0 4px 14px rgba(0,0,0,.45)` — cards elevados
- `--glow-gold: 0 10px 40px rgba(189,169,112,.4)` — CTAs / momentos de foco

**Bordas:** `rgba(255,255,255,.08)` em cards (hairline translúcida); `#545659` em inputs e separadores; `#2c2c2e` em divisores internos sutis.

---

## 7. Do's and Don'ts

### ✅ Do's
- Use dourado exclusivamente para ações primárias e identidade de marca
- Mantenha texto principal em `#f5f5f5` e secundário em `#d4c9b8` (bege — nunca cinza neutro)
- Aplique `border-radius: 1rem` (lg) em cards e modais; `md` em botões e inputs
- Use Archive apenas em titulação de impacto — nunca em labels ou corpo
- Mantenha sidebar em `#1d1d20` separada do fundo `#0c0a09` pela diferença tonal
- Use `#c1adf0` (lavanda) apenas para focus ring e item ativo da sidebar
- Prefira variante ghost para ações terciárias em tabelas/listas

### ❌ Don'ts
- Não use dourado em textos de corpo — perde legibilidade e dilui o impacto
- Não misture Archive com Cormorant em títulos — são mundos tipográficos opostos
- Não use texto branco sobre botão primary dourado — o contraste correto é `#0c0a09` (escuro)
- Não use vermelho vivo para erros — o sistema usa `#f0bebe` (rosa suave)
- Não adicione modo claro — o sistema é dark-only por decisão de marca
- Não coloque mais de um CTA primário dourado por viewport
- Não use `border-radius: 0` — o sistema tem curvatura mínima `sm` sempre
- Não use cinza neutro para texto secundário — use `#d4c9b8` (gold-300); para texto terciário use `#b3b3b3` (--text-faint)
- Não use `#262626` como surface de card — a surface correta é `rgba(255,255,255,.025)` translúcida sobre `--bg-radial`
- Não renderize o wordmark "Pedra Branca" em texto CSS — use sempre imagem SVG/PNG

---

## 8. Responsive Behavior

- **Mobile first** — todos os componentes têm base mobile
- **Breakpoint principal:** `sm` (640px) — padding e layout mudam aqui
- **Desktop:** sidebar fixa, grid de cards expande para 2–3 colunas
- **Mobile:** sidebar vira drawer, grid colapsa para 1 coluna
- Cards de Membros: lista linear em ambos os breakpoints (não vira grid)
- Tabelas admin: horizontal scroll em mobile, nunca truncam dados

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
Primary CTA (gold-500):      #bda970  → texto sobre ele: #0c0a09 (escuro)
Primary hover (gold-400):    #cdb98a
Background (stone-950):      #0c0a09
Card surface (translúcido):  rgba(255,255,255,.025) + borda rgba(255,255,255,.08)
Sidebar (stone-900):         #1d1d20
Text body:                   #f5f5f5
Text muted (gold-300):       #d4c9b8
Text faint (stone-300):      #b3b3b3
Accent / blue (blue-900):    #293241
Focus ring / active:         #c1adf0 (lilac-300)
Border:                      #545659
Border subtle:               #2c2c2e
Input background:            #3e4044
Success:                     #8ad6a6
Error/Warning:               #f0bebe
Gold glow (shadow):          0 10px 40px rgba(189,169,112,0.4)
```

### Example Component Prompts

**Hero section:**
> "Create a hero section for Confraria Pedra Branca. Body background: `--bg-radial` (radial-gradient ellipse at top, hsl(0 0% 12%) → hsl(0 0% 0%)). Main heading in Archive font, 5rem / 2.5rem mobile, letter-spacing 0.04em, uppercase, color #f5f5f5. Tagline in Cormorant Garamond italic, #d4c9b8. Primary CTA: background #bda970, color #0c0a09 (dark text), border-radius 10px, height 40px."

**Member card:**
> "Create a member card. Background rgba(255,255,255,.025), border 1px solid rgba(255,255,255,.08), border-radius 14px, box-shadow 0 1px 0 rgba(255,255,255,.03) inset, padding 1.5rem. Member name Inter 500 #f5f5f5. Company name Inter 400 #d4c9b8. Status badge 'Ativo' background #8ad6a6 text #1a1a1a pill. Ghost button: color #b3b3b3 (--text-faint), transparent bg."

**Navigation sidebar:**
> "Create a sidebar. Background #1d1d20, border-right 1px solid rgba(255,255,255,.08). Nav items Inter #f5f5f5. Active item: background rgba(255,255,255,.06), text #c1adf0 (lilac-300). Padding 1rem."

**Stats dashboard card:**
> "Create a stats card. Background #262626, border 1px solid #545659, border-radius 1rem. Stat number in Archive font, 2.25rem, color #bda970. Label below in Inter 0.875rem, #d4c9b8. Three cards in a grid: '140 Membros Ativos', '150 Empresas', 'R$15M+ em valor'."

**Data table (admin):**
> "Create a data table for admin area. Header row background #34353b, text #d4c9b8, Inter 0.75rem uppercase. Data rows background #262626, text #f5f5f5, border-bottom 1px solid #545659. Action buttons: ghost style in #d4c9b8. Badge for status in appropriate variant."

### Iteration Guide

1. **Sempre dark** — se uma geração vier com fundo claro, rejeite e especifique `background: #0c0a09` explicitamente
2. **Dourado é escasso** — se gerou dourado em textos de corpo, substitua por `#f5f5f5` ou `#d4c9b8`
3. **Bege, não cinza** — texto secundário deve ser `#d4c9b8`, não tons de cinza neutro (`#9ca3af`, etc.)
4. **Archive só em títulos** — se Archive aparecer em labels ou corpo, troque para Inter
5. **Border-radius consistente** — cards e modais usam `1rem`; botões e inputs usam `calc(1rem - 2px)`
6. **Lavanda só para focus/active** — `#c1adf0` não é cor de texto nem de botão
7. **Sem sombras dramáticas** — elevação é tonal (diferença de fundo), não por box-shadow
8. **Badges semânticos** — success=#8ad6a6, warning=#f0bebe, default=#34353b — não trocar cores arbitrariamente

---

## Implementation

**Stack:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- shadcn/ui (baseColor: zinc, cssVariables: true)
- Tailwind CSS v3
- TanStack Query
- React Hook Form + Zod
- Deploy: Netlify

**Tailwind config:** `tailwind.config.ts`

**CSS variables:** `app/globals.css` — single dark theme, all tokens as HSL CSS custom properties

**shadcn components.json:**
```json
{
  "baseColor": "zinc",
  "cssVariables": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Token → utility mapping:**
| Token | CSS var | Tailwind class |
|---|---|---|
| primary | `--primary` | `bg-primary`, `text-primary` |
| background | `--background` | `bg-background` |
| card | `--card` | `bg-card` |
| foreground | `--foreground` | `text-foreground` |
| muted-foreground | `--muted-foreground` | `text-muted-foreground` |
| border | `--border` | `border-border` |
| success | `--success` | `bg-success`, `text-success` |
| sidebar | `--sidebar-background` | `bg-sidebar` |

**Font loading:** `app/layout.tsx` — Inter e Cormorant Garamond via `next/font/google`; Archive via `next/font/local` (`public/fonts/Archive.otf`)

**Component source root:** `components/ui/` (shadcn atoms) + `components/layout/` (PageContainer, PageHeader, EmptyState)

**Source project:** `/Users/fabiobrunning/10-PROJETOS/10.005-Confraria`

---

## Fidelity Notes

```yaml
shadows_detected: false
fonts_proprietary: ["Archive"]
fonts_google: ["Inter", "Cormorant Garamond"]
backgrounds_captured: ["--bg-radial (radial gradient)", "--bg-mesh (gold mesh gradient)"]
shadows_captured: ["--shadow-sm/md/lg/2xl", "--glow-gold"]
motion_captured: ["--ease-smooth", "--ease-bounce", "--dur-fast/base/slow"]
icons_not_captured: true
photography_not_captured: true
theme_mode: "dark-only"
extraction_source: "globals.css + tailwind.config.ts + app/layout.tsx"
known_brand_decisions:
  - "Dark-only é escolha de marca — sem modo claro"
  - "Dourado envelhecido (#bda970) — não é amarelo vibrante"
  - "Bege (#d4c9b8) em vez de cinza neutro para texto secundário — decisão de warmth"
  - "Archive é fonte proprietária local — não disponível via Google Fonts"
```
