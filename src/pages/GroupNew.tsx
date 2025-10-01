import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function GroupNew() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    asset_value: "",
    total_quotas: "",
    monthly_value: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("consortium_groups")
        .insert({
          description: formData.description,
          asset_value: parseFloat(formData.asset_value),
          total_quotas: parseInt(formData.total_quotas),
          monthly_value: parseFloat(formData.monthly_value),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Grupo criado com sucesso!",
        description: "Agora você pode vincular cotas aos membros",
      });

      navigate(`/groups/${data.id}`);
    } catch (error: unknown) {
      toast({
        title: "Erro ao criar grupo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Novo Grupo de Consórcio</h1>
          <p className="text-muted-foreground">Cadastre um novo grupo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Bem *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset_value">Valor do Bem *</Label>
                  <Input
                    id="asset_value"
                    type="number"
                    step="0.01"
                    value={formData.asset_value}
                    onChange={(e) => setFormData({ ...formData, asset_value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_value">Valor Mensal *</Label>
                  <Input
                    id="monthly_value"
                    type="number"
                    step="0.01"
                    value={formData.monthly_value}
                    onChange={(e) => setFormData({ ...formData, monthly_value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_quotas">Quantidade de Cotas *</Label>
                <Input
                  id="total_quotas"
                  type="number"
                  value={formData.total_quotas}
                  onChange={(e) => setFormData({ ...formData, total_quotas: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/groups")} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Grupo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
