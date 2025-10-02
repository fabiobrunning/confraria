import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, DollarSign, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";

interface Group {
  id: string;
  description: string;
  asset_value: number;
  total_quotas: number;
  monthly_value: number;
  active_quotas: number;
  contemplated_quotas: number;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const { data: groupsData, error } = await supabase
      .from("consortium_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Load quotas count for each group
    const groupsWithQuotas = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { data: quotasData } = await supabase
          .from("quotas")
          .select("status")
          .eq("group_id", group.id);

        return {
          ...group,
          active_quotas: quotasData?.filter((q) => q.status === "active").length || 0,
          contemplated_quotas: quotasData?.filter((q) => q.status === "contemplated").length || 0,
        };
      })
    );

    setGroups(groupsWithQuotas);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Grupos de Consórcio</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie os grupos de consórcio</p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/groups/new")} className="w-full sm:w-auto sm:self-start">
              <Plus className="mr-2 h-4 w-4" />
              Novo Grupo
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => isAdmin && navigate(`/groups/${group.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{group.description}</CardTitle>
                  <CardDescription>
                    {group.total_quotas} cotas no total
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor do Bem:</span>
                      <span className="font-semibold">{formatCurrency(group.asset_value)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor Mensal:</span>
                      <span className="font-semibold">{formatCurrency(group.monthly_value)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-success/10">
                        {group.active_quotas} Ativas
                      </Badge>
                      <Badge variant="outline" className="bg-accent/10">
                        {group.contemplated_quotas} Contempladas
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum grupo cadastrado</p>
              {isAdmin && (
                <Button onClick={() => navigate("/groups/new")} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Grupo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
