import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";

interface Group {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface GroupCardProps {
  group: Group;
  isAdmin: boolean;
  onNavigate: (id: string) => void;
}

const GroupCard = memo(({ group, isAdmin, onNavigate }: Omit<GroupCardProps, 'formatCurrency'>) => {
  const handleCardClick = useCallback(() => {
    if (isAdmin) {
      onNavigate(group.id);
    }
  }, [isAdmin, onNavigate, group.id]);

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{group.name}</CardTitle>
        {group.description && (
          <CardDescription>
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Badge variant={group.is_active ? "default" : "secondary"}>
          {group.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </CardContent>
    </Card>
  );
});

function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    const { data: groupsData, error } = await supabase
      .from("groups")
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

    setGroups(groupsData || []);
    setLoading(false);
  }, [toast]);


  const handleNavigate = useCallback((id: string) => {
    navigate(`/groups/${id}`);
  }, [navigate]);

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
              <GroupCard
                key={group.id}
                group={group}
                isAdmin={isAdmin}
                onNavigate={handleNavigate}
              />
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

export default memo(Groups);
