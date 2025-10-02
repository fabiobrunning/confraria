import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/use-admin";

interface Member {
  id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
  role: string;
  companies: { name: string }[];
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter((member) =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        phone,
        instagram,
        role,
        member_companies!inner (
          companies (
            name
          )
        )
      `);

    if (!error && data) {
      const processedMembers = data.map((member: any) => ({
        ...member,
        companies: member.member_companies?.map((mc: any) => mc.companies) || [],
      }));
      setMembers(processedMembers);
      setFilteredMembers(processedMembers);
    }
    setLoading(false);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Membros</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Lista de todos os membros cadastrados</p>
          </div>
          <Button onClick={() => navigate("/profile")} className="w-full sm:w-auto sm:self-start">
            Ver Meu Perfil
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
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
            {filteredMembers.map((member) => (
              <Card 
                key={member.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => isAdmin && navigate(`/members/${member.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{member.full_name}</CardTitle>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? "Admin" : "Membro"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(formatPhone(member.phone), '_blank', 'noopener,noreferrer');
                      }}
                      className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
                    >
                      {member.phone}
                    </button>
                  </div>

                  {member.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const username = member.instagram!.replace(/[@\s]/g, "");
                          window.open(`https://www.instagram.com/${username}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
                      >
                        {member.instagram}
                      </button>
                    </div>
                  )}

                  {member.companies.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Empresas:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.companies.map((company, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {company.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum membro encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
