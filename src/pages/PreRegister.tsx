import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader as Loader2, RefreshCw, ArrowRight, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdmin } from "@/hooks/use-admin";
import { logError } from "@/utils/logger";
import { formatPhone, cleanPhone, maskPhone } from "@/utils/phone";

interface PreRegisteredMember {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
  address_street: string | null;
}

export default function PreRegister() {
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preRegisteredMembers, setPreRegisteredMembers] = useState<PreRegisteredMember[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    role: "member" as "admin" | "member",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPreRegisteredMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at, address_street")
      .eq("pre_registered", true)
      .order("created_at", { ascending: false });

    if (error) {
      logError(error, "PreRegister - fetchPreRegisteredMembers");
      return;
    }

    setPreRegisteredMembers(data || []);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        toast({
          title: "Acesso negado",
          description: "Apenas administradores podem acessar esta página",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      fetchPreRegisteredMembers();
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOLT_DATABASE_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1/pre-register-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: cleanPhone(formData.phone),
            role: formData.role,
          }),
        }
      );

      const data = await response.json();
      console.log('Edge Function Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Pré-cadastro realizado com sucesso!",
        description: `Senha gerada: ${data.password}`,
      });

      try {
        await fetch('https://n8n-n8n.xm9jj7.easypanel.host/webhook/cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: cleanPhone(formData.phone),
            role: formData.role,
            password: data.password,
            createdAt: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
      }

      setFormData({
        fullName: "",
        phone: "",
        role: "member",
      });

      fetchPreRegisteredMembers();
    } catch (error: unknown) {
      console.error('Erro capturado:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao realizar pré-cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCredentials = async (memberId: string, phone: string, fullName: string) => {
    setResendingId(memberId);

    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: memberId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Senha resetada!",
        description: `Nova senha: ${data.newPassword}`,
      });

      try {
        await fetch('https://n8n-n8n.xm9jj7.easypanel.host/webhook/cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: fullName,
            phone: phone,
            password: data.newPassword,
            isResend: true,
            createdAt: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao resetar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDeletePreRegister = async (memberId: string) => {
    setDeletingId(memberId);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pre_registered: false })
        .eq("id", memberId);

      if (error) throw error;

      setPreRegisteredMembers(preRegisteredMembers.filter(member => member.id !== memberId));

      toast({
        title: "Removido da lista",
        description: "O membro foi removido da lista de pré-cadastrados",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao remover da lista",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pré-Cadastro de Membros</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Cadastre novos membros no sistema</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dados Iniciais</CardTitle>
              <CardDescription>
                Uma senha aleatória será gerada para o primeiro acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    required
                    disabled={loading}
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "member") =>
                      setFormData({ ...formData, role: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Realizar Pré-Cadastro
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros Pré-Cadastrados</CardTitle>
              <CardDescription>
                Membros que ainda não finalizaram o cadastro completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preRegisteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum membro pré-cadastrado encontrado
                </p>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Nome</TableHead>
                        <TableHead className="min-w-[100px]">Telefone</TableHead>
                        <TableHead className="hidden sm:table-cell">Nível</TableHead>
                        <TableHead className="hidden md:table-cell">Data</TableHead>
                        <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preRegisteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium text-sm">{member.full_name}</TableCell>
                          <TableCell className="text-sm">{formatPhone(member.phone)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                              {member.role === "admin" ? "Admin" : "Membro"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {new Date(member.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleResendCredentials(member.id, member.phone, member.full_name)}
                                disabled={resendingId === member.id || deletingId === member.id}
                                title="Reenviar mensagem"
                              >
                                {resendingId === member.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeletePreRegister(member.id)}
                                disabled={resendingId === member.id || deletingId === member.id}
                                title="Remover da lista de pré-cadastrados"
                              >
                                {deletingId === member.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
