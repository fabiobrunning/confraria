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
import { useAdmin } from "@/hooks/use-admin";
import { Loader as Loader2, Search } from "lucide-react";
import { fetchAddressByCep } from "@/utils/apis";
import { logError } from "@/utils/logger";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function MemberEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: adminLoading } = useAdmin(true);
  
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    instagram: "",
    role: "member" as "admin" | "member",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });


  useEffect(() => {
    if (!adminLoading) {
      loadMember();
    }
  }, [id, adminLoading]);

  const loadMember = async () => {
    if (!id) return;
    
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Note: Company and quota management will be added in a future update

    setLoading(false);
  };

  const handleCepSearch = async (cep: string, isCompany: boolean, companyIndex?: number) => {
    try {
      const address = await fetchAddressByCep(cep);
      
      if (isCompany && companyIndex !== undefined) {
        const newCompanies = [...companies];
        newCompanies[companyIndex] = {
          ...newCompanies[companyIndex],
          address_street: address.street,
          address_neighborhood: address.neighborhood,
          address_city: address.city,
          address_state: address.state,
        };
        setCompanies(newCompanies);
      } else {
        setProfile({
          ...profile,
          address_street: address.street,
          address_neighborhood: address.neighborhood,
          address_city: address.city,
          address_state: address.state,
        });
      }

      toast({
        title: "Endereço encontrado",
        description: "Os campos foram preenchidos automaticamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao buscar CEP",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };


  const handleSave = async () => {
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", id);

      if (profileError) throw profileError;

      // Note: Company management will be added in a future update

      toast({
        title: "Membro atualizado",
        description: "As informações foram salvas com sucesso",
      });
      
      navigate("/members");
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/update-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          userId: id,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro ao alterar senha');
      }

      toast({
        title: "Senha alterada",
        description: "A senha foi alterada com sucesso",
      });

      setShowPasswordDialog(false);
      setNewPassword("");
    } catch (error: unknown) {
      logError(error, "MemberEdit - handlePasswordChange");
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido. Verifique se as Edge Functions estão implantadas.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/reset-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ userId: id })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }

      if (data?.newPassword) {
        toast({
          title: "Senha resetada",
          description: `Nova senha gerada: ${data.newPassword}`,
        });
        setShowPasswordDialog(false);
        setNewPassword("");
      } else {
        throw new Error('Erro ao gerar nova senha');
      }
    } catch (error: unknown) {
      logError(error, "MemberEdit - handlePasswordReset");
      toast({
        title: "Erro ao resetar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido. Verifique se as Edge Functions estão implantadas.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(id!);
      
      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso",
      });
      
      navigate("/members");
    } catch (error: unknown) {
      toast({
        title: "Erro ao excluir conta",
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Membro</h1>
          <p className="text-muted-foreground">Gerencie as informações do membro</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <div className="flex gap-2">
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                  {profile.phone && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(formatPhone(profile.phone), '_blank', 'noopener,noreferrer')}
                      title="Abrir no WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  placeholder="@usuario"
                  value={profile.instagram || ""}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select value={profile.role} onValueChange={(value: "admin" | "member") => setProfile({ ...profile, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                  Alterar Senha
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input
                    value={profile.address_cep || ""}
                    onChange={(e) => setProfile({ ...profile, address_cep: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCepSearch(profile.address_cep, false)}
                    disabled={!profile.address_cep}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input
                  value={profile.address_street || ""}
                  onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={profile.address_number || ""}
                  onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={profile.address_complement || ""}
                  onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={profile.address_neighborhood || ""}
                  onChange={(e) => setProfile({ ...profile, address_neighborhood: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={profile.address_city || ""}
                  onChange={(e) => setProfile({ ...profile, address_city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  maxLength={2}
                  value={profile.address_state || ""}
                  onChange={(e) => setProfile({ ...profile, address_state: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </CardContent>
        </Card>


        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={() => navigate("/members")} className="flex-1">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="flex-1">
            Excluir Conta
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A conta do membro será permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount}>Confirmar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Password Reset Dialog */}
        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Senha</AlertDialogTitle>
              <AlertDialogDescription>
                Temporariamente, ambos os botões irão gerar uma senha automática de 6 dígitos. A funcionalidade de senha personalizada será habilitada em breve.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
              </div>
            </div>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button variant="outline" onClick={handleResetPassword}>
                Resetar (Gerar Automática)
              </Button>
              <AlertDialogAction onClick={handleChangePassword}>
                Salvar Senha
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
