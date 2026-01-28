'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'

const menuItems = [
  { label: 'NOSSAS EMPRESAS', href: '/companies', bgIndex: 1 },
  { label: 'AREA DE MEMBRO', href: '/auth', bgIndex: 2 },
  { label: 'QUERO CONHECER', href: '/quero-conhecer', bgIndex: 3 },
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
  const [membros, setMembros] = useState(140)
  const [empresas, setEmpresas] = useState(150)
  const [valor, setValor] = useState(15)
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

            {/* Right side: Menu Toggle */}
            <div className="flex items-center">
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
              Pessoas com visão geram negócios com propósito
            </h1>

            {/* Subheadline */}
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-white/80 max-w-[900px] mx-auto mb-10 sm:mb-8 leading-relaxed font-medium">
              O networking autêntico que todo empresário procura, mas raramente encontra.
            </p>

            {/* Description */}
            <p className="text-white/60 text-lg sm:text-xl md:text-2xl max-w-[850px] mx-auto mb-12 sm:mb-10 leading-relaxed">
              Fortalecemos líderes de negócios da nossa região, criando um ambiente de confiança mútua. Conhecimento compartilhado sem segundas intenções, desafios divididos por escolha, conquistas celebradas com orgulho genuíno.
            </p>

            {/* Scroll indicator */}
            <div className="mt-8 sm:mt-6 flex flex-col items-center gap-3 animate-pulse">
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-white/80 max-w-[900px] mx-auto leading-relaxed font-medium">E nossos números refletem exatamente isso:</p>
              <div className="w-0.5 h-40 bg-gradient-to-b from-white/40 via-white/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* Counter Section */}
        <section
          ref={counterSectionRef}
          className="bg-black px-4 sm:px-6 py-10 sm:py-14 border-t border-white/5"
          aria-label="Estatisticas da Confraria"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
              {/* Membros */}
              <div className="group">
                <div
                  className="text-white font-bold font-cormorant mb-1 text-8xl sm:text-9xl md:text-[10rem] leading-none transition-all duration-300 group-hover:text-accent"
                  aria-label={`${membros} membros ativos`}
                >
                  {membros}
                </div>
                <div className="text-base sm:text-lg font-medium text-white/60 tracking-[0.15em] uppercase">
                  Membros Ativos
                </div>
              </div>

              {/* Empresas */}
              <div className="group">
                <div
                  className="text-white font-bold font-cormorant mb-1 text-8xl sm:text-9xl md:text-[10rem] leading-none transition-all duration-300 group-hover:text-accent"
                  aria-label={`${empresas} empresas conectadas`}
                >
                  {empresas}
                </div>
                <div className="text-base sm:text-lg font-medium text-white/60 tracking-[0.15em] uppercase">
                  Empresas Conectadas
                </div>
              </div>

              {/* Valor */}
              <div className="group">
                <div
                  className="text-accent font-bold font-cormorant mb-1 text-8xl sm:text-9xl md:text-[10rem] leading-none transition-all duration-300 group-hover:scale-105"
                  aria-label={`Mais de ${valor} milhões em valor movimentado`}
                >
                  +{valor}M
                </div>
                <div className="text-base sm:text-lg font-medium text-white/60 tracking-[0.15em] uppercase">
                  Valor Movimentado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/confrariapedrabranca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors text-white/60"
                  aria-label="Instagram da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/5548996898577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors text-white/60"
                  aria-label="WhatsApp da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>

              {/* Developer Credit */}
              <p className="text-white/40 text-sm">
                Desenvolvido pela{' '}
                <a
                  href="https://looping.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Looping
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
