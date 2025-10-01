import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, Instagram, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Lista de todas as empresas cadastradas</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  {company.cnpj && (
                    <CardDescription>CNPJ: {company.cnpj}</CardDescription>
                  )}
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
                        <a
                          href={formatPhone(company.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-accent transition-colors"
                        >
                          {company.phone}
                        </a>
                      </div>
                    )}

                    {company.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`https://instagram.com/${company.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-accent transition-colors"
                        >
                          {company.instagram}
                        </a>
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
      </div>
    </Layout>
  );
}
