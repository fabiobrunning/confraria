import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Layers, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    members: 0,
    companies: 0,
    groups: 0,
    activeQuotas: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
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
  };

  const statCards = [
    {
      title: "Total de Membros",
      value: stats.members,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Empresas Cadastradas",
      value: stats.companies,
      icon: Building2,
      color: "text-accent",
    },
    {
      title: "Grupos de Consórcio",
      value: stats.groups,
      icon: Layers,
      color: "text-success",
    },
    {
      title: "Cotas Ativas",
      value: stats.activeQuotas,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de consórcios</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
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
