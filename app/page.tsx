'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { maskPhone } from '@/lib/utils/phone'
import { registerFirstLogin, trackFailedLogin } from '@/app/actions/auth'

const navLinks = [
  { label: 'Nossas Empresas', href: '#empresas' },
  { label: 'Quero Conhecer', href: '/quero-conhecer' },
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string; website: string | null; instagram: string | null }[]>([])

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const menuCardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/public/companies')
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!isMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuCardRef.current && !menuCardRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isMenuOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const email = `${cleanPhone}@confraria.local`
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        await trackFailedLogin(cleanPhone)
        setLoginError('Telefone ou senha incorretos.')
        return
      }
      registerFirstLogin().catch(() => {})
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoginError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="bg-[#0c0a09]">

      {/* ── BOTÃO DE MENU + CARD ── */}
      <div ref={menuCardRef} className="fixed top-0 right-0 z-[9998] p-4 sm:p-5">

        {/* Botão com ícone animado */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="relative w-12 h-12 flex items-center justify-center
                     rounded-full border border-white/20 hover:border-primary/50
                     bg-black/30 backdrop-blur-md
                     transition-colors duration-300 touch-manipulation"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
        >
          {/* Linha de cima */}
          <span
            className="absolute w-5 h-px bg-white rounded-full transition-all duration-400"
            style={{
              transform: isMenuOpen
                ? 'translateY(0) rotate(45deg)'
                : 'translateY(-4px) rotate(0deg)',
              transformOrigin: 'center',
              transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
            }}
          />
          {/* Linha de baixo */}
          <span
            className="absolute w-5 h-px bg-white rounded-full transition-all duration-400"
            style={{
              transform: isMenuOpen
                ? 'translateY(0) rotate(-45deg)'
                : 'translateY(4px) rotate(0deg)',
              transformOrigin: 'center',
              transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </button>

        {/* Card de menu */}
        <div
          className="absolute top-[68px] right-4 sm:right-5 w-64
                     bg-[#0c0a09]/95 border border-white/10 rounded-2xl
                     shadow-2xl backdrop-blur-xl overflow-hidden
                     transition-all duration-300 origin-top-right"
          style={{
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(-8px)',
            pointerEvents: isMenuOpen ? 'auto' : 'none',
          }}
        >
          <nav className="py-2" aria-label="Menu principal">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-5 py-3.5
                           font-brand text-sm text-white/60 hover:text-white
                           hover:bg-white/[0.04] transition-colors duration-200"
              >
                {item.label}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            ))}

            <div className="h-px bg-white/[0.06] mx-4 my-1" />

            <button
              onClick={() => { setIsMenuOpen(false); setShowLogin(true) }}
              className="w-full flex items-center justify-between px-5 py-3.5
                         font-brand text-sm text-primary/80 hover:text-primary
                         hover:bg-primary/[0.05] transition-colors duration-200"
            >
              Área de Membro
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          <div className="flex gap-4 px-5 py-3 border-t border-white/[0.06]">
            <a
              href="https://www.instagram.com/confrariapedrabranca/"
              target="_blank" rel="noopener noreferrer"
              className="font-brand text-[10px] uppercase tracking-[0.25em]
                         text-white/25 hover:text-primary/60 transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/5548996679017"
              target="_blank" rel="noopener noreferrer"
              className="font-brand text-[10px] uppercase tracking-[0.25em]
                         text-white/25 hover:text-primary/60 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── CARD DE LOGIN ── */}
      {showLogin && (
        <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center sm:justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative z-10 w-full sm:w-[380px] sm:m-5 animate-fade-up">
            <div className="bg-[#0c0a09] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div>
                  <p className="font-brand text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-0.5">Acesso exclusivo</p>
                  <h2 className="font-display text-xl uppercase tracking-tight text-white">Área de Membro</h2>
                </div>
                <button onClick={() => setShowLogin(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  aria-label="Fechar">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-phone" className="font-brand text-[10px] uppercase tracking-[0.2em] text-white/40">Telefone</label>
                  <input
                    id="login-phone" type="tel" placeholder="(00) 00000-0000"
                    value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))}
                    maxLength={15} disabled={loginLoading}
                    className="w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08]
                               text-white placeholder:text-white/20 font-brand text-sm
                               focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="font-brand text-[10px] uppercase tracking-[0.2em] text-white/40">Senha</label>
                  <div className="relative">
                    <input
                      id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      disabled={loginLoading}
                      className="w-full h-12 px-4 pr-12 rounded-lg bg-white/[0.03] border border-white/[0.08]
                                 text-white placeholder:text-white/20 font-brand text-sm
                                 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {loginError && <p className="font-brand text-xs text-red-400/80">{loginError}</p>}
                <button type="submit" disabled={loginLoading || !phone || !password}
                  className="w-full h-12 rounded-lg bg-primary text-black font-display text-sm uppercase tracking-widest
                             hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center justify-center gap-2">
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                </button>
                <div className="text-center pt-1">
                  <Link href="/auth"
                    className="font-brand text-[10px] uppercase tracking-[0.2em] text-white/25 hover:text-primary/60 transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── [1] HERO — vídeo 16:9 sem corte ── */}
      <section className="relative bg-[#0c0a09]" aria-label="Confraria Pedra Branca">
        {/* Container 16:9 no mobile, altura cheia no desktop */}
        <div className="relative w-full aspect-video md:aspect-auto md:h-[92dvh]">
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/hero.mp4"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(12,10,9,0.05) 0%, rgba(12,10,9,0.0) 20%, rgba(12,10,9,0.45) 70%, rgba(12,10,9,1) 100%)',
            }}
          />

          {/* Nome sobreposto */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none px-4">
            <h1
              className="font-display uppercase leading-[0.87] tracking-tight text-white text-center
                         text-[8vw] sm:text-[6rem] md:text-[7rem] lg:text-[9rem] xl:text-[11rem]
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '200ms' }}
            >
              CONFRARIA
            </h1>
            <p
              className="font-display uppercase text-white/55 text-center
                         text-[3.2vw] sm:text-[2.2rem] md:text-[2.6rem] lg:text-[3.4rem] xl:text-[4.2rem]
                         tracking-[0.14em] leading-none mt-2 sm:mt-3
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '420ms' }}
            >
              PEDRA BRANCA
            </p>
          </div>

          {/* Scroll indicator — só no desktop */}
          <div
            className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-up"
            style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}
          >
            <div className="w-px h-14 bg-gradient-to-b from-primary/50 to-transparent animate-bounce mx-auto" />
          </div>
        </div>
      </section>

      {/* ── [2] MANIFESTO ── */}
      <section
        className="bg-[#0c0a09] px-5 sm:px-8 py-20 sm:py-28 lg:py-36 text-center"
        aria-label="Sobre a Confraria Pedra Branca"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display uppercase leading-[0.88] tracking-tight text-white
                         text-[2.8rem] sm:text-[4.2rem] md:text-[5.5rem] lg:text-[7rem]">
            CONFRARIA
          </h2>
          <p className="font-display uppercase text-white/35 tracking-[0.12em]
                        text-[1.2rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.8rem]
                        leading-none mt-1 sm:mt-2 mb-12 sm:mb-16">
            PEDRA BRANCA
          </p>

          <div className="space-y-6 sm:space-y-8 max-w-xl mx-auto">
            <p className="font-serif italic text-white/70 leading-relaxed
                          text-xl sm:text-2xl md:text-3xl">
              Um grupo seleto de empresários e líderes que constroem com propósito, confiam uns nos outros e fazem acontecer juntos.
            </p>
            <p className="font-brand text-white/40 leading-relaxed text-base sm:text-lg">
              Na Confraria, o conhecimento circula sem reservas, os desafios são divididos por escolha e as conquistas são celebradas com orgulho genuíno. Networking real — o tipo que transforma negócios e forma amizades verdadeiras.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-2.5 font-brand text-xs uppercase tracking-[0.25em]
                           text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/50
                           px-6 py-3.5 rounded-full transition-all duration-300 touch-manipulation"
              >
                Sou membro
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── [3] NOSSAS EMPRESAS ── */}
      {companies.length > 0 && (
        <section
          id="empresas"
          className="bg-[#0c0a09] border-t border-white/[0.05] px-5 sm:px-8 py-20 sm:py-28"
          aria-label="Empresas da Confraria Pedra Branca"
        >
          <div className="mx-auto max-w-7xl">
            <p className="font-brand text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/20 mb-8 sm:mb-10">
              Empresas da Confraria Pedra Branca
            </p>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-0">
              {companies.map((company, index) => (
                <div
                  key={company.id}
                  className="animate-fade-up opacity-0 break-inside-avoid"
                  style={{ animationDelay: `${index * 35}ms`, animationFillMode: 'forwards' }}
                >
                  {company.website || company.instagram ? (
                    <a
                      href={company.website || `https://instagram.com/${company.instagram}`}
                      target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between px-4 py-4 sm:py-3.5
                                 border border-white/[0.06] hover:border-primary/30
                                 hover:bg-primary/[0.03] active:bg-primary/[0.06] transition-colors duration-300"
                    >
                      <span className="font-brand text-sm text-white/50 group-hover:text-primary transition-colors duration-300 truncate pr-2">
                        {company.name}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
                    </a>
                  ) : (
                    <div className="flex items-center px-4 py-4 sm:py-3.5 border border-white/[0.06]">
                      <span className="font-brand text-sm text-white/25 truncate">{company.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── [4] FOOTER ── */}
      <footer className="bg-black border-t border-white/[0.04] py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/confrariapedrabranca/" target="_blank" rel="noopener noreferrer"
                className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                           hover:bg-primary/20 hover:text-primary active:bg-primary/30 transition-colors text-white/40 touch-manipulation"
                aria-label="Instagram da Confraria">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://wa.me/5548996679017" target="_blank" rel="noopener noreferrer"
                className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                           hover:bg-primary/20 hover:text-primary active:bg-primary/30 transition-colors text-white/40 touch-manipulation"
                aria-label="WhatsApp da Confraria">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
            <p className="text-white/15 text-xs font-brand uppercase tracking-widest">
              Desenvolvido pela <span className="text-primary/40">Seivi</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
