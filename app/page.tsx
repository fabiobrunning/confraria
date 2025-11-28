'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'

const menuItems = [
  { label: 'INICIO', href: '/dashboard', bgIndex: 1 },
  { label: 'GRUPOS', href: '/groups', bgIndex: 2 },
  { label: 'MEMBROS', href: '/members', bgIndex: 3 },
  { label: 'EMPRESAS', href: '/companies', bgIndex: 4 },
  { label: 'ENTRAR', href: '/auth', bgIndex: 5 },
]

const bgImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [membros, setMembros] = useState(0)
  const [empresas, setEmpresas] = useState(0)
  const [valor, setValor] = useState(0)
  const [countersStarted, setCountersStarted] = useState(false)

  const menuOverlayRef = useRef<HTMLDivElement>(null)
  const pageContentRef = useRef<HTMLDivElement>(null)
  const bgImgsRef = useRef<(HTMLImageElement | null)[]>([])
  const menuTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const counterSectionRef = useRef<HTMLDivElement>(null)

  // GSAP Menu Animation
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
      .to(bgImgsRef.current, {
        scale: 1.05,
        duration: 0.6,
        ease: 'power2.out',
      }, 0)
      .fromTo('.menu-link-char', { yPercent: 100, opacity: 0 }, {
        yPercent: 0,
        opacity: 1,
        ease: 'power3.out',
        duration: 0.3,
        stagger: 0.015,
      }, 0.2)
      .to('.toggle-line-top', {
        y: 4,
        scaleX: 0.8,
        rotation: 45,
        transformOrigin: 'center',
        duration: 0.3,
        ease: 'power2.out',
      }, 0.1)
      .to('.toggle-line-bottom', {
        y: -4,
        scaleX: 0.8,
        rotation: -45,
        transformOrigin: 'center',
        duration: 0.3,
        ease: 'power2.out',
      }, 0.1)
      .fromTo('.social-link', { opacity: 0, y: 10 }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      }, 0.4)

    menuTimelineRef.current = tl

    return () => { tl.kill() }
  }, [])

  // Counters Animation with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true)
            startCounters()
          }
        })
      },
      { threshold: 0.3 }
    )

    if (counterSectionRef.current) {
      observer.observe(counterSectionRef.current)
    }

    return () => observer.disconnect()
  }, [countersStarted])

  const startCounters = () => {
    // Smoother counter animations with easing
    const duration = 2000 // 2 seconds
    const frameRate = 1000 / 60 // 60fps
    const totalFrames = duration / frameRate

    // Easing function for smooth deceleration
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

    let frame1 = 0
    const timer1 = setInterval(() => {
      frame1++
      const progress = easeOutQuart(frame1 / totalFrames)
      const current = Math.round(progress * 140)
      setMembros(current)
      if (frame1 >= totalFrames) {
        setMembros(140)
        clearInterval(timer1)
      }
    }, frameRate)

    let frame2 = 0
    const timer2 = setInterval(() => {
      frame2++
      const progress = easeOutQuart(frame2 / totalFrames)
      const current = Math.round(progress * 150)
      setEmpresas(current)
      if (frame2 >= totalFrames) {
        setEmpresas(150)
        clearInterval(timer2)
      }
    }, frameRate)

    let frame3 = 0
    const timer3 = setInterval(() => {
      frame3++
      const progress = easeOutQuart(frame3 / totalFrames)
      const current = Math.round(progress * 15)
      setValor(current)
      if (frame3 >= totalFrames) {
        setValor(15)
        clearInterval(timer3)
      }
    }, frameRate)
  }

  const toggleMenu = () => {
    if (!menuTimelineRef.current) return
    if (isMenuOpen) {
      menuTimelineRef.current.reverse()
    } else {
      menuTimelineRef.current.play()
    }
    setIsMenuOpen(!isMenuOpen)
  }

  const handleMenuItemHover = (index: number) => {
    gsap.to(bgImgsRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
    gsap.to(bgImgsRef.current[index], { opacity: 1, scale: 1.1, duration: 0.4, ease: 'power2.out' })
  }

  const handleMenuItemLeave = () => {
    gsap.to(bgImgsRef.current, { opacity: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
    gsap.to(bgImgsRef.current[0], { opacity: 1, duration: 0.3, ease: 'power2.out' })
  }

  const splitText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} className="menu-link-char inline-block" style={{ opacity: 0 }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  return (
    <div className="relative">
      {/* Menu Overlay */}
      <div
        ref={menuOverlayRef}
        className="menu-overlay fixed inset-0 h-[100dvh] w-screen z-[9999]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacao"
      >
        <div className="absolute inset-0 bg-black pointer-events-none -z-10">
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
        <div className="w-full h-full">
          <div className="bg-black/70 backdrop-blur-xl w-full h-full px-6 py-20 flex flex-col items-center justify-center text-center">
            <nav className="w-full" aria-label="Menu principal">
              <ul className="space-y-5 md:space-y-4">
                {menuItems.map((item) => (
                  <li
                    key={item.label}
                    className="transition-opacity duration-200"
                    onMouseEnter={() => handleMenuItemHover(item.bgIndex)}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none tracking-tight text-white/90 hover:text-accent active:text-accent focus:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-4 focus:ring-offset-black rounded-md transition-all duration-200 block py-3 px-2"
                    >
                      {splitText(item.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-16 md:mt-12">
              <ul className="flex gap-8 text-white/70 text-base font-medium">
                <li>
                  <a
                    href="#"
                    className="social-link hover:text-accent focus:text-accent focus:outline-none focus:underline transition-colors"
                    style={{ opacity: 0 }}
                    aria-label="Instagram da Confraria"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="social-link hover:text-accent focus:text-accent focus:outline-none focus:underline transition-colors"
                    style={{ opacity: 0 }}
                    aria-label="WhatsApp da Confraria"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 w-full z-[9998]">
        <nav className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6" aria-label="Navegacao principal">
          <div className="flex justify-between items-center max-w-[1440px] mx-auto">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" aria-label="Confraria Pedra Branca - Pagina inicial">
                <Image
                  src="/Confraria branca.png"
                  alt="Confraria Pedra Branca"
                  width={180}
                  height={48}
                  className="h-10 sm:h-12 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Right side: Login Card + Menu Toggle */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mini Login Card - Desktop */}
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-accent/30 focus:bg-black/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all duration-200 group"
                aria-label="Acessar area do membro"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white/90 text-sm font-medium group-hover:text-accent transition-colors">Area do Membro</p>
                  <p className="text-white/40 text-xs">Acesso exclusivo</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-accent group-hover:translate-x-1 transition-all" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>

              {/* Menu Toggle */}
              <button
                onClick={toggleMenu}
                className="w-14 h-14 sm:w-12 sm:h-12 relative flex flex-col gap-[6px] items-center justify-center bg-accent rounded-xl cursor-pointer z-[10000] hover:bg-accent/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black transition-all touch-manipulation"
                aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isMenuOpen}
              >
                <span className="toggle-line-top w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
                <span className="toggle-line-bottom w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <div ref={pageContentRef} className="page-content will-change-transform">
        {/* Hero Section - Text Centered */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden" aria-label="Hero section">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Centered Content */}
          <div className="px-4 sm:px-6 lg:px-8 w-full max-w-[1200px] mx-auto text-center pt-32 sm:pt-28 pb-16 sm:pb-12">
            {/* Main Headline */}
            <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight uppercase bg-gradient-to-b from-white via-white to-accent/80 bg-clip-text text-transparent mb-8 sm:mb-6">
              Pessoas com Visao geram Negocios com Proposito
            </h1>

            {/* Subheadline */}
            <p className="font-serif text-xl sm:text-2xl md:text-3xl text-white/80 max-w-[750px] mx-auto mb-10 sm:mb-8 leading-relaxed font-medium">
              O networking autentico que todo empresario procura, mas raramente encontra.
            </p>

            {/* Description */}
            <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-[650px] mx-auto mb-12 sm:mb-10 leading-relaxed">
              Fortalecemos lideres de negocios da nossa regiao, criando um ambiente de confianca mutua. Conhecimento compartilhado sem segundas intencoes, desafios divididos por escolha, conquistas celebradas com orgulho genuino.
            </p>

            {/* CTA Button - Mobile */}
            <Link
              href="/auth"
              className="sm:hidden inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent rounded-xl text-black font-display text-lg font-medium hover:bg-accent/90 focus:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-4 focus:ring-offset-black active:scale-[0.98] transition-all duration-200 touch-manipulation shadow-lg shadow-accent/20"
              aria-label="Acessar area do membro"
            >
              <span>AREA DO MEMBRO</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" fill="none" aria-hidden="true">
                <path fill="currentColor" d="m17.76 6.857-5.727-5.688a.821.821 0 0 0-1.147.01.81.81 0 0 0-.01 1.139l4.33 4.3H.819a.821.821 0 0 0-.578.238.81.81 0 0 0 .578 1.388h14.389l-4.33 4.3a.813.813 0 0 0-.19.892.813.813 0 0 0 .765.505.824.824 0 0 0 .581-.248l5.727-5.688a.81.81 0 0 0 0-1.148Z" />
              </svg>
            </Link>

            {/* Scroll indicator */}
            <div className="mt-16 sm:mt-12 flex flex-col items-center gap-3 text-white/40 animate-pulse">
              <span className="text-xs uppercase tracking-[0.2em] font-medium">Nossos numeros</span>
              <div className="w-px h-10 bg-gradient-to-b from-white/40 via-white/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* Counter Section */}
        <section
          ref={counterSectionRef}
          className="bg-black px-4 sm:px-6 py-20 sm:py-28 border-t border-white/5"
          aria-label="Estatisticas da Confraria"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 sm:mb-20">
              <p className="font-serif text-white/70 text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed">
                E nossos numeros refletem exatamente isso:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 text-center">
              {/* Membros */}
              <div className="group">
                <div
                  className="text-white font-bold font-cormorant mb-4 text-7xl sm:text-8xl md:text-[7rem] leading-none transition-all duration-300 group-hover:text-accent"
                  aria-label={`${membros} membros ativos`}
                >
                  {membros}
                </div>
                <div className="text-sm sm:text-base font-medium text-white/60 tracking-[0.15em] uppercase">
                  Membros Ativos
                </div>
              </div>

              {/* Empresas */}
              <div className="group">
                <div
                  className="text-white font-bold font-cormorant mb-4 text-7xl sm:text-8xl md:text-[7rem] leading-none transition-all duration-300 group-hover:text-accent"
                  aria-label={`${empresas} empresas conectadas`}
                >
                  {empresas}
                </div>
                <div className="text-sm sm:text-base font-medium text-white/60 tracking-[0.15em] uppercase">
                  Empresas Conectadas
                </div>
              </div>

              {/* Valor */}
              <div className="group">
                <div
                  className="text-accent font-bold font-cormorant mb-4 text-7xl sm:text-8xl md:text-[7rem] leading-none transition-all duration-300 group-hover:scale-105"
                  aria-label={`Mais de ${valor} milhoes em valor movimentado`}
                >
                  +{valor}M
                </div>
                <div className="text-sm sm:text-base font-medium text-white/60 tracking-[0.15em] uppercase">
                  Valor Movimentado
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
