'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import {
  Users,
  Building2,
  LogOut,
  UserPlus,
  UserCheck,
  Menu,
  TrendingUp,
  User,
  Coins,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: string | null
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isCollapsed, toggleCollapse, isMounted } = useSidebarState()
  const supabase = createClient()

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    toast({
      title: 'Logout realizado',
      description: 'Voce saiu do sistema com sucesso.',
    })
  }, [router, toast, supabase.auth])

  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  )

  const navigationItems = useMemo(
    () => [
      { path: '/profile', icon: User, label: 'Meu Perfil' },
      { path: '/members', icon: Users, label: 'Membros' },
    ],
    []
  )

  const adminItems = useMemo(
    () =>
      role === 'admin'
        ? [
            { path: '/admin/companies', icon: Building2, label: 'Empresas' },
            { path: '/groups', icon: Coins, label: 'Grupos e Cotas' },
            { path: '/business-transactions', icon: TrendingUp, label: 'Transações de Negócios' },
            { path: '/admin/events', icon: Calendar, label: 'Eventos' },
            { path: '/admin/prospects', icon: UserCheck, label: 'Interessados' },
            { path: '/admin/pending-members', icon: UserPlus, label: 'Membros Pendentes' },
            { path: '/pre-register', icon: UserPlus, label: 'Pré-Cadastro' },
          ]
        : [],
    [role]
  )

  const allItems = useMemo(
    () => [...navigationItems, ...adminItems],
    [navigationItems, adminItems]
  )

  const NavContent = useCallback(
    ({ collapsed = false }: { collapsed?: boolean }) => {
      const renderItem = (item: (typeof allItems)[number]) => {
        const active = isActive(item.path)
        const navItem = (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 transition-all duration-150',
              collapsed ? 'justify-center' : 'gap-3',
              active
                ? 'text-primary'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {!collapsed && active && (
              <span className="w-1 h-1 bg-primary rounded-full shrink-0 -ml-0.5 mr-0.5" />
            )}
            <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary' : '')} />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>{navItem}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        }

        return navItem
      }

      return (
      <>
        {/* Meu Espaço */}
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 py-2 font-brand text-label text-[10px] uppercase tracking-[0.2em] text-white/20 block">
              Meu Espaço
            </span>
          )}
          {navigationItems.map(renderItem)}
        </div>

        {/* Administração */}
        {adminItems.length > 0 && (
          <div className="space-y-0.5 mt-4">
            {!collapsed && (
              <>
                <div className="mx-3 my-2 border-t border-white/[0.06]" />
                <span className="px-3 py-2 font-brand text-label text-[10px] uppercase tracking-[0.2em] text-white/20 block">
                  Administração
                </span>
              </>
            )}
            {collapsed && <div className="mx-2 border-t border-white/[0.06] my-2" />}
            {adminItems.map(renderItem)}
          </div>
        )}
        <div className="mt-auto">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-white/30 hover:text-white/60"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/30 hover:text-white/60 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </>
      )
    },
    [navigationItems, adminItems, isActive, handleLogout]
  )

  // Prevent hydration mismatch by only showing collapse state after mount
  const effectiveCollapsed = isMounted ? isCollapsed : false

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-background border-r border-white/[0.06] fixed h-screen transition-all duration-300',
          effectiveCollapsed ? 'w-20' : 'w-64'
        )}
        data-sidebar-collapsed={effectiveCollapsed}
      >
        {/* Header with Logo and Toggle - Maintain min height to prevent shift */}
        <div className="h-24 min-h-24 p-4 border-b border-white/[0.06] flex items-center justify-between">
          {!effectiveCollapsed && (
            <Image
              src="/logo_confraria_br.png"
              alt="Confraria Pedra Branca"
              width={80}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-white/30 hover:text-white/60 flex-shrink-0"
            title={effectiveCollapsed ? 'Expandir menu' : 'Retrair menu'}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation - Allow scrolling for long menus */}
        <nav className="flex-1 p-3 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-sidebar scrollbar-thumb-sidebar-accent">
          <NavContent collapsed={effectiveCollapsed} />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 w-full h-14 bg-background border-b border-white/[0.06] z-50 flex items-center justify-between px-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/40 hover:text-white/70 h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-white/[0.06]">
            <div className="p-4 border-b border-white/[0.06] flex justify-center min-h-24">
              <Image
                src="/logo_confraria_br.png"
                alt="Confraria Pedra Branca"
                width={80}
                height={80}
                className="h-20 w-auto object-contain"
                priority
              />
            </div>
            <nav className="flex-1 p-3 flex flex-col overflow-y-auto scrollbar-thin scrollbar-track-sidebar scrollbar-thumb-sidebar-accent">
              <NavContent collapsed={false} />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Image
            src="/Logo_icone_br.png"
            alt="Confraria"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-sidebar-foreground font-semibold text-sm">Confraria</span>
        </div>
        <div className="w-10"></div>
      </div>
    </TooltipProvider>
  )
}
