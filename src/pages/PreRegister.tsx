import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
      .is("address_street", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar membros pré-cadastrados:", error);
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
      const { data, error } = await supabase.functions.invoke('pre-register-member', {
        body: {
          fullName: formData.fullName,
          phone: formData.phone,
          role: formData.role,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Pré-cadastro realizado com sucesso!",
        description: `Senha gerada: ${data.password}`,
      });

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        role: "member",
      });

      // Refresh list
      fetchPreRegisteredMembers();
    } catch (error: any) {
      toast({
        title: "Erro ao realizar pré-cadastro",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCredentials = async (memberId: string, phone: string, fullName: string) => {
    setResendingId(memberId);

    try {
      const { data, error } = await supabase.functions.invoke('pre-register-member', {
        body: {
          fullName,
          phone,
          role: "member",
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Credenciais reenviadas!",
        description: `Nova senha gerada: ${data.password}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar credenciais",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pré-Cadastro de Membros</h1>
            <p className="text-muted-foreground">Cadastre novos membros no sistema</p>
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={loading}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preRegisteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role === "admin" ? "Administrador" : "Membro"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendCredentials(member.id, member.phone, member.full_name)}
                            disabled={resendingId === member.id}
                          >
                            {resendingId === member.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reenviar Acesso
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
