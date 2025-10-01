import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type QuotaStatus = Database["public"]["Enums"]["quota_status"];

interface Quota {
  id?: string;
  quota_number: number;
  member_id: string;
  status: QuotaStatus;
}

interface ExistingQuota {
  id?: string;
  quota_number: number;
  member_id: string;
  status: QuotaStatus;
}

interface Group {
  id: string;
  description: string;
  total_quotas: number;
  asset_value?: number;
  monthly_value?: number;
}

interface Member {
  id: string;
  full_name: string;
}

export default function GroupEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    if (!id) return;

    const [groupRes, quotasRes, membersRes] = await Promise.all([
      supabase.from("consortium_groups").select("*").eq("id", id).single(),
      supabase.from("quotas").select("*").eq("group_id", id).order("quota_number"),
      supabase.from("profiles").select("id, full_name"),
    ]);

    if (groupRes.data) {
      setGroup(groupRes.data);
      const existingQuotas = quotasRes.data || [];
      const totalQuotas = groupRes.data.total_quotas;
      
      // Create array with all quotas
      const allQuotas: Quota[] = [];
      for (let i = 1; i <= totalQuotas; i++) {
        const existing = existingQuotas.find((q: ExistingQuota) => q.quota_number === i);
        allQuotas.push(existing || {
          quota_number: i,
          member_id: "",
          status: "active",
        });
      }
      setQuotas(allQuotas);
    }

    if (membersRes.data) {
      setMembers(membersRes.data);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Update group
      await supabase.from("consortium_groups").update({
        description: group.description,
        asset_value: group.asset_value,
        monthly_value: group.monthly_value,
      }).eq("id", id);

      // Update quotas
      for (const quota of quotas) {
        if (quota.member_id) {
          if (quota.id) {
            await supabase.from("quotas").update({
              member_id: quota.member_id,
              status: quota.status as QuotaStatus,
            }).eq("id", quota.id);
          } else {
            await supabase.from("quotas").insert([
              {
                group_id: id as string,
                quota_number: quota.quota_number,
                member_id: quota.member_id,
                status: quota.status as QuotaStatus,
              },
            ]);
          }
        }
      }

      toast({ title: "Grupo atualizado com sucesso!" });
      navigate("/groups");
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setSaving(false);
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Grupo</h1>
          <p className="text-muted-foreground">Gerencie o grupo e suas cotas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={group?.description} onChange={(e) => setGroup({ ...group, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor do Bem</Label>
                <Input type="number" step="0.01" value={group?.asset_value} onChange={(e) => setGroup({ ...group, asset_value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Valor Mensal</Label>
                <Input type="number" step="0.01" value={group?.monthly_value} onChange={(e) => setGroup({ ...group, monthly_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cotas ({quotas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotas.map((quota, index) => (
                <div key={quota.quota_number} className="flex gap-4 items-center">
                  <Badge variant="outline">#{quota.quota_number}</Badge>
                  <Select value={quota.member_id} onValueChange={(value) => {
                    const newQuotas = [...quotas];
                    newQuotas[index].member_id = value;
                    setQuotas(newQuotas);
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={quota.status} onValueChange={(value) => {
                    const newQuotas = [...quotas];
                    newQuotas[index].status = value as QuotaStatus;
                    setQuotas(newQuotas);
                  }}>
                    <SelectTrigger className="w-40">
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

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/groups")} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>
    </Layout>
  );
}
