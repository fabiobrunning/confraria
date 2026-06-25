'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { ArrowUpRight, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { maskPhone } from '@/lib/utils/phone'
import { registerFirstLogin, trackFailedLogin } from '@/app/actions/auth'

const menuItems = [
  { label: 'NOSSAS EMPRESAS', href: '#empresas' },
  { label: 'QUERO CONHECER', href: '/quero-conhecer' },
]

const bgImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string; website: string | null; instagram: string | null }[]>([])

  // Login form state
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const menuOverlayRef = useRef<HTMLDivElement>(null)
  const pageContentRef = useRef<HTMLDivElement>(null)
  const bgImgsRef = useRef<(HTMLImageElement | null)[]>([])
  const menuTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/public/companies')
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (bgImgsRef.current[0]) {
      gsap.set(bgImgsRef.current[0], { opacity: 1 })
    }

    const tl = gsap.timeline({ paused: true })

    tl.to(menuOverlayRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.5,
      ease: 'power4.inOut',
    }, 0)
      .to(pageContentRef.current, {
        yPercent: 10,
        rotation: 8,
        scale: 1.1,
        transformOrigin: 'center top',
        duration: 0.5,
        ease: 'power4.inOut',
      }, 0)
      .to(bgImgsRef.current, { scale: 1.05, duration: 0.6, ease: 'power2.out' }, 0)
      .fromTo('.menu-link-char', { yPercent: 100, opacity: 0 }, {
        yPercent: 0, opacity: 1, ease: 'power3.out', duration: 0.3, stagger: 0.015,
      }, 0.2)
      .to('.toggle-line-top', {
        y: 4, scaleX: 0.8, rotation: 45, transformOrigin: 'center', duration: 0.3, ease: 'power2.out',
      }, 0.1)
      .to('.toggle-line-bottom', {
        y: -4, scaleX: 0.8, rotation: -45, transformOrigin: 'center', duration: 0.3, ease: 'power2.out',
      }, 0.1)

    menuTimelineRef.current = tl
    return () => { tl.kill() }
  }, [])

  const toggleMenu = () => {
    if (!menuTimelineRef.current) return
    if (isMenuOpen) {
      menuTimelineRef.current.reverse()
    } else {
      menuTimelineRef.current.play()
    }
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    menuTimelineRef.current?.reverse()
    setIsMenuOpen(false)
  }

  const handleMenuItemHover = (index: number) => {
    gsap.to(bgImgsRef.current, { opacity: 0, duration: 0.3 })
    gsap.to(bgImgsRef.current[index], { opacity: 1, scale: 1.08, duration: 0.4 })
  }

  const handleMenuItemLeave = () => {
    gsap.to(bgImgsRef.current, { opacity: 0, scale: 1, duration: 0.3 })
    gsap.to(bgImgsRef.current[0], { opacity: 1, duration: 0.3 })
  }

  const splitText = (text: string) => text.split('').map((char, i) => (
    <span key={i} className="menu-link-char inline-block" style={{ opacity: 0 }}>
      {char === ' ' ? ' ' : char}
    </span>
  ))

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
    <div className="relative">

      {/* ── MENU OVERLAY ── */}
      <div
        ref={menuOverlayRef}
        className="fixed inset-0 h-[100dvh] w-screen z-[9999]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacao"
      >
        <div className="absolute inset-0 bg-black -z-10">
          {bgImages.map((src, i) => (
            <img
              key={i}
              ref={(el) => { bgImgsRef.current[i] = el }}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              loading="lazy"
            />
          ))}
        </div>
        <div className="bg-black/75 backdrop-blur-xl w-full h-full flex flex-col">
          {/* Menu header */}
          <div className="flex justify-end p-4 sm:p-5">
            <button
              onClick={closeMenu}
              className="w-14 h-14 flex flex-col gap-[7px] items-center justify-center
                         border border-white/20 rounded-xl hover:border-white/40
                         transition-colors touch-manipulation"
              aria-label="Fechar menu"
            >
              <span className="toggle-line-top w-5 h-px bg-white rounded-full" />
              <span className="toggle-line-bottom w-5 h-px bg-white rounded-full" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col items-center justify-center px-6 gap-2"
            aria-label="Menu principal">
            {menuItems.map((item, i) => (
              <div
                key={item.label}
                onMouseEnter={() => handleMenuItemHover(i)}
                onMouseLeave={handleMenuItemLeave}
              >
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="font-display text-4xl sm:text-6xl md:text-7xl leading-none tracking-tight
                             text-white/70 hover:text-white transition-colors duration-200
                             block py-4 px-3 text-center"
                >
                  {splitText(item.label)}
                </Link>
              </div>
            ))}

            {/* Área de membro — abre card */}
            <button
              onClick={() => { closeMenu(); setTimeout(() => setShowLogin(true), 350) }}
              className="font-display text-4xl sm:text-6xl md:text-7xl leading-none tracking-tight
                         text-primary hover:text-primary/80 transition-colors duration-200
                         py-4 px-3 text-center block"
              onMouseEnter={() => handleMenuItemHover(2)}
              onMouseLeave={handleMenuItemLeave}
            >
              {splitText('ÁREA DE MEMBRO')}
            </button>
          </nav>

          {/* Rodapé do menu */}
          <div className="flex justify-center gap-5 pb-10">
            <a
              href="https://www.instagram.com/confrariapedrabranca/"
              target="_blank" rel="noopener noreferrer"
              className="font-brand text-[10px] uppercase tracking-[0.3em] text-white/30
                         hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <span className="text-white/10">·</span>
            <a
              href="https://wa.me/5548996679017"
              target="_blank" rel="noopener noreferrer"
              className="font-brand text-[10px] uppercase tracking-[0.3em] text-white/30
                         hover:text-primary transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── BOTÃO DE MENU — canto superior direito ── */}
      <header className="fixed top-0 right-0 z-[9998] p-4 sm:p-5">
        <button
          onClick={toggleMenu}
          className="group w-14 h-14 flex flex-col gap-[9px] items-center justify-center
                     border border-white/25 hover:border-primary/60
                     bg-black/20 hover:bg-black/40 backdrop-blur-md
                     rounded-xl transition-all duration-300 touch-manipulation"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
        >
          <span className="toggle-line-top block w-5 h-px bg-white group-hover:bg-primary rounded-full transition-colors duration-300" />
          <span className="toggle-line-bottom block w-5 h-px bg-white/60 group-hover:bg-primary/60 rounded-full transition-colors duration-300" />
        </button>
      </header>

      {/* ── CARD DE LOGIN — painel lateral ── */}
      {showLogin && (
        <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center sm:justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogin(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full sm:w-[380px] sm:m-5 animate-fade-up sm:animate-none sm:[animation:slide-in-right_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="bg-[#0c0a09] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl
                            shadow-2xl overflow-hidden">
              {/* Header do card */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4
                              border-b border-white/[0.06]">
                <div>
                  <p className="font-brand text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-0.5">
                    Acesso exclusivo
                  </p>
                  <h2 className="font-display text-xl uppercase tracking-tight text-white">
                    Área de Membro
                  </h2>
                </div>
                <button
                  onClick={() => setShowLogin(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/30
                             hover:text-white transition-colors rounded-lg
                             hover:bg-white/5 touch-manipulation"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-phone"
                    className="font-brand text-[10px] uppercase tracking-[0.2em] text-white/40"
                  >
                    Telefone
                  </label>
                  <input
                    id="login-phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    maxLength={15}
                    disabled={loginLoading}
                    className="w-full h-12 px-4 rounded-lg
                               bg-white/[0.03] border border-white/[0.08]
                               text-white placeholder:text-white/20
                               font-brand text-sm
                               focus:outline-none focus:border-primary/50
                               disabled:opacity-50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="font-brand text-[10px] uppercase tracking-[0.2em] text-white/40"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginLoading}
                      className="w-full h-12 px-4 pr-12 rounded-lg
                                 bg-white/[0.03] border border-white/[0.08]
                                 text-white placeholder:text-white/20
                                 font-brand text-sm
                                 focus:outline-none focus:border-primary/50
                                 disabled:opacity-50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p className="font-brand text-xs text-red-400/80">{loginError}</p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !phone || !password}
                  className="w-full h-12 rounded-lg bg-primary text-black
                             font-display text-sm uppercase tracking-widest
                             hover:bg-primary/90 active:scale-[0.98]
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loginLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Entrar'}
                </button>

                <div className="text-center pt-1">
                  <Link
                    href="/auth"
                    className="font-brand text-[10px] uppercase tracking-[0.2em]
                               text-white/25 hover:text-primary/60 transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      <div ref={pageContentRef} className="page-content will-change-transform">

        {/* [1] HERO */}
        <section
          className="relative flex flex-col items-center justify-center overflow-hidden
                     h-[72dvh] sm:h-[85dvh] lg:h-[92dvh]"
          aria-label="Confraria Pedra Branca"
        >
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover object-center"
            src="/videos/motion.mp4"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(12,10,9,0.04) 0%, rgba(12,10,9,0.0) 20%, rgba(12,10,9,0.4) 65%, rgba(12,10,9,1) 100%)',
            }}
          />

          <div className="relative z-10 text-center px-4 select-none">
            <h1
              className="font-display uppercase leading-[0.87] tracking-tight text-white
                         text-[3.2rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[9rem] xl:text-[11rem]
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '200ms' }}
            >
              CONFRARIA
            </h1>
            <p
              className="font-display uppercase text-white/60
                         text-[1.3rem] sm:text-[2.1rem] md:text-[2.7rem] lg:text-[3.5rem] xl:text-[4.4rem]
                         tracking-[0.14em] leading-none mt-2 sm:mt-3
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '420ms' }}
            >
              PEDRA BRANCA
            </p>
          </div>

          <div
            className="absolute bottom-7 sm:bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-up"
            style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}
          >
            <div className="w-px h-12 sm:h-16 bg-gradient-to-b from-primary/50 to-transparent animate-bounce mx-auto" />
          </div>
        </section>

        {/* [2] MANIFESTO */}
        <section
          className="bg-background px-5 sm:px-8 py-20 sm:py-28 lg:py-36 text-center"
          aria-label="Sobre a Confraria Pedra Branca"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              className="font-display uppercase leading-[0.88] tracking-tight text-white
                         text-[2.8rem] sm:text-[4.2rem] md:text-[5.5rem] lg:text-[7rem]
                         animate-fade-up"
            >
              CONFRARIA
            </h2>
            <p
              className="font-display uppercase text-white/40 tracking-[0.12em]
                         text-[1.2rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.8rem]
                         leading-none mt-1 sm:mt-2 mb-10 sm:mb-14 animate-fade-up"
              style={{ animationDelay: '150ms', animationFillMode: 'both' }}
            >
              PEDRA BRANCA
            </p>

            <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto">
              <p
                className="font-serif italic text-white/75 leading-relaxed
                           text-lg sm:text-xl md:text-2xl"
              >
                Um grupo seleto de empresários e líderes que constroem com propósito,
                confiam uns nos outros e fazem acontecer juntos.
              </p>
              <p
                className="font-brand text-white/45 leading-relaxed
                           text-sm sm:text-base md:text-lg"
              >
                Na Confraria, o conhecimento circula sem reservas, os desafios são divididos
                por escolha e as conquistas são celebradas com orgulho genuíno.
                Isso é networking real — o tipo que transforma negócios e forma amizades verdadeiras.
              </p>

              {/* CTA — abre o card de login */}
              <div className="pt-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-2.5
                             font-brand text-xs uppercase tracking-[0.25em]
                             text-primary/70 hover:text-primary
                             border border-primary/20 hover:border-primary/50
                             px-6 py-3.5 rounded-full
                             transition-all duration-300 touch-manipulation"
                >
                  Sou membro
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* [3] NOSSAS EMPRESAS */}
        {companies.length > 0 && (
          <section
            id="empresas"
            className="bg-background border-t border-white/[0.05] px-5 sm:px-8 py-20 sm:py-28"
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
                                   hover:bg-primary/[0.03] active:bg-primary/[0.06]
                                   transition-colors duration-300"
                      >
                        <span className="font-brand text-sm text-white/50 group-hover:text-primary
                                         transition-colors duration-300 truncate pr-2">
                          {company.name}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-0
                                                  group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
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

        {/* [4] FOOTER */}
        <footer className="bg-black border-t border-white/[0.04] py-10 sm:py-12">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/confrariapedrabranca/"
                  target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                             hover:bg-primary/20 hover:text-primary active:bg-primary/30
                             transition-colors text-white/40 touch-manipulation"
                  aria-label="Instagram da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/5548996679017"
                  target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                             hover:bg-primary/20 hover:text-primary active:bg-primary/30
                             transition-colors text-white/40 touch-manipulation"
                  aria-label="WhatsApp da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="currentColor" aria-hidden="true">
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
    </div>
  )
}
