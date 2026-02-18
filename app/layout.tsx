import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import './globals-members.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import QueryProvider from '@/components/providers/QueryProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
})

const archive = localFont({
  src: '../public/fonts/Archive.otf',
  variable: '--font-archive',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Confraria Pedra Branca',
  description: 'Sistema de gestao de consorcios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${cormorant.variable} ${archive.variable} ${inter.className}`}>
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
