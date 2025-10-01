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
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import { fetchAddressByCep, fetchCompanyByCnpj } from "@/utils/apis";
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

interface MemberCompany {
  companies: Company;
}

interface QuotaData {
  id: string;
  quota_number: number;
  status: string;
  consortium_groups: {
    description: string;
  };
}

interface Quota {
  id: string;
  quota_number: number;
  status: string;
  group: {
    description: string;
  };
}

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

  const [companies, setCompanies] = useState<Company[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);

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

    const { data: memberCompanies } = await supabase
      .from("member_companies")
      .select(`companies (*)`)
      .eq("member_id", id);

    if (memberCompanies) {
      setCompanies(memberCompanies.map((mc: MemberCompany) => mc.companies));
    }

    const { data: quotasData } = await supabase
      .from("quotas")
      .select(`
        id,
        quota_number,
        status,
        consortium_groups (description)
      `)
      .eq("member_id", id);

    if (quotasData) {
      setQuotas(quotasData.map((q: QuotaData) => ({
        ...q,
        group: q.consortium_groups,
      })));
    }

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
      toast({
        title: "Erro ao buscar CNPJ",
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

      for (const company of companies) {
        if (company.id) {
          await supabase
            .from("companies")
            .update(company)
            .eq("id", company.id);
        } else {
          const { data: newCompany, error: companyError } = await supabase
            .from("companies")
            .insert({
              ...company,
              id: undefined,
            })
            .select()
            .single();

          if (companyError) throw companyError;

          await supabase
            .from("member_companies")
            .insert({
              member_id: id,
              company_id: newCompany.id,
            });
        }
      }

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
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        id!,
        { password: newPassword }
      );

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "A senha foi alterada com sucesso",
      });

      setShowPasswordDialog(false);
      setNewPassword("");
    } catch (error: unknown) {
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
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
      await supabase.from("member_companies").delete().eq("member_id", id).eq("company_id", company.id);
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

        {/* Companies Section - keeping existing code structure */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Empresas</CardTitle>
              <Button onClick={addCompany} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Empresa
              </Button>
            </div>
            <CardDescription>Empresas vinculadas a este membro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {companies.map((company, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Empresa {index + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompany(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Company form fields - same as Profile.tsx */}
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
                          variant="outline"
                          size="icon"
                          onClick={() => handleCnpjSearch(company.cnpj, index)}
                          disabled={!company.cnpj}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome</Label>
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
                      <div className="flex gap-2">
                        <Input
                          value={company.phone}
                          onChange={(e) => {
                            const newCompanies = [...companies];
                            newCompanies[index].phone = e.target.value;
                            setCompanies(newCompanies);
                          }}
                        />
                        {company.phone && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(formatPhone(company.phone), '_blank', 'noopener,noreferrer')}
                            title="Abrir no WhatsApp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                          </Button>
                        )}
                      </div>
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

                  {/* Address fields for company */}
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
                          variant="outline"
                          size="icon"
                          onClick={() => handleCepSearch(company.address_cep, true, index)}
                          disabled={!company.address_cep}
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
                        value={company.address_street}
                        onChange={(e) => {
                          const newCompanies = [...companies];
                          newCompanies[index].address_street = e.target.value;
                          setCompanies(newCompanies);
                        }}
                      />
                    </div>
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                        maxLength={2}
                        value={company.address_state}
                        onChange={(e) => {
                          const newCompanies = [...companies];
                          newCompanies[index].address_state = e.target.value.toUpperCase();
                          setCompanies(newCompanies);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Quotas Display */}
        {quotas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cotas do Membro</CardTitle>
              <CardDescription>Cotas de consórcio vinculadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quotas.map((quota) => (
                  <div key={quota.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{quota.group.description}</p>
                      <p className="text-sm text-muted-foreground">Cota #{quota.quota_number}</p>
                    </div>
                    <Badge variant={quota.status === "active" ? "default" : "secondary"}>
                      {quota.status === "active" ? "Ativa" : "Contemplada"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Password Dialog */}
        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Senha</AlertDialogTitle>
              <AlertDialogDescription>
                Digite a nova senha para o membro (mínimo 6 caracteres)
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
              <AlertDialogAction onClick={handleChangePassword}>Alterar Senha</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
