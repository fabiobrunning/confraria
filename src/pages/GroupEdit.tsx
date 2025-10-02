import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader as Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/use-admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quota {
  id?: string;
  quota_number: number;
  member_id: string;
  status: string;
}

interface Member {
  id: string;
  full_name: string;
}

export default function GroupEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isAdmin } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    asset_value: "",
    total_quotas: "",
    monthly_value: "",
    is_active: true,
  });
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    if (!id) return;

    setLoading(true);

    // Load group data
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (groupError || !groupData) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o grupo",
        variant: "destructive",
      });
      navigate("/groups");
      return;
    }

    setFormData({
      name: groupData.name,
      description: groupData.description || "",
      asset_value: groupData.asset_value?.toString() || "0",
      total_quotas: groupData.total_quotas?.toString() || "0",
      monthly_value: groupData.monthly_value?.toString() || "0",
      is_active: groupData.is_active,
    });

    // Load quotas
    const { data: quotasData } = await supabase
      .from("quotas")
      .select("*")
      .eq("group_id", id)
      .order("quota_number");

    // Load members
    const { data: membersData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (membersData) {
      setMembers(membersData);
    }

    // Create array with all quotas (existing + empty slots)
    const totalQuotas = parseInt(groupData.total_quotas?.toString() || "0");
    const allQuotas: Quota[] = [];

    for (let i = 1; i <= totalQuotas; i++) {
      const existing = quotasData?.find((q) => q.quota_number === i);
      allQuotas.push(existing || {
        quota_number: i,
        member_id: "",
        status: "active",
      });
    }

    setQuotas(allQuotas);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update group basic info
      const { error: groupError } = await supabase
        .from("groups")
        .update({
          name: formData.name,
          description: formData.description || null,
          asset_value: parseFloat(formData.asset_value),
          total_quotas: parseInt(formData.total_quotas),
          monthly_value: parseFloat(formData.monthly_value),
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (groupError) throw groupError;

      // Update quotas
      for (const quota of quotas) {
        if (quota.member_id) {
          if (quota.id) {
            // Update existing quota
            await supabase
              .from("quotas")
              .update({
                member_id: quota.member_id,
                status: quota.status,
              })
              .eq("id", quota.id);
          } else {
            // Insert new quota
            await supabase
              .from("quotas")
              .insert({
                group_id: id,
                quota_number: quota.quota_number,
                member_id: quota.member_id,
                status: quota.status,
              });
          }
        } else if (quota.id) {
          // Remove member from quota but keep quota
          await supabase
            .from("quotas")
            .update({
              member_id: null,
              status: "active",
            })
            .eq("id", quota.id);
        }
      }

      toast({
        title: "Grupo atualizado",
        description: "As alterações foram salvas com sucesso",
      });

      navigate("/groups");
    } catch (error: unknown) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Grupo excluído",
        description: "O grupo foi removido com sucesso",
      });

      navigate("/groups");
    } catch (error: unknown) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Editar Grupo</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie o grupo e suas cotas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset_value">Valor do Bem *</Label>
                  <Input
                    id="asset_value"
                    type="number"
                    step="0.01"
                    min="0"
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
                    min="0"
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
                  min="1"
                  value={formData.total_quotas}
                  onChange={(e) => setFormData({ ...formData, total_quotas: e.target.value })}
                  required
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  A quantidade de cotas não pode ser alterada após a criação
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Grupo ativo</Label>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Cotas ({quotas.length})</CardTitle>
            <CardDescription>
              Atribua cada cota a um membro e defina seu status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotas.map((quota, index) => (
                <div key={quota.quota_number} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center p-3 border rounded-lg">
                  <Badge variant="outline" className="w-fit">
                    Cota #{quota.quota_number}
                  </Badge>
                  <Select
                    value={quota.member_id}
                    onValueChange={(value) => {
                      const newQuotas = [...quotas];
                      newQuotas[index].member_id = value;
                      setQuotas(newQuotas);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum membro</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={quota.status}
                    onValueChange={(value) => {
                      const newQuotas = [...quotas];
                      newQuotas[index].status = value;
                      setQuotas(newQuotas);
                    }}
                    disabled={!quota.member_id}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="contemplated">Contemplada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/groups")} className="flex-1">
            Cancelar
          </Button>
          {isAdmin && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1"
            >
              Excluir Grupo
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.
                Todas as cotas vinculadas a este grupo também serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
