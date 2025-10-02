import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Layers, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  link: string | null;
  onNavigate: (link: string) => void;
}

const StatCard = memo(({ title, value, icon: Icon, color, link, onNavigate }: StatCardProps) => {
  const handleClick = useCallback(() => {
    if (link) {
      onNavigate(link);
    }
  }, [link, onNavigate]);

  return (
    <Card 
      className={`hover:shadow-lg transition-all ${link ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    members: 0,
    companies: 0,
    groups: 0,
    activeQuotas: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    const [membersRes, companiesRes, groupsRes, quotasRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("consortium_groups").select("id", { count: "exact", head: true }),
      supabase.from("quotas").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    setStats({
      members: membersRes.count || 0,
      companies: companiesRes.count || 0,
      groups: groupsRes.count || 0,
      activeQuotas: quotasRes.count || 0,
    });
  }, []);

  const statCards = useMemo(() => [
    {
      title: "Total de Membros",
      value: stats.members,
      icon: Users,
      color: "text-primary",
      link: "/members",
    },
    {
      title: "Empresas Cadastradas",
      value: stats.companies,
      icon: Building2,
      color: "text-accent",
      link: "/companies",
    },
    {
      title: "Grupos de Consórcio",
      value: stats.groups,
      icon: Layers,
      color: "text-success",
      link: "/groups",
    },
    {
      title: "Cotas Ativas",
      value: stats.activeQuotas,
      icon: TrendingUp,
      color: "text-primary",
      link: null,
    },
  ], [stats.members, stats.companies, stats.groups, stats.activeQuotas]);

  const handleNavigate = useCallback((link: string) => {
    navigate(link);
  }, [navigate]);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão geral do sistema de consórcios</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              link={stat.link}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este é o sistema de gestão de consórcios da Confraria Pedra Branca. 
              Use o menu lateral para navegar entre as diferentes seções do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default memo(Dashboard);
