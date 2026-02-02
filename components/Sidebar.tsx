'use client'

import { useState, useMemo, useCallback } from 'react'
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
            { path: '/admin/prospects', icon: UserCheck, label: 'Interessados' },
            { path: '/pre-register', icon: UserPlus, label: 'Pre-Cadastro' },
          ]
        : [],
    [role]
  )

  const allItems = useMemo(
    () => [...navigationItems, ...adminItems],
    [navigationItems, adminItems]
  )

  const NavContent = useCallback(
    ({ collapsed = false }: { collapsed?: boolean }) => (
      <>
        <div className="space-y-1">
          {allItems.map((item) => {
            const navItem = (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 transition-colors',
                  collapsed ? 'justify-center' : 'gap-3',
                  isActive(item.path)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            // Only show tooltip on collapsed desktop sidebar
            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return navItem
          })}
        </div>
        <div className="mt-auto">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          )}
        </div>
      </>
    ),
    [allItems, isActive, handleLogout]
  )

  // Prevent hydration mismatch by only showing collapse state after mount
  const effectiveCollapsed = isMounted ? isCollapsed : false

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border fixed h-screen transition-all duration-300',
          effectiveCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header with Logo and Toggle */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {!effectiveCollapsed && (
            <img
              src="/Confraria branca.png"
              alt="Confraria Pedra Branca"
              className="h-20 w-auto object-contain"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            title={effectiveCollapsed ? 'Expandir menu' : 'Retrair menu'}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col overflow-hidden">
          <NavContent collapsed={effectiveCollapsed} />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
            <div className="p-4 border-b border-sidebar-border flex justify-center">
              <img
                src="/Confraria branca.png"
                alt="Confraria Pedra Branca"
                className="h-20 w-auto object-contain"
              />
            </div>
            <nav className="flex-1 p-3 flex flex-col h-[calc(100vh-8rem)]">
              <NavContent collapsed={false} />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1"></div>
        <div className="w-10"></div>
      </div>
    </TooltipProvider>
  )
}
