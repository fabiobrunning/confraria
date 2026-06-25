'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'

const menuItems = [
  { label: 'NOSSAS EMPRESAS', href: '#empresas', bgIndex: 1 },
  { label: 'AREA DE MEMBRO', href: '/auth', bgIndex: 2 },
  { label: 'QUERO CONHECER', href: '/quero-conhecer', bgIndex: 3 },
]

const bgImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80',
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string; website: string | null; instagram: string | null }[]>([])

  const menuOverlayRef = useRef<HTMLDivElement>(null)
  const pageContentRef = useRef<HTMLDivElement>(null)
  const bgImgsRef = useRef<(HTMLImageElement | null)[]>([])
  const menuTimelineRef = useRef<gsap.core.Timeline | null>(null)

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
        y: 4, scaleX: 0.8, rotation: 45,
        transformOrigin: 'center', duration: 0.3, ease: 'power2.out',
      }, 0.1)
      .to('.toggle-line-bottom', {
        y: -4, scaleX: 0.8, rotation: -45,
        transformOrigin: 'center', duration: 0.3, ease: 'power2.out',
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
        {char === ' ' ? ' ' : char}
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
                      className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none tracking-tight text-white/90 hover:text-primary active:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-4 focus:ring-offset-black rounded-md transition-all duration-200 block py-3 px-2"
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
            <div className="flex-shrink-0">
              <Link href="/" aria-label="Confraria Pedra Branca - Pagina inicial">
                <Image
                  src="/logo-confraria.svg"
                  alt="Confraria Pedra Branca"
                  width={180}
                  height={48}
                  className="h-10 sm:h-12 w-auto"
                  priority
                />
              </Link>
            </div>
            <button
              onClick={toggleMenu}
              className="w-14 h-14 sm:w-12 sm:h-12 relative flex flex-col gap-[6px] items-center justify-center bg-primary rounded-xl cursor-pointer z-[10000] hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black transition-all touch-manipulation"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMenuOpen}
            >
              <span className="toggle-line-top w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
              <span className="toggle-line-bottom w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <div ref={pageContentRef} className="page-content will-change-transform">

        {/* [1] HERO — fullscreen com vídeo de fundo */}
        <section
          className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
          aria-label="Confraria Pedra Branca"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/motion.mp4"
          />
          {/* Overlay gradiente */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(12,10,9,0.3) 0%, rgba(12,10,9,0.1) 40%, rgba(12,10,9,0.7) 80%, rgba(12,10,9,1) 100%)',
            }}
          />

          {/* Nome da Confraria */}
          <div
            className="relative z-10 text-center px-4 animate-fade-up"
            style={{ animationDelay: '400ms', animationFillMode: 'both' }}
          >
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl uppercase leading-[0.92] tracking-tight text-white">
              CONFRARIA
            </h1>
            <p
              className="font-brand text-label uppercase tracking-[0.35em] text-white/40 mt-4 text-xs sm:text-sm animate-fade-up"
              style={{ animationDelay: '700ms', animationFillMode: 'both' }}
            >
              Pedra Branca
            </p>
          </div>

          {/* Indicador de scroll */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-up opacity-0"
            style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}
          >
            <div className="w-px h-14 bg-gradient-to-b from-primary/50 to-transparent animate-bounce" />
          </div>
        </section>

        {/* [2] O QUE É A CONFRARIA */}
        <section
          className="bg-background border-t border-white/[0.06] px-4 sm:px-6 py-24 sm:py-32"
          aria-label="O que é a Confraria Pedra Branca"
        >
          <div className="mx-auto max-w-4xl">
            <p className="font-brand text-label uppercase tracking-[0.25em] text-primary/60 mb-6 text-xs">
              O que é
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-[0.95] tracking-tight text-white mb-10">
              Pessoas com visão<br />
              geram negócios<br />
              com propósito
            </h2>
            <div className="border-t border-white/[0.06] pt-10 space-y-5 max-w-2xl">
              <p className="font-serif text-xl sm:text-2xl text-white/70 leading-relaxed italic">
                O networking autêntico que todo empresário procura, mas raramente encontra.
              </p>
              <p className="font-brand text-base text-white/50 leading-relaxed">
                Fortalecemos líderes de negócios da nossa região, criando um ambiente de confiança mútua. Conhecimento compartilhado sem segundas intenções, desafios divididos por escolha, conquistas celebradas com orgulho genuíno.
              </p>
            </div>
          </div>
        </section>

        {/* [3] NOSSAS EMPRESAS */}
        {companies.length > 0 && (
          <section
            id="empresas"
            className="bg-background border-t border-white/[0.06] px-4 sm:px-6 py-24 sm:py-32"
            aria-label="Empresas da Confraria Pedra Branca"
          >
            <div className="mx-auto max-w-7xl">
              <p className="font-brand text-label text-[10px] uppercase tracking-[0.3em] text-white/20 mb-10">
                Empresas da Confraria Pedra Branca
              </p>
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-0">
                {companies.map((company, index) => (
                  <div
                    key={company.id}
                    className="animate-fade-up opacity-0 break-inside-avoid"
                    style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards' }}
                  >
                    {company.website || company.instagram ? (
                      <a
                        href={company.website || `https://instagram.com/${company.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between px-4 py-3 border border-white/[0.06] hover:border-primary/30 hover:bg-primary/[0.03] transition-colors duration-300"
                      >
                        <span className="font-brand text-sm text-white/50 group-hover:text-primary transition-colors duration-300 truncate">
                          {company.name}
                        </span>
                        <ArrowUpRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-2" />
                      </a>
                    ) : (
                      <div className="flex items-center px-4 py-3 border border-white/[0.06]">
                        <span className="font-brand text-sm text-white/30 truncate">{company.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* [4] FOOTER */}
        <footer className="bg-black border-t border-white/[0.04] py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/confrariapedrabranca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors text-white/50"
                  aria-label="Instagram da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/5548996898577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors text-white/50"
                  aria-label="WhatsApp da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
              <p className="text-white/20 text-xs font-brand uppercase tracking-widest">
                Desenvolvido pela{' '}
                <span className="text-primary/50">Seivi</span>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
