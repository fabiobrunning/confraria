# DESIGN.md — Confraria Pedra Branca
**Versão:** 2.0 | **Autor:** @ux-design-expert | **Status:** ATIVO

> Fonte de verdade visual da plataforma. Toda decisão de UI/UX parte deste documento.  
> Referências: Interstellar landing (Behance), Payload CMS, impeccable.style, logo 3D prata/ouro.

---

## 1. IDENTIDADE VISUAL

### DNA
- **Tom:** Exclusivo, sóbrio, premium — como uma sala VIP, não uma vitrine
- **Não é:** Landing page de vendas, dashboard corporativo, app de startups
- **É:** Clube privado digital. Cada pixel comunica pertencimento.

### Princípios de Design
1. **Escuridão intencional** — o fundo preto não é ausência, é presença
2. **Ouro com parcimônia** — um acento dourado vale mais que dez
3. **Tipografia como elemento** — Archive em grandes titulares é a decoração
4. **Espaço negativo generoso** — o que não está lá também comunica
5. **Movimento com propósito** — nada anima sem razão. Cada animação guia o olhar.

---

## 2. SISTEMA DE CORES

```css
/* globals.css — substituir completamente os valores CSS vars */

:root {
  /* Bases */
  --background:        20 14% 4%;        /* #0c0a09 — preto quente */
  --foreground:        0 0% 95%;          /* #f2f2f2 */

  /* Superfícies */
  --card:              0 0% 9%;           /* #171717 — card escuro */
  --card-foreground:   0 0% 95%;

  /* Dourado — o acento único */
  --primary:           44 37% 59%;        /* #bda970 — ouro */
  --primary-foreground:0 0% 100%;
  --primary-glow:      44 37% 59% / 0.15; /* halo para hover */

  /* Texto secundário */
  --muted-foreground:  44 25% 72%;        /* #d4c9b8 — bege pérola */
  --muted:             0 0% 12%;          /* #1f1f1f */

  /* Bordas e vidro */
  --border:            0 0% 100% / 0.08;  /* branco 8% */
  --border-hover:      44 37% 59% / 0.30; /* dourado 30% no hover */
  --glass:             0 0% 100% / 0.04;  /* superfície vidro */

  /* Inputs */
  --input:             0 0% 15%;
  --ring:              44 37% 59%;

  /* Estados */
  --success:           142 48% 69%;
  --destructive:       0 62% 84%;

  /* Radius */
  --radius:            0.75rem;           /* 12px — não arredondado demais */
}
```

### Paleta de Uso

| Token | Hex | Quando usar |
|-------|-----|-------------|
| `background` | `#0c0a09` | Fundo de TODAS as telas |
| `primary` | `#bda970` | CTAs, hover ativo, ícones de destaque |
| `muted-foreground` | `#d4c9b8` | Labels, textos secundários, timestamps |
| `border` | `white/8%` | Bordas padrão de cards e inputs |
| `border-hover` | `gold/30%` | Bordas ao hover — efeito premium |
| `glass` | `white/4%` | Fundo de cards e painéis |

---

## 3. TIPOGRAFIA

### Hierarquia Completa

```
┌─────────────────────────────────────────────────────────────┐
│ DISPLAY — font-display (Archive)                            │
│ Uso: Nome da Confraria, heroes, números grandes             │
│ Tamanhos: hero=7xl–9xl, section=4xl–5xl                    │
│ Casing: UPPERCASE obrigatório                              │
│ Tracking: -0.03em (tight)                                  │
├─────────────────────────────────────────────────────────────┤
│ SERIF ELEGANTE — font-serif (Cormorant Garamond)           │
│ Uso: Subtítulos, citações, taglines, datas                 │
│ Tamanhos: xl–3xl                                           │
│ Weight: 400–500 (nunca bold)                               │
│ Estilo: italic permite para frases de impacto              │
├─────────────────────────────────────────────────────────────┤
│ CORPO/UI — font-brand (Georama)                            │
│ Uso: Navegação, labels, botões, dados, cards               │
│ Tamanhos: sm–lg                                            │
│ Weight: 300 (light) para textos, 400 para labels           │
│ Casing: UPPERCASE + tracking wide para labels de seção     │
└─────────────────────────────────────────────────────────────┘
```

### Regras Absolutas
- **Archive + uppercase** sempre para identificadores da marca
- **Cormorant** nunca em peso 700+
- **Inter** apenas para conteúdo técnico interno (admin)
- Nunca misturar Archive e Cormorant no mesmo elemento
- Line-height para heroes: `0.92` — tipografia comprimida, cinemática

### Tailwind Typography Extensions

Adicionar em `tailwind.config.ts`:

```ts
fontSize: {
  'hero-sm':    ['2.5rem',  { lineHeight: '0.92', letterSpacing: '-0.03em' }],
  'hero':       ['4rem',    { lineHeight: '0.92', letterSpacing: '-0.03em' }],
  'hero-lg':    ['6rem',    { lineHeight: '0.92', letterSpacing: '-0.03em' }],
  'hero-xl':    ['8rem',    { lineHeight: '0.88', letterSpacing: '-0.04em' }],
  'section':    ['2.25rem', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
  'label':      ['0.6875rem',{ lineHeight: '1',   letterSpacing: '0.12em' }],
  'draw-number':['6rem',    { lineHeight: '1',    letterSpacing: '-0.02em' }],
},
```

---

## 4. ANIMAÇÕES

### Linguagem de Movimento

```ts
// tailwind.config.ts — adicionar em extend:
transitionTimingFunction: {
  'cinema':  'cubic-bezier(0.4, 0, 0.2, 1)',   // padrão — suave
  'reveal':  'cubic-bezier(0.0, 0.0, 0.2, 1)', // elementos entrando
  'retreat': 'cubic-bezier(0.4, 0.0, 1.0, 1)', // elementos saindo
  'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce sutil
},
transitionDuration: {
  '250': '250ms',
  '400': '400ms',
  '600': '600ms',
  '800': '800ms',
},
```

### Padrões de Animação Reutilizáveis

```css
/* globals.css — adicionar em @layer utilities */

/* Fade up — entrada padrão de elementos */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Reveal — texto revelado por clipPath */
@keyframes text-reveal {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  to   { clip-path: inset(0 0% 0 0);   opacity: 1; }
}

/* Glow pulse — efeito dourado em destaque */
@keyframes gold-pulse {
  0%, 100% { box-shadow: 0 0 0 0 hsl(44 37% 59% / 0); }
  50%       { box-shadow: 0 0 32px 4px hsl(44 37% 59% / 0.25); }
}

/* Counter — números contando */
@keyframes number-up {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

/* Draw ball — bola do sorteio */
@keyframes ball-spin {
  from { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.05); }
  to   { transform: rotate(360deg) scale(1); }
}

/* Winner celebration */
@keyframes winner-reveal {
  0%   { transform: scale(0.8); opacity: 0; filter: blur(8px); }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1);   opacity: 1; filter: blur(0); }
}
```

### Tailwind Animation Classes

```ts
// tailwind.config.ts
animation: {
  'fade-up':       'fade-up 0.6s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
  'fade-up-slow':  'fade-up 0.9s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
  'text-reveal':   'text-reveal 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
  'gold-pulse':    'gold-pulse 2s ease-in-out infinite',
  'ball-spin':     'ball-spin 0.15s linear infinite',
  'winner-reveal': 'winner-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
},
```

### Regras de Animação
- **Stagger:** `animation-delay: calc(var(--index) * 80ms)` para listas
- **Entrance only:** elementos entram animados, nunca saem (exceto transições de página)
- **No infinite loops** exceto: glow dourado no elemento ativo, vídeo de fundo
- **GSAP** para animações orquestradas (já instalado); Framer Motion para microinterações de componentes

---

## 5. COMPONENTES BASE

### Button

```tsx
// Variantes:
// primary:   fundo dourado, texto preto, hover scale 1.02 + glow
// outline:   borda dourado/30, texto dourado, hover borda dourado/100
// ghost:     sem borda, texto muted, hover texto branco
// danger:    borda vermelho, texto vermelho

// Tamanhos: sm (h-8 px-4 text-xs), md (h-10 px-6 text-sm), lg (h-12 px-8 text-base)
// Shape: rounded-full sempre
// Font: font-brand uppercase tracking-wide

// Hover padrão:
// transform: translateY(-1px)
// transition: 200ms cinema
```

### Card

```tsx
// Base: bg-glass border border-white/8 rounded-xl
// Hover (se clicável): border-gold/30 + translateY(-2px) + shadow-[0_8px_32px_hsl(44_37%_59%/0.12)]
// Padding: p-5 (sm), p-6 (md), p-8 (lg)
// Nunca usar bg-card nativo do shadcn — substituir por bg-glass
```

### Input / Form Field

```tsx
// Base: bg-input border border-white/8 rounded-lg h-12 px-4
// Focus: border-primary ring-0 (sem ring padrão shadcn)
// Label: font-brand text-label uppercase tracking-wide text-muted-foreground mb-2
// Placeholder: text-white/25
```

### Separator / Divisor

```tsx
// Horizontal: 1px sólido white/8 — nunca mais espesso
// Com texto: <div class="flex items-center gap-4"><hr/><span class="font-brand text-label text-muted-foreground whitespace-nowrap">TEXTO</span><hr/></div>
```

---

## 6. TELA 1 — HOME PÚBLICA

### Estrutura de Seções

```
/app/page.tsx

[1] VideoHero         — fullscreen, motion.mp4, logo aparece ao centro
[2] ManifestoSection  — frase principal, counters
[3] EmpresasSection   — grid de empresas membro
[4] FooterSimple      — instagram, whatsapp, crédito Seivi
```

### 6.1 VideoHero

**Comportamento:**
- Vídeo `motion.mp4` em loop, autoplay, muted, fullscreen (100dvh)
- `object-fit: cover`, posicionado atrás de overlay gradiente
- Logo Confraria (SVG branco) aparece ao centro com `animate-fade-up delay-500`
- Seta de scroll aparece abaixo com pulse sutil após 2s
- Ao scroll: vídeo faz parallax sutil (translateY 20% ao scroll completo — via GSAP ScrollTrigger)
- **Não repetir** o menu overlay existente — manter exatamente como está

**Overlay gradient:**
```css
background: linear-gradient(
  to bottom,
  rgba(12,10,9,0.3) 0%,
  rgba(12,10,9,0.1) 40%,
  rgba(12,10,9,0.7) 80%,
  rgba(12,10,9,1.0) 100%
);
```

**Código estrutural:**
```tsx
<section className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
  <video
    src="/logos/motion.mp4"  // copiar para public/
    autoPlay muted loop playsInline
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 [background:linear-gradient(to_bottom,rgba(12,10,9,0.3)_0%,rgba(12,10,9,0.1)_40%,rgba(12,10,9,0.7)_80%,rgba(12,10,9,1)_100%)]" />
  
  <div className="relative z-10 text-center animate-fade-up" style={{ animationDelay: '500ms' }}>
    <Image src="/logo-confraria.svg" alt="Confraria Pedra Branca" width={220} height={60} className="mx-auto" />
  </div>
  
  {/* Scroll indicator */}
  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
    <div className="w-0.5 h-12 bg-gradient-to-b from-primary/60 to-transparent mx-auto" />
  </div>
</section>
```

### 6.2 ManifestoSection

```tsx
<section className="px-6 py-32 max-w-5xl mx-auto text-center">
  {/* Headline Archive */}
  <h1 className="font-display text-hero uppercase leading-[0.92] tracking-tight
                 bg-gradient-to-b from-white via-white to-primary/70 bg-clip-text text-transparent
                 mb-12 animate-fade-up">
    PESSOAS COM VISÃO<br/>
    GERAM NEGÓCIOS<br/>
    COM PROPÓSITO
  </h1>

  {/* Counters — 3 col grid */}
  <div className="grid grid-cols-3 gap-8 mt-20 border-t border-white/8 pt-16">
    {/* Cada counter: número Archive enorme + label Georama uppercase */}
    <CounterItem value={140} label="MEMBROS ATIVOS" />
    <CounterItem value={150} label="EMPRESAS" />
    <CounterItem value={15}  label="MILHÕES MOVIMENTADOS" prefix="R$" suffix="M+" />
  </div>
</section>
```

### 6.3 EmpresasSection — Grid de Empresas

**Este é o elemento central da home. Replace para "NOSSAS EMPRESAS".**

**Layout:**
- Header da seção: label `EMPRESAS DA CONFRARIA` (Georama, uppercase, tracking-wider, text-muted-foreground/60)
- Grid responsivo: `columns-2 sm:columns-3 lg:columns-4 xl:columns-5` com `gap-0`
- Cada item: nome da empresa em uma célula com border sutil
- Empresas COM link: hover dourado + ícone `↗` aparece no hover
- Empresas SEM link: texto apenas, sem hover interativo
- Animação: stagger de entrada com `animate-fade-up`, delay incremental

```tsx
// Estrutura de cada célula:
<div
  key={company.id}
  style={{ '--index': index } as React.CSSProperties}
  className="animate-fade-up opacity-0"
  style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
>
  {company.website || company.instagram ? (
    <a
      href={company.website || `https://instagram.com/${company.instagram}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between px-4 py-3
                 border border-white/6 hover:border-primary/30
                 transition-colors duration-300
                 hover:bg-primary/[0.03]"
    >
      <span className="font-brand text-sm text-white/70 group-hover:text-primary transition-colors duration-300">
        {company.name}
      </span>
      <ArrowUpRight
        className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100
                   transition-opacity duration-300 flex-shrink-0 ml-2"
      />
    </a>
  ) : (
    <div className="flex items-center px-4 py-3 border border-white/6">
      <span className="font-brand text-sm text-white/40">{company.name}</span>
    </div>
  )}
</div>
```

**Dados:** Buscar via `GET /api/companies` — filtrar apenas `is_active: true`, ordenar alfabeticamente.

### 6.4 FooterSimple

```tsx
<footer className="border-t border-white/8 py-10 px-6">
  <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
    <Image src="/logo-confraria.svg" alt="Confraria" width={120} height={32} className="opacity-60" />
    <div className="flex gap-4">
      {/* Instagram e WhatsApp — manter ícones existentes */}
    </div>
    <p className="font-brand text-label text-white/30 tracking-wide">
      DESENVOLVIDO POR{' '}
      <a href="https://seivi.com.br" className="text-primary/60 hover:text-primary transition-colors">
        SEIVI
      </a>
    </p>
  </div>
</footer>
```

> **Nota:** substituir crédito "Looping" por "Seivi" no rodapé.

---

## 7. TELA 2 — LOGIN

### Estrutura

```
/app/(auth)/auth/page.tsx  (ou login/page.tsx)

Layout: fullscreen, centralized, dark background com blob dourado
```

### Layout Completo

```tsx
<div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-background px-6">
  
  {/* Blob de luz dourada — decoração de fundo */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[600px] h-[600px] rounded-full
                  bg-primary/[0.06] blur-[120px] pointer-events-none" />
  
  {/* Card de login */}
  <div className="relative z-10 w-full max-w-[400px] animate-fade-up">
    
    {/* Logo */}
    <div className="flex justify-center mb-10">
      <Image src="/logo-confraria.svg" width={140} height={40} alt="Confraria Pedra Branca" />
    </div>
    
    {/* Título */}
    <h1 className="font-serif text-2xl text-center text-white/80 italic mb-1">
      Área do Membro
    </h1>
    <p className="font-brand text-label text-center text-muted-foreground tracking-wide mb-10">
      ACESSO EXCLUSIVO
    </p>
    
    {/* Formulário */}
    <form className="space-y-4">
      <div>
        <label className="font-brand text-label uppercase tracking-wide text-white/50 block mb-2">
          Telefone
        </label>
        <input
          type="tel"
          placeholder="(48) 9 9999-9999"
          className="w-full h-12 bg-input border border-white/8 rounded-lg px-4
                     font-brand text-sm text-white placeholder:text-white/25
                     focus:border-primary focus:outline-none
                     transition-colors duration-200"
        />
      </div>
      
      <div>
        <label className="font-brand text-label uppercase tracking-wide text-white/50 block mb-2">
          Senha
        </label>
        <input
          type="password"
          className="w-full h-12 bg-input border border-white/8 rounded-lg px-4
                     font-brand text-sm text-white placeholder:text-white/25
                     focus:border-primary focus:outline-none
                     transition-colors duration-200"
        />
      </div>
      
      <button
        type="submit"
        className="w-full h-12 mt-2 bg-primary text-black font-brand text-sm uppercase
                   tracking-wider rounded-full
                   hover:bg-primary/90 hover:-translate-y-0.5
                   transition-all duration-200 cursor-pointer"
      >
        Entrar
      </button>
    </form>
    
    {/* Forgot password */}
    <p className="text-center mt-6">
      <button className="font-brand text-label text-white/40 hover:text-primary transition-colors tracking-wide uppercase">
        Esqueci minha senha
      </button>
    </p>
    
  </div>
</div>
```

---

## 8. TELA 3 — ÁREA DO MEMBRO (INTERIOR)

### Filosofia
A área interna mantém o **mesmo DNA escuro** da home pública. Não é um dashboard corporativo genérico — é a extensão do clube digital. Cards são superfícies vítreas sobre o preto.

### Layout Shell

```tsx
// /app/(protected)/layout.tsx
// Sidebar colapsável (mantida) + main content
// Mudar: bg de sidebar para bg-background (não o cinza atual)

<div className="flex min-h-screen bg-background">
  <Sidebar />  {/* sidebar reestilizada conforme spec abaixo */}
  <main className="flex-1 overflow-auto">
    {children}
  </main>
</div>
```

### Sidebar Reestilizada

```
Largura: 64px (colapso) / 240px (expandido)
Fundo: bg-background border-r border-white/8
Logo: ícone Confraria (SVG pequeno) ao topo

Itens de navegação:
- Ícone sempre visível
- Label aparece no hover (tooltip) quando colapsado
- Estado ativo: text-primary + dot dourado à esquerda
- Estado inativo: text-white/40 hover:text-white/70

Separador entre "Meu Espaço" e "Administração":
- linha 1px white/8 + label "ADMINISTRAÇÃO" uppercase tracking-wide text-white/20
```

### Dashboard do Membro

```tsx
// /app/(protected)/dashboard/page.tsx — refatorar

<PageContainer>
  {/* Saudação */}
  <div className="mb-10">
    <p className="font-brand text-label text-muted-foreground uppercase tracking-wide mb-1">
      BEM-VINDO DE VOLTA
    </p>
    <h1 className="font-display text-3xl uppercase tracking-tight">
      {member.full_name}
    </h1>
  </div>

  {/* Cards: Meu Grupo + Próximo Evento + Parcela Atual */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
    <GlassCard label="MEU GRUPO" value={group.name} sub={`Cota #${quota.number}`} />
    <GlassCard label="PRÓXIMO SORTEIO" value={nextEventDate} sub={group.draw_schedule_display} />
    <GlassCard label="PARCELA ATUAL" value={`R$ ${group.monthly_value}`} sub="Valor do bem: R$ ..." accent />
  </div>

  {/* Histórico do grupo */}
  <section>
    <h2 className="font-brand text-label uppercase tracking-wider text-muted-foreground mb-4">
      HISTÓRICO — {group.name}
    </h2>
    <div className="space-y-0">
      {draws.map((draw) => (
        <DrawHistoryRow key={draw.id} draw={draw} />
      ))}
    </div>
  </section>
</PageContainer>
```

### GlassCard — Componente Reutilizável

```tsx
// components/ui/glass-card.tsx
interface GlassCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean  // bordas douradas
}

// Classes:
// base: "bg-glass border border-white/8 rounded-xl p-6 space-y-1"
// accent: "border-primary/20 bg-primary/[0.04]"
// label: font-brand text-label uppercase tracking-wide text-muted-foreground
// value: font-display text-2xl uppercase (ou font-serif text-xl para datas)
// sub: font-brand text-xs text-white/40
```

### DrawHistoryRow

```tsx
// Linha da tabela de histórico de sorteios
// Layout: data | cota ganhadora | nome do ganhador | status (se transferido)
// Border: border-b border-white/8 last:border-0
// Hover: bg-glass transition-colors

<div className="flex items-center justify-between py-4 border-b border-white/8
                hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded">
  <span className="font-brand text-sm text-muted-foreground w-24">
    {formatMonth(draw.reference_month)}  {/* "Jun/26" */}
  </span>
  <span className="font-display text-lg uppercase text-white/80 w-20 text-center">
    #{draw.winning_number}
  </span>
  <span className="font-brand text-sm text-white/70 flex-1 text-center">
    {draw.winner_name}
  </span>
  {draw.contemplation_type === 'transfer' && (
    <span className="font-brand text-label text-primary/60 uppercase tracking-wide">
      transferido
    </span>
  )}
</div>
```

---

## 9. TELA 4 — SORTEIO (MODO SHOWCASE)

### Filosofia
Esta tela é uma **experiência ao vivo** projetada numa TV/telão para os membros presentes no evento. Deve ser dramática, legível de longe, e transmitir a emoção do momento.

### Acesso
- Admin acessa via URL: `/sorteio/[groupId]?token=xyz`
- Token simples (env var) para evitar acesso não autorizado
- Sem sidebar, sem navbar — fullscreen puro

### Layout

```tsx
// /app/sorteio/[groupId]/page.tsx (rota pública com token)

<div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
  
  {/* Header do sorteio */}
  <div className="flex items-center justify-between px-10 py-6 border-b border-white/8">
    <Image src="/logo-confraria.svg" width={140} height={40} alt="" />
    <div className="text-right">
      <p className="font-brand text-label uppercase tracking-wider text-muted-foreground">
        {group.name}
      </p>
      <p className="font-serif text-lg text-white/60 italic">{formatDate(today)}</p>
    </div>
  </div>

  {/* Área central do sorteio */}
  <div className="flex-1 flex flex-col items-center justify-center px-10 gap-12">
    
    {/* Máquina de sorteio — manter DrawMachine existente, reestilizar */}
    <DrawMachine ... />

    {/* Bolas eliminadas */}
    {eliminatedNumbers.length > 0 && (
      <div className="flex gap-4 items-center">
        <span className="font-brand text-label uppercase tracking-wider text-white/30">
          ELIMINADAS
        </span>
        {eliminatedNumbers.map((n) => (
          <span key={n}
            className="font-display text-2xl text-white/40 border border-white/15
                       w-12 h-12 rounded-full flex items-center justify-center">
            {n}
          </span>
        ))}
      </div>
    )}

    {/* Winner reveal — visível após confirmação */}
    {winner && (
      <div className="text-center animate-winner-reveal border border-primary/30
                      bg-primary/[0.06] rounded-2xl px-16 py-10">
        <p className="font-brand text-label uppercase tracking-wider text-primary mb-2">
          GANHADOR
        </p>
        <p className="font-display text-hero-lg uppercase text-white mb-1">
          COTA #{winner.quota_number}
        </p>
        <p className="font-serif text-3xl italic text-white/80 mb-6">
          {winner.member_name}
        </p>
        <div className="border-t border-white/10 pt-6">
          <p className="font-brand text-sm text-muted-foreground">
            PARCELA DO MÊS:{'  '}
            <span className="text-primary font-display text-xl">
              R$ {group.monthly_value_at_draw}
            </span>
          </p>
        </div>
      </div>
    )}
  </div>

  {/* Footer com mensagem WhatsApp */}
  {winner && (
    <div className="px-10 py-6 border-t border-white/8 flex items-center justify-between">
      <button
        onClick={copyWhatsAppMessage}
        className="font-brand text-sm text-primary border border-primary/30
                   hover:border-primary/60 rounded-full px-6 py-2 transition-colors"
      >
        📋 COPIAR MENSAGEM WHATSAPP
      </button>
      <p className="font-brand text-label text-white/20 uppercase tracking-wide">
        SEIVI · TECNOLOGIA QUE TRABALHA
      </p>
    </div>
  )}
</div>
```

### DrawMachine Reestilizada

A máquina existente mantém a lógica — apenas reestilizar:
- Bolas: `font-display text-draw-number text-white` em container circular escuro
- Animação: manter GSAP existente, ajustar cores
- Botão SORTEAR: variante `outline` do Button spec acima
- Estado eliminando: borda branca normal
- Estado ganhador: borda dourada + `animate-gold-pulse`

---

## 10. IMPLEMENTAÇÃO — ORDEM DE EXECUÇÃO

### Sequência para @dev

```
Etapa 1 — Infraestrutura (30min)
  ├── Atualizar CSS vars em globals.css (Seção 2)
  ├── Adicionar keyframes e animations em globals.css (Seção 4)
  ├── Atualizar tailwind.config.ts fontSize + animation (Seções 3 e 4)
  └── Copiar motion.mp4 → public/videos/motion.mp4

Etapa 2 — Componentes base (1h)
  ├── components/ui/glass-card.tsx
  ├── components/ui/draw-history-row.tsx
  └── Atualizar components/ui/button.tsx (variantes conforme Seção 5)

Etapa 3 — Home pública (2h)
  ├── VideoHero (substituir imagem estática pelo vídeo)
  ├── ManifestoSection (refinar counters existentes)
  ├── EmpresasSection (novo — buscar /api/companies)
  └── FooterSimple (ajustar crédito)

Etapa 4 — Login (45min)
  └── Refatorar app/(auth)/auth/page.tsx conforme Seção 7

Etapa 5 — Sidebar + Shell interior (1h)
  ├── Reestilizar Sidebar.tsx (cores conforme Seção 8)
  └── Refatorar app/(protected)/layout.tsx

Etapa 6 — Dashboard do membro (1h30)
  └── Refatorar dashboard com GlassCard + DrawHistoryRow

Etapa 7 — Página de sorteio (2h)
  ├── Criar app/sorteio/[groupId]/page.tsx
  ├── Reestilizar DrawMachine
  └── Implementar botão "Copiar WhatsApp"
```

### Checklist de Qualidade

Antes de marcar qualquer etapa como concluída:

- [ ] Testar em mobile (375px) e desktop (1440px)
- [ ] Verificar que Archive font carrega (`font-display` aplicada)
- [ ] Verificar que nenhum fundo slate/cinza padrão shadcn aparece
- [ ] Confirmar que botões têm `rounded-full` (não `rounded-md`)
- [ ] Confirmar que vídeo faz autoplay no mobile (Safari exige `playsInline`)
- [ ] Confirmar contraste de texto: branco sobre preto ≥ 4.5:1 (WCAG AA)
- [ ] Confirmar que hover states funcionam em touch (tap highlight)

---

## 11. ARQUIVOS A MODIFICAR

| Arquivo | Tipo de mudança |
|---------|----------------|
| `app/globals.css` | Atualizar CSS vars + adicionar keyframes |
| `tailwind.config.ts` | Adicionar fontSize, animation, easing |
| `app/layout.tsx` | Nenhuma mudança (fonts já carregadas) |
| `app/page.tsx` | Refatorar completo: VideoHero + Empresas |
| `app/(auth)/auth/page.tsx` | Refatorar: novo layout login |
| `app/(protected)/layout.tsx` | Ajustar shell interior |
| `components/Sidebar.tsx` | Reestilizar cores |
| `app/(protected)/dashboard/page.tsx` | Refatorar com GlassCard |
| `components/ui/button.tsx` | Adicionar variantes + rounded-full |
| **CRIAR** `components/ui/glass-card.tsx` | Novo componente |
| **CRIAR** `components/ui/draw-history-row.tsx` | Novo componente |
| **CRIAR** `app/sorteio/[groupId]/page.tsx` | Nova rota showcase |
| **MOVER** `Logos/motion.mp4` → `public/videos/motion.mp4` | Asset público |

---

*DESIGN.md — Confraria Pedra Branca v2.0 | @ux-design-expert | 2026-06-24*
