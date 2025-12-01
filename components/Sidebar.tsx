'use client'

import { useState, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Building2,
  LogOut,
  UserPlus,
  UserCheck,
  Menu,
  User,
  Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface SidebarProps {
  role: string | null
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    () => (
      <>
        <div className="space-y-1">
          {allItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </>
    ),
    [allItems, isActive, handleLogout]
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed h-screen">
        <div className="p-4 border-b border-sidebar-border flex justify-center">
          <img
            src="/Confraria branca.png"
            alt="Confraria Pedra Branca"
            className="h-24 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 p-3 flex flex-col">
          <NavContent />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-3">
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
            <nav className="flex-1 p-3 flex flex-col h-[calc(100vh-5.5rem)]">
              <NavContent />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center justify-center flex-1">
          <img
            src="/Confraria branca.png"
            alt="Confraria Pedra Branca"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="w-10"></div>
      </div>
    </>
  )
}
