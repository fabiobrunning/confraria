import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  LogOut,
  UserPlus,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

interface Profile {
  role: string;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error || !profileData) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil do usuário.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/members", icon: Users, label: "Membros" },
    { path: "/companies", icon: Building2, label: "Empresas" },
    { path: "/groups", icon: Layers, label: "Grupos de Consórcio" },
  ];

  const adminItems = profile?.role === "admin" 
    ? [{ path: "/pre-register", icon: UserPlus, label: "Pré-Cadastro" }]
    : [];

  const allItems = [...navigationItems, ...adminItems];

  const NavContent = () => (
    <>
      <div className="space-y-1">
        {allItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
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
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border flex justify-center">
          <img
            src="/logo-confraria.png"
            alt="Confraria Pedra Branca"
            className="h-24 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 p-3 flex flex-col">
          <NavContent />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
            <div className="p-4 border-b border-sidebar-border flex justify-center">
              <img
                src="/logo-confraria.png"
                alt="Confraria Pedra Branca"
                className="h-20 w-auto object-contain"
              />
            </div>
            <nav className="flex-1 p-3 flex flex-col h-[calc(100vh-5.5rem)]">
              <NavContent />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <img
            src="/logo-confraria.png"
            alt="Confraria Pedra Branca"
            className="h-7 w-auto object-contain"
          />
          <span className="font-bold text-sidebar-foreground text-sm">Confraria Pedra Branca</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
