import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['var(--font-archive)', 'Archive', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        'brand': ['var(--font-georama)', 'Georama', 'system-ui', 'sans-serif'],
        'mono': ['ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero-mobile': ['2.5rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'hero-desktop': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'hero-sm':    ['2.5rem',   { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'hero':       ['4rem',     { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'hero-lg':    ['6rem',     { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'hero-xl':    ['8rem',     { lineHeight: '0.88', letterSpacing: '-0.04em' }],
        'section':    ['2.25rem',  { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'label':      ['0.6875rem',{ lineHeight: '1',    letterSpacing: '0.12em' }],
        'draw-number':['6rem',     { lineHeight: '1',    letterSpacing: '-0.02em' }],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'cinema':  'cubic-bezier(0.4, 0, 0.2, 1)',
        'reveal':  'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'retreat': 'cubic-bezier(0.4, 0.0, 1.0, 1)',
        'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-up':       'fade-up 0.6s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'fade-up-slow':  'fade-up 0.9s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'text-reveal':   'text-reveal 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        'gold-pulse':    'gold-pulse 2s ease-in-out infinite',
        'ball-spin':     'ball-spin 0.15s linear infinite',
        'winner-reveal': 'winner-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
