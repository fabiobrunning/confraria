import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader as Loader2, Plus, Trash2, Search } from "lucide-react";
import { fetchAddressByCep, fetchCompanyByCnpj } from "@/utils/apis";
import { logError } from "@/utils/logger";
import { cleanPhone, maskPhone } from "@/utils/phone";
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

interface Company {
  id?: string;
  name: string;
  cnpj: string;
  description: string;
  phone: string;
  instagram: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}


export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    instagram: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        logError(profileError, "Profile - loadProfile");
        toast({
          title: "Erro ao carregar perfil",
          description: profileError.message,
          variant: "destructive",
        });
      } else if (profileData) {
        setProfile(profileData);
      } else {
        toast({
          title: "Perfil não encontrado",
          description: "Não foi possível carregar o perfil do usuário",
          variant: "destructive",
        });
      }

      // Note: Companies and quotas features are not implemented yet
      // These will be added in a future update
    } catch (error: unknown) {
      logError(error, "Profile - loadProfile general");
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar CEP";
      toast({
        title: "Erro ao buscar CEP",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCnpjSearch = async (cnpj: string, companyIndex: number) => {
    try {
      const companyData = await fetchCompanyByCnpj(cnpj);
      
      const newCompanies = [...companies];
      newCompanies[companyIndex] = {
        ...newCompanies[companyIndex],
        name: companyData.name,
        address_cep: companyData.cep.replace(/\D/g, ""),
        address_street: companyData.street,
        address_number: companyData.number,
        address_complement: companyData.complement,
        address_neighborhood: companyData.neighborhood,
        address_city: companyData.city,
        address_state: companyData.state,
      };
      setCompanies(newCompanies);

      toast({
        title: "Dados encontrados",
        description: "Os campos foram preenchidos automaticamente",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao buscar CNPJ";
      toast({
        title: "Erro ao buscar CNPJ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", userId);

      if (profileError) throw profileError;

      // Note: Company management will be added in a future update

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: userId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      await supabase.auth.signOut();

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso",
      });

      navigate("/auth");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao excluir conta";
      toast({
        title: "Erro ao excluir conta",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

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

      const supabaseUrl = import.meta.env.VITE_BOLT_DATABASE_URL || import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_BOLT_DATABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/update-own-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro ao alterar senha');
      }

      toast({
        title: "Senha alterada com sucesso",
        description: "Sua nova senha já está ativa",
      });

      setShowPasswordDialog(false);
      setNewPassword("");
    } catch (error: unknown) {
      logError(error, "Profile - handlePasswordChange");

      let errorMessage = "Ocorreu um erro ao alterar a senha";

      if (error instanceof Error) {
        if (error.message?.includes("JWT")) {
          errorMessage = "Sessão inválida. Por favor, faça login novamente";
        } else if (error.message?.includes("network")) {
          errorMessage = "Erro de conexão. Verifique sua internet";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCompany = () => {
    setCompanies([
      ...companies,
      {
        name: "",
        cnpj: "",
        description: "",
        phone: "",
        instagram: "",
        address_cep: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
      },
    ]);
  };

  const removeCompany = async (index: number) => {
    const company = companies[index];
    if (company.id) {
      // Delete from database
      await supabase.from("companies").delete().eq("id", company.id);
    }
    setCompanies(companies.filter((_, i) => i !== index));
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie suas informações pessoais e empresas</p>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={maskPhone(profile.phone)}
                  onChange={(e) => setProfile({ ...profile, phone: cleanPhone(e.target.value) })}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                placeholder="@seuusuario"
                value={profile.instagram || ""}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)} className="w-full sm:w-auto">
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="address_cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="address_cep"
                    value={profile.address_cep || ""}
                    onChange={(e) => setProfile({ ...profile, address_cep: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCepSearch(profile.address_cep, false)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_street">Rua</Label>
                <Input
                  id="address_street"
                  value={profile.address_street || ""}
                  onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={profile.address_number || ""}
                  onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={profile.address_complement || ""}
                  onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro</Label>
                <Input
                  id="address_neighborhood"
                  value={profile.address_neighborhood || ""}
                  onChange={(e) => setProfile({ ...profile, address_neighborhood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  value={profile.address_city || ""}
                  onChange={(e) => setProfile({ ...profile, address_city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Input
                  id="address_state"
                  value={profile.address_state || ""}
                  onChange={(e) => setProfile({ ...profile, address_state: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Companies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Empresas</CardTitle>
                <CardDescription>Gerencie suas empresas</CardDescription>
              </div>
              <Button onClick={addCompany} size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {companies.map((company, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Empresa {index + 1}</h3>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeCompany(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <div className="flex gap-2">
                      <Input
                        value={company.cnpj}
                        onChange={(e) => {
                          const newCompanies = [...companies];
                          newCompanies[index].cnpj = e.target.value;
                          setCompanies(newCompanies);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCnpjSearch(company.cnpj, index)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Empresa *</Label>
                    <Input
                      value={company.name}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].name = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={company.description}
                    onChange={(e) => {
                      const newCompanies = [...companies];
                      newCompanies[index].description = e.target.value;
                      setCompanies(newCompanies);
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={maskPhone(company.phone)}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].phone = cleanPhone(e.target.value);
                        setCompanies(newCompanies);
                      }}
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      placeholder="@empresa"
                      value={company.instagram}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].instagram = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        value={company.address_cep}
                        onChange={(e) => {
                          const newCompanies = [...companies];
                          newCompanies[index].address_cep = e.target.value;
                          setCompanies(newCompanies);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCepSearch(company.address_cep, true, index)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Rua</Label>
                    <Input
                      value={company.address_street}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_street = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={company.address_number}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_number = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Complemento</Label>
                    <Input
                      value={company.address_complement}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_complement = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      value={company.address_neighborhood}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_neighborhood = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={company.address_city}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_city = e.target.value;
                        setCompanies(newCompanies);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={company.address_state}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index].address_state = e.target.value;
                        setCompanies(newCompanies);
                      }}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma empresa cadastrada</p>
                <Button onClick={addCompany} className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Empresa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full"
          >
            Excluir Conta
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Sua conta e todos os dados associados serão
                permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Password Dialog */}
        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Senha</AlertDialogTitle>
              <AlertDialogDescription>
                Digite sua nova senha (mínimo 6 caracteres)
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNewPassword("")}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleChangePassword} disabled={saving}>
                {saving ? "Alterando..." : "Alterar Senha"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
