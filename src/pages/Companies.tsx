import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { formatPhone as formatPhoneDisplay } from "@/utils/phone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, Instagram, MapPin, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
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

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  description: string | null;
  phone: string | null;
  instagram: string | null;
  address_city: string | null;
  address_state: string | null;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj?.includes(searchTerm) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name");

    if (!error && data) {
      setCompanies(data);
      setFilteredCompanies(data);
    }
    setLoading(false);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: "A empresa foi removida com sucesso",
      });

      await loadCompanies();
    } catch (error: unknown) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Empresas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Lista de todas as empresas cadastradas</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      {company.cnpj && (
                        <CardDescription>CNPJ: {company.cnpj}</CardDescription>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(company.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(formatPhone(company.phone!), '_blank', 'noopener,noreferrer');
                          }}
                          className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
                        >
                          {formatPhoneDisplay(company.phone)}
                        </button>
                      </div>
                    )}

                    {company.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const username = company.instagram!.replace(/[@\s]/g, "");
                            window.open(`https://www.instagram.com/${username}`, '_blank', 'noopener,noreferrer');
                          }}
                          className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
                        >
                          {company.instagram}
                        </button>
                      </div>
                    )}

                    {(company.address_city || company.address_state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {company.address_city}
                          {company.address_city && company.address_state && " - "}
                          {company.address_state}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCompanies.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.
                Os vínculos desta empresa com membros também serão removidos.
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
