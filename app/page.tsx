'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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

      {/* Navbar — só o botão de menu, sem logo */}
      <header className="fixed top-0 right-0 z-[9998] p-4 sm:p-5">
        <button
          onClick={toggleMenu}
          className="w-14 h-14 relative flex flex-col gap-[7px] items-center justify-center bg-primary rounded-xl cursor-pointer z-[10000] hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black transition-all touch-manipulation"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
        >
          <span className="toggle-line-top w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
          <span className="toggle-line-bottom w-6 h-[2px] bg-black rounded-full transition-transform" aria-hidden="true" />
        </button>
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

          {/* Overlay mais translúcido — vídeo bem visível */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(12,10,9,0.05) 0%, rgba(12,10,9,0.0) 25%, rgba(12,10,9,0.45) 70%, rgba(12,10,9,1) 100%)',
            }}
          />

          {/* Nome — entrada animada com stagger */}
          <div className="relative z-10 text-center px-4 select-none">
            <h1
              className="font-display uppercase leading-[0.88] tracking-tight text-white
                         text-[3.5rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[9rem] xl:text-[11rem]
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '200ms' }}
            >
              CONFRARIA
            </h1>
            <p
              className="font-display uppercase leading-[0.92] text-white/70
                         text-[1.6rem] sm:text-[2.4rem] md:text-[3rem] lg:text-[3.8rem] xl:text-[4.8rem]
                         tracking-[0.12em] mt-2 sm:mt-3
                         animate-hero-in"
              style={{ animationFillMode: 'both', animationDelay: '450ms' }}
            >
              PEDRA BRANCA
            </p>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 animate-fade-up opacity-0"
            style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}
          >
            <div className="w-px h-12 sm:h-16 bg-gradient-to-b from-primary/60 to-transparent animate-bounce mx-auto" />
          </div>
        </section>

        {/* [2] MANIFESTO — CONFRARIA / PEDRA BRANCA como título, sem label */}
        <section
          className="bg-background border-t border-white/[0.06] px-5 sm:px-8 py-20 sm:py-28 lg:py-36"
          aria-label="O que é a Confraria Pedra Branca"
        >
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display uppercase leading-[0.9] tracking-tight text-white mb-10 sm:mb-14
                           text-[2.6rem] sm:text-[3.8rem] md:text-[5rem] lg:text-[6.5rem]">
              CONFRARIA<br />
              PEDRA BRANCA
            </h2>
            <div className="border-t border-white/[0.06] pt-8 sm:pt-12 space-y-5 max-w-2xl">
              <p className="font-serif text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed italic">
                O networking autêntico que todo empresário procura, mas raramente encontra.
              </p>
              <p className="font-brand text-sm sm:text-base text-white/45 leading-relaxed">
                Fortalecemos líderes de negócios da nossa região, criando um ambiente de confiança mútua. Conhecimento compartilhado sem segundas intenções, desafios divididos por escolha, conquistas celebradas com orgulho genuíno.
              </p>
            </div>
          </div>
        </section>

        {/* [3] NOSSAS EMPRESAS */}
        {companies.length > 0 && (
          <section
            id="empresas"
            className="bg-background border-t border-white/[0.06] px-5 sm:px-8 py-20 sm:py-28"
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between px-4 py-4 sm:py-3
                                   border border-white/[0.06] hover:border-primary/30
                                   hover:bg-primary/[0.03] transition-colors duration-300
                                   active:bg-primary/[0.06]"
                      >
                        <span className="font-brand text-sm text-white/50 group-hover:text-primary transition-colors duration-300 truncate pr-2">
                          {company.name}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center px-4 py-4 sm:py-3 border border-white/[0.06]">
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
        <footer className="bg-black border-t border-white/[0.04] py-10 sm:py-12">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/confrariapedrabranca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                             hover:bg-primary/20 hover:text-primary active:bg-primary/30
                             transition-colors text-white/50 touch-manipulation"
                  aria-label="Instagram da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/5548996679017"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
                             hover:bg-primary/20 hover:text-primary active:bg-primary/30
                             transition-colors text-white/50 touch-manipulation"
                  aria-label="WhatsApp da Confraria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
